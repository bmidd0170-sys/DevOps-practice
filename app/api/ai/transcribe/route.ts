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

function normalizeErrorStatus(error: unknown): number {
    if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof (error as { status?: unknown }).status === 'number'
    ) {
        return (error as { status: number }).status;
    }

    return 500;
}

function normalizeErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function shouldFallbackModel(status: number, message: string): boolean {
    if (![400, 403, 404].includes(status)) {
        return false;
    }

    const lower = message.toLowerCase();
    return (
        lower.includes('model') ||
        lower.includes('not found') ||
        lower.includes('permission') ||
        lower.includes('access') ||
        lower.includes('forbidden')
    );
}

function getCandidateModels(primaryModel: string): string[] {
    const candidates = [primaryModel.trim(), 'whisper-1'];
    return Array.from(new Set(candidates.filter((candidate) => candidate.length > 0)));
}

export async function POST(request: Request) {
    if (!openai) {
        return Response.json(
            { error: 'OPENAI_API_KEY is not configured. Set OPENAI_API_KEY or OPENAI_API_KEY_FILE.' },
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
        const candidateModels = getCandidateModels(model);
        let transcription: Awaited<ReturnType<typeof openai.audio.transcriptions.create>> | null = null;
        let usedModel = candidateModels[0];
        let lastError: unknown = null;

        for (const candidateModel of candidateModels) {
            try {
                transcription = await openai.audio.transcriptions.create({
                    file: audioFile,
                    model: candidateModel,
                    response_format: 'verbose_json',
                    ...(typeof language === 'string' && language.trim()
                        ? { language: language.trim() }
                        : {}),
                });
                usedModel = candidateModel;
                lastError = null;
                break;
            } catch (error) {
                const status = normalizeErrorStatus(error);
                const message = normalizeErrorMessage(error);
                lastError = error;

                if (!shouldFallbackModel(status, message) || candidateModel === candidateModels[candidateModels.length - 1]) {
                    throw error;
                }
            }
        }

        if (!transcription) {
            throw lastError || new Error('No transcription model could process the audio');
        }

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
            model: usedModel,
        });
    } catch (error) {
        const status = normalizeErrorStatus(error);
        const message = normalizeErrorMessage(error);

        return Response.json(
            {
                error: 'Failed to transcribe audio',
                details: message,
                hint:
                    status === 403
                        ? 'Your OpenAI project may not have access to the configured transcription model. Try OPENAI_TRANSCRIBE_MODEL=whisper-1 or use a key/project with model access.'
                        : undefined,
            },
            { status }
        );
    }
}
