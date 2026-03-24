import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getOpenAIApiKey, getOpenAIChatModel } from '@/lib/env';
import { getDatabaseUrl } from '@/lib/env';
import { getAuthHeaders } from '@/lib/server-auth';

const apiKey = getOpenAIApiKey();
const model = getOpenAIChatModel();
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const databaseUrl = getDatabaseUrl();

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

let prisma: PrismaClient | null = null;

if (databaseUrl) {
    prisma = globalForPrisma.prisma || new PrismaClient({
        adapter: new PrismaPg({
            connectionString: databaseUrl,
        }),
    });

    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma;
    }
}

function getUserDelegate() {
    const delegate = (prisma as PrismaClient & {
        user?: {
            findUnique: (args: {
                where: { firebaseUid: string };
                select: { id: true };
            }) => Promise<{ id: string } | null>;
        };
    } | null)?.user;

    return delegate ?? null;
}

function getNoteDelegate() {
    const delegate = (prisma as PrismaClient & {
        note?: {
            findFirst: (args: {
                where: { id: number; userId: string };
                select: { title: true; content: true };
            }) => Promise<{ title: string; content: string } | null>;
        };
    } | null)?.note;

    return delegate ?? null;
}

function getAiQuestionDelegate() {
    const delegate = (prisma as PrismaClient & {
        aiQuestion?: {
            create: (args: {
                data: {
                    userId: string;
                    noteId?: number;
                    question: string;
                    answer: string;
                };
            }) => Promise<{ id: number }>;
        };
    } | null)?.aiQuestion;

    return delegate ?? null;
}

interface ChatRequestBody {
    prompt?: string;
    noteContent?: string;
    noteId?: string;
    noteTitle?: string;
}

function parseNoteId(rawId: string): number | null {
    const id = Number.parseInt(rawId, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }
    return id;
}

export async function POST(request: Request) {
    if (!openai) {
        return Response.json(
            { error: 'OPENAI_API_KEY is not configured. Set OPENAI_API_KEY or OPENAI_API_KEY_FILE.' },
            { status: 500 }
        );
    }

    let body: ChatRequestBody;
    try {
        body = await request.json();
    } catch {
        return Response.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    const prompt = body.prompt?.trim();
    const noteContent = body.noteContent?.trim() || '';
    const noteTitle = body.noteTitle?.trim() || '';
    const noteId = body.noteId?.trim();

    if (!prompt) {
        return Response.json(
            { error: 'Prompt is required' },
            { status: 400 }
        );
    }

    const authHeaders = getAuthHeaders(request);
    if (!authHeaders) {
        return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    let userId: string | null = null;
    const userDelegate = getUserDelegate();
    if (userDelegate) {
        try {
            const user = await userDelegate.findUnique({
                where: { firebaseUid: authHeaders.uid },
                select: { id: true },
            });
            userId = user?.id ?? null;
        } catch {
            userId = null;
        }
    }

    let resolvedNoteTitle = noteTitle;
    let resolvedNoteContent = noteContent;

    const noteDelegate = getNoteDelegate();

    if (!resolvedNoteContent && noteId && noteId !== 'new' && noteDelegate && userId) {
        const parsedId = parseNoteId(noteId);
        if (parsedId) {
            try {
                const note = await noteDelegate.findFirst({
                    where: { id: parsedId, userId },
                    select: { title: true, content: true },
                });

                if (note) {
                    resolvedNoteTitle = note.title;
                    resolvedNoteContent = note.content;
                }
            } catch {
                // If note lookup fails, continue with provided payload context.
            }
        }
    }

    const noteContextSections = [
        `Current note id: ${noteId || '(unknown)'}`,
        `Current note title: ${resolvedNoteTitle || '(untitled)'}`,
        `Current note content:\n${resolvedNoteContent || '(No note content provided)'}`,
    ];

    try {
        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are AI Buddy, a study assistant. Give clear and concise help for the user\'s notes. Use plain text with short headings and bullets when useful. If the user\'s question is unclear, ask for clarification. If the answer cannot be found in the notes, say you don\'t know but suggest how to find the answer.',
                },
                {
                    role: 'user',
                    content: `User question:\n${prompt}\n\n${noteContextSections.join('\n\n')}`,
                },
            ],
            temperature: 0.4,
        });

        const answer = response.choices[0]?.message?.content?.trim() || 'I could not generate a response.';

        const aiQuestionDelegate = getAiQuestionDelegate();
        const parsedNoteId = noteId && noteId !== 'new' ? parseNoteId(noteId) : null;

        if (aiQuestionDelegate && userId) {
            try {
                await aiQuestionDelegate.create({
                    data: {
                        userId,
                        ...(parsedNoteId ? { noteId: parsedNoteId } : {}),
                        question: prompt,
                        answer,
                    },
                });
            } catch {
                // Do not fail chat when persistence is unavailable.
            }
        }

        return Response.json({
            answer,
            model,
        });
    } catch (error) {
        const status =
            typeof error === 'object' &&
                error !== null &&
                'status' in error &&
                typeof (error as { status?: unknown }).status === 'number'
                ? (error as { status: number }).status
                : 500;

        const message = error instanceof Error ? error.message : String(error);

        return Response.json(
            {
                error: 'Failed to generate AI response',
                details: message,
            },
            { status }
        );
    }
}
