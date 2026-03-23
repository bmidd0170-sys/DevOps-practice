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

export async function GET(request: Request) {
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

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true },
        });

        if (!user) {
            return Response.json([]);
        }

        const notes = await prisma.note.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        return Response.json(notes);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json(
            { error: 'Database unavailable', details: message },
            { status: 503 }
        );
    }
}

export async function POST(request: Request) {
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
        const existingUser = await prisma.user.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true, email: true, displayName: true },
        });

        const user = existingUser
            ? await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    ...(!existingUser.email && authHeaders.email ? { email: authHeaders.email } : {}),
                    ...(!existingUser.displayName && authHeaders.displayName
                        ? { displayName: authHeaders.displayName }
                        : {}),
                },
                select: { id: true },
            })
            : await prisma.user.create({
                data: {
                    firebaseUid: authHeaders.uid,
                    email: authHeaders.email,
                    displayName: authHeaders.displayName,
                },
                select: { id: true },
            });

        const note = await prisma.note.create({
            data: {
                title,
                content,
                userId: user.id,
            }
        });
        return Response.json(note, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return Response.json(
            { error: 'Database unavailable', details: message },
            { status: 503 }
        );
    }
}