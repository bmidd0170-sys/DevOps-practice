import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseUrl } from '@/lib/env';
import { getAuthHeaders } from '@/lib/server-auth';

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

    const authHeaders = getAuthHeaders(request);
    if (!authHeaders) {
        return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
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

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json(
            { error: 'Database unavailable', details: message },
            { status: 503 }
        );
    }

    if (!user) {
        return Response.json(
            { error: 'Note not found' },
            { status: 404 }
        );
    }

    let note;
    try {
        note = await prisma.note.findFirst({
            where: { id: parsedId, userId: user.id }
        });
        if (!note) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json(
            { error: 'Database unavailable', details: message },
            { status: 503 }
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

    const authHeaders = getAuthHeaders(request);
    if (!authHeaders) {
        return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
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
        const user = await prisma.user.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true },
        });

        if (!user) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        const existing = await prisma.note.findFirst({
            where: { id: parsedId, userId: user.id },
            select: { id: true },
        });

        if (!existing) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        const note = await prisma.note.update({
            where: { id: parsedId },
            data: { title, content },
        });
        return Response.json(note);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Record to update not found')) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }
        return Response.json(
            { error: 'Database unavailable', details: message },
            { status: 503 }
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

    const authHeaders = getAuthHeaders(request);
    if (!authHeaders) {
        return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
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
        const user = await prisma.user.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true },
        });

        if (!user) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        const existing = await prisma.note.findFirst({
            where: { id: parsedId, userId: user.id },
            select: { id: true },
        });

        if (!existing) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }

        await prisma.note.delete({ where: { id: parsedId } });
        return new Response(null, { status: 204 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('Record to delete does not exist')) {
            return Response.json(
                { error: 'Note not found' },
                { status: 404 }
            );
        }
        return Response.json(
            { error: 'Database unavailable', details: message },
            { status: 503 }
        );
    }
}