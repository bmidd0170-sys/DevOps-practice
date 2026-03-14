import OpenAI from 'openai';
import { getOpenAIApiKey, getOpenAIChatModel } from '@/lib/env';

const apiKey = getOpenAIApiKey();
const model = getOpenAIChatModel();
const openai = apiKey ? new OpenAI({ apiKey }) : null;

interface ChatRequestBody {
    prompt?: string;
    noteContent?: string;
}

export async function POST(request: Request) {
    if (!openai) {
        return Response.json(
            { error: 'OPENAI_API_KEY is not configured' },
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

    if (!prompt) {
        return Response.json(
            { error: 'Prompt is required' },
            { status: 400 }
        );
    }

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
                    content: `User question:\n${prompt}\n\nCurrent notes:\n${noteContent || '(No note content provided)'}`,
                },
            ],
            temperature: 0.4,
        });

        return Response.json({
            answer: response.choices[0]?.message?.content?.trim() || 'I could not generate a response.',
            model,
        });
    } catch (error) {
        return Response.json(
            {
                error: 'Failed to generate AI response',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
