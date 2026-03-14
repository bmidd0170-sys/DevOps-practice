import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseUrl } from '@/lib/env';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

let prisma: PrismaClient | null = null;
const databaseUrl = getDatabaseUrl();

if (databaseUrl) {
    prisma = globalForPrisma.prisma || new PrismaClient({
        adapter: new PrismaPg({
            connectionString: databaseUrl,
        }),
    });

    if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prisma;
    }
}

export async function GET() {
    if (!prisma) {
        return Response.json(
            { error: 'Database not configured' },
            { status: 500 }
        );
    }

    const notes = await prisma.note.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return Response.json(notes);
}

export async function POST(request: Request) {
    if (!prisma) {
        return Response.json(
            { error: 'Database not configured' },
            { status: 500 }
        );
    }

    const body = await request.json().catch(() => null);
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!title || !content) {
        return Response.json(
            { error: 'Title and content are required' },
            { status: 400 }
        );
    }

    const note = await prisma.note.create({
        data: {
            title,
            content,
        }
    });
    return Response.json(note, { status: 201 });
}