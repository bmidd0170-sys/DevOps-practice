import { Pool } from 'pg';
import { getDatabaseUrl, getOpenAIApiKey, getSmtpConfigDebug, isSmtpConfigured } from '@/lib/env';

let pool: Pool | null = null;
const databaseUrl = getDatabaseUrl();

if (databaseUrl) {
    pool = new Pool({
        connectionString: databaseUrl,
    });
}

export async function GET() {
    const smtpDebug = getSmtpConfigDebug();
    const services = {
        databaseConfigured: Boolean(databaseUrl),
        aiConfigured: Boolean(getOpenAIApiKey()),
        smtpConfigured: isSmtpConfigured(),
    };

    if (!pool) {
        return Response.json({
            status: 'unhealthy',
            error: 'Database not configured',
            services,
            smtpDebug,
        }, { status: 500 });
    }

    try {
        const result = await pool.query('SELECT NOW()');
        return Response.json({
            status: 'healthy',
            database: 'connected',
            time: result.rows[0].now,
            services,
            smtpDebug,
        });
    } catch (error) {
        return Response.json({
            status: 'unhealthy',
            error: String(error),
            services,
            smtpDebug,
        }, { status: 500 });
    }
}