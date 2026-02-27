import { Pool } from 'pg';

let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
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