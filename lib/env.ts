import { readFileSync } from 'node:fs';

function readEnv(name: string): string | undefined {
    const directValue = process.env[name]?.trim();
    if (directValue) {
        return directValue;
    }

    const filePath = process.env[`${name}_FILE`]?.trim();
    if (!filePath) {
        return undefined;
    }

    try {
        const fileValue = readFileSync(filePath, 'utf8').trim();
        return fileValue || undefined;
    } catch {
        return undefined;
    }
}

export function getDatabaseUrl(): string | undefined {
    return readEnv('DATABASE_URL');
}

export function getOpenAIApiKey(): string | undefined {
    return readEnv('OPENAI_API_KEY');
}

export function getOpenAIChatModel(): string {
    return readEnv('OPENAI_CHAT_MODEL') || 'gpt-4.1-mini';
}

export function getOpenAITranscribeModel(): string {
    return readEnv('OPENAI_TRANSCRIBE_MODEL') || 'gpt-4o-mini-transcribe';
}

export function getSmtpHost(): string | undefined {
    return readEnv('SMTP_HOST');
}

export function getSmtpPort(): number {
    const port = readEnv('SMTP_PORT');
    if (!port) {
        return 587;
    }

    const parsed = parseInt(port, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
}

export function getSmtpUser(): string | undefined {
    return readEnv('SMTP_USER');
}

export function getSmtpPass(): string | undefined {
    const value = readEnv('SMTP_PASS');
    return value ? value.replace(/\s+/g, '') : undefined;
}

export function getSmtpFrom(): string {
    return readEnv('SMTP_FROM') || 'NoteAI <noreply@noteai.app>';
}

export interface SmtpConfigDebug {
    hasHost: boolean;
    hasUser: boolean;
    hasPass: boolean;
    missing: Array<'SMTP_HOST' | 'SMTP_USER' | 'SMTP_PASS'>;
}

export function getSmtpConfigDebug(): SmtpConfigDebug {
    const hasHost = Boolean(getSmtpHost());
    const hasUser = Boolean(getSmtpUser());
    const hasPass = Boolean(getSmtpPass());
    const missing: SmtpConfigDebug['missing'] = [];

    if (!hasHost) missing.push('SMTP_HOST');
    if (!hasUser) missing.push('SMTP_USER');
    if (!hasPass) missing.push('SMTP_PASS');

    return { hasHost, hasUser, hasPass, missing };
}

export function isSmtpConfigured(): boolean {
    return Boolean(getSmtpHost() && getSmtpUser() && getSmtpPass());
}
