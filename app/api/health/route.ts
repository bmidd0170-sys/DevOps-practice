import { Pool } from 'pg';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function GET() {
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