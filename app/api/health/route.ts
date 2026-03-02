import { Pool } from 'pg';
import { getDatabaseUrl } from '@/lib/env';

let pool: Pool | null = null;
const databaseUrl = getDatabaseUrl();

if (databaseUrl) {
    pool = new Pool({
        connectionString: databaseUrl,
    });
}

export async function GET() {
    if (!pool) {
        return Response.json({
            status: 'unhealthy',
            error: 'Database not configured'
        }, { status: 500 });
    }

    try {
        const result = await pool.query('SELECT NOW()');
        return Response.json({
            status: 'healthy',
            database: 'connected',
            time: result.rows[0].now
        });
    } catch (error) {
        return Response.json({
            status: 'unhealthy',
            error: String(error)
        }, { status: 500 });
    }
}