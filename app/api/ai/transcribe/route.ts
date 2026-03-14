import OpenAI from 'openai';
import { getOpenAIApiKey, getOpenAITranscribeModel } from '@/lib/env';

const apiKey = getOpenAIApiKey();
const model = getOpenAITranscribeModel();
const openai = apiKey ? new OpenAI({ apiKey }) : null;

interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
}

export async function POST(request: Request) {
    if (!openai) {
        return Response.json(
            { error: 'OPENAI_API_KEY is not configured' },
            { status: 500 }
        );
    }

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return Response.json(
            { error: 'Invalid multipart form body' },
            { status: 400 }
        );
    }

    const audioFile = formData.get('audio');
    if (!(audioFile instanceof File)) {
        return Response.json(
            { error: 'audio file is required' },
            { status: 400 }
        );
    }

    const language = formData.get('language');

    try {
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model,
            response_format: 'verbose_json',
            ...(typeof language === 'string' && language.trim()
                ? { language: language.trim() }
                : {}),
        });

        const rawSegments =
            'segments' in transcription && Array.isArray(transcription.segments)
                ? transcription.segments
                : [];

        const segments: TranscriptSegment[] = rawSegments
            .filter((segment) => typeof segment.text === 'string')
            .map((segment) => ({
                start: typeof segment.start === 'number' ? segment.start : 0,
                end: typeof segment.end === 'number' ? segment.end : 0,
                text: segment.text.trim(),
            }))
            .filter((segment) => segment.text.length > 0);

        return Response.json({
            text: transcription.text?.trim() || '',
            segments,
            model,
        });
    } catch (error) {
        return Response.json(
            {
                error: 'Failed to transcribe audio',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
