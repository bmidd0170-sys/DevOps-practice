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
