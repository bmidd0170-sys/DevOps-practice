import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

let prisma: PrismaClient | null = null;

if (process.env.DATABASE_URL) {
    prisma = globalForPrisma.prisma || new PrismaClient({
        adapter: new PrismaPg({
            connectionString: process.env.DATABASE_URL,
        }),
    });

    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma;
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!prisma) {
        return Response.json(
            { error: 'Database not configured' },
            { status: 500 }
        );
    }

    const { id } = await params;
    const note = await prisma.note.findUnique({
        where: { id: parseInt(id) }
    });
    if (!note) {
        return Response.json(
            { error: 'Note not found' },
            { status: 404 }
        );
    }
    return Response.json(note);
}