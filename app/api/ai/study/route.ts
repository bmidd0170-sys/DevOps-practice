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

interface StudyRequestBody {
    noteId?: string;
}

interface GeneratedFlashcard {
    front: string;
    back: string;
}

interface GeneratedQuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface GeneratedStudySet {
    flashcards: GeneratedFlashcard[];
    quiz: GeneratedQuizQuestion[];
}

function parseNoteId(rawId: string): number | null {
    const id = Number.parseInt(rawId, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }
    return id;
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

function normalizeStudySet(payload: unknown): GeneratedStudySet | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const maybeFlashcards = (payload as { flashcards?: unknown }).flashcards;
    const maybeQuiz = (payload as { quiz?: unknown }).quiz;

    if (!Array.isArray(maybeFlashcards) || !Array.isArray(maybeQuiz)) {
        return null;
    }

    const flashcards = maybeFlashcards
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const front = (item as { front?: unknown }).front;
            const back = (item as { back?: unknown }).back;

            if (typeof front !== 'string' || typeof back !== 'string') return null;

            const normalizedFront = front.trim();
            const normalizedBack = back.trim();
            if (!normalizedFront || !normalizedBack) return null;

            return { front: normalizedFront, back: normalizedBack };
        })
        .filter((item): item is GeneratedFlashcard => Boolean(item))
        .slice(0, 14);

    const quiz = maybeQuiz
        .map((item) => {
            if (!item || typeof item !== 'object') return null;

            const question = (item as { question?: unknown }).question;
            const options = (item as { options?: unknown }).options;
            const correctAnswer = (item as { correctAnswer?: unknown }).correctAnswer;

            if (typeof question !== 'string' || !Array.isArray(options) || typeof correctAnswer !== 'number') {
                return null;
            }

            const normalizedQuestion = question.trim();
            const normalizedOptions = options
                .map((option) => (typeof option === 'string' ? option.trim() : ''))
                .filter(Boolean)
                .slice(0, 4);

            if (!normalizedQuestion || normalizedOptions.length !== 4) {
                return null;
            }

            const normalizedCorrect = Math.max(0, Math.min(3, Math.trunc(correctAnswer)));

            return {
                question: normalizedQuestion,
                options: normalizedOptions,
                correctAnswer: normalizedCorrect,
            };
        })
        .filter((item): item is GeneratedQuizQuestion => Boolean(item))
        .slice(0, 8);

    if (flashcards.length === 0 || quiz.length === 0) {
        return null;
    }

    return { flashcards, quiz };
}

export async function POST(request: Request) {
    if (!openai) {
        return Response.json(
            { error: 'OPENAI_API_KEY is not configured. Set OPENAI_API_KEY or OPENAI_API_KEY_FILE.' },
            { status: 500 }
        );
    }

    if (!prisma) {
        return Response.json(
            { error: 'Database not configured' },
            { status: 500 }
        );
    }

    let body: StudyRequestBody;
    try {
        body = await request.json();
    } catch {
        return Response.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    const noteId = body.noteId?.trim();
    if (!noteId) {
        return Response.json(
            { error: 'noteId is required' },
            { status: 400 }
        );
    }

    const parsedNoteId = parseNoteId(noteId);
    if (!parsedNoteId) {
        return Response.json(
            { error: 'Invalid note id' },
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

    const userDelegate = getUserDelegate();
    const noteDelegate = getNoteDelegate();

    if (!userDelegate || !noteDelegate) {
        return Response.json(
            { error: 'Study generation is currently unavailable' },
            { status: 503 }
        );
    }

    try {
        const user = await userDelegate.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true },
        });

        if (!user) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        const note = await noteDelegate.findFirst({
            where: { id: parsedNoteId, userId: user.id },
            select: { title: true, content: true },
        });

        if (!note) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        const response = await openai.chat.completions.create({
            model,
            response_format: { type: 'json_object' },
            temperature: 0.4,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a study-content generator. Return strict JSON only with this exact shape: { "flashcards": [{"front":"...","back":"..."}], "quiz": [{"question":"...","options":["...","...","...","..."],"correctAnswer":0}] }. Create 8-12 flashcards and 5-8 quiz questions. Keep flashcard fronts short prompts and backs concise explanations based only on the provided note. For each quiz question, include exactly 4 options and set correctAnswer to the 0-based index of the correct option. Do not include markdown, code fences, or extra keys.',
                },
                {
                    role: 'user',
                    content: `Note title: ${note.title}\n\nNote content:\n${note.content}`,
                },
            ],
        });

        const rawContent = response.choices[0]?.message?.content?.trim() || '';
        const parsed = rawContent ? JSON.parse(rawContent) : null;
        const normalized = normalizeStudySet(parsed);

        if (!normalized) {
            return Response.json(
                { error: 'Failed to parse generated study content' },
                { status: 502 }
            );
        }

        return Response.json({
            noteTitle: note.title,
            flashcards: normalized.flashcards,
            quiz: normalized.quiz,
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
                error: 'Failed to generate study content',
                details: message,
            },
            { status }
        );
    }
}