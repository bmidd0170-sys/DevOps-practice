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

function parseNoteId(rawId: string): number | null {
    const id = Number.parseInt(rawId, 10);
    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }
    return id;
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
    const parsedId = parseNoteId(id);
    if (!parsedId) {
        return Response.json(
            { error: 'Invalid note id' },
            { status: 400 }
        );
    }

    const note = await prisma.note.findUnique({
        where: { id: parsedId }
    });
    if (!note) {
        return Response.json(
            { error: 'Note not found' },
            { status: 404 }
        );
    }
    return Response.json(note);
}

export async function PUT(
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
    const parsedId = parseNoteId(id);
    if (!parsedId) {
        return Response.json(
            { error: 'Invalid note id' },
            { status: 400 }
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

    try {
        const note = await prisma.note.update({
            where: { id: parsedId },
            data: { title, content },
        });
        return Response.json(note);
    } catch {
        return Response.json(
            { error: 'Note not found' },
            { status: 404 }
        );
    }
}

export async function DELETE(
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
    const parsedId = parseNoteId(id);
    if (!parsedId) {
        return Response.json(
            { error: 'Invalid note id' },
            { status: 400 }
        );
    }

    try {
        await prisma.note.delete({ where: { id: parsedId } });
        return new Response(null, { status: 204 });
    } catch {
        return Response.json(
            { error: 'Note not found' },
            { status: 404 }
        );
    }
}