import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
    const notes = await prisma.note.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return Response.json(notes);
}

export async function POST(request: Request) {
    const body = await request.json();
    const note = await prisma.note.create({
        data: {
            title: body.title,
            content: body.content,
        }
    });
    return Response.json(note, { status: 201 });
}