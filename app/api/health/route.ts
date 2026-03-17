import { Pool } from 'pg';
import { getDatabaseUrl, getOpenAIApiKey, isSmtpConfigured } from '@/lib/env';

let pool: Pool | null = null;
const databaseUrl = getDatabaseUrl();

if (databaseUrl) {
    pool = new Pool({
        connectionString: databaseUrl,
    });
}

export async function GET() {
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
        }, { status: 500 });
    }

    try {
        const result = await pool.query('SELECT NOW()');
        return Response.json({
            status: 'healthy',
            database: 'connected',
            time: result.rows[0].now,
            services,
        });
    } catch (error) {
        return Response.json({
            status: 'unhealthy',
            error: String(error),
            services,
        }, { status: 500 });
    }
}