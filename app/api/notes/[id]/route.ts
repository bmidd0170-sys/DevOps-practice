import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const note = await prisma.note.findUnique({
        where: { id: parseInt(params.id) }
    });
    if (!note) {
        return Response.json(
            { error: 'Note not found' },
            { status: 404 }
        );
    }
    return Response.json(note);
}