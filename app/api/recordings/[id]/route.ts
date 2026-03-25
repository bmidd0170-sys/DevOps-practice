import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getDatabaseUrl } from "@/lib/env"
import { getAuthHeaders } from "@/lib/server-auth"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

let prisma: PrismaClient | null = null
const databaseUrl = getDatabaseUrl()

if (databaseUrl) {
    prisma = globalForPrisma.prisma || new PrismaClient({
        adapter: new PrismaPg({
            connectionString: databaseUrl,
        }),
    })

    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prisma
    }
}

function getRecordingDelegate() {
    const delegate = (prisma as PrismaClient & {
        recording?: {
            findFirst: (args: {
                where: {
                    id: number
                    userId: string
                }
                select: {
                    id: true
                    title: true
                    transcript: true
                    durationSeconds: true
                    status: true
                    createdAt: true
                    updatedAt: true
                    audioSizeBytes: true
                }
            }) => Promise<{
                id: number
                title: string
                transcript: string
                audioSizeBytes: number | null
                durationSeconds: number
                status: string
                createdAt: Date
                updatedAt: Date
            } | null>
        }
    } | null)?.recording

    return delegate ?? null
}

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    if (!prisma) {
        return Response.json({ error: "Database not configured" }, { status: 500 })
    }

    const authHeaders = getAuthHeaders(request)
    if (!authHeaders) {
        return Response.json({ error: "Authentication required" }, { status: 401 })
    }

    const { id } = await context.params
    const recordingId = Number.parseInt(id, 10)

    if (!Number.isInteger(recordingId) || recordingId < 1) {
        return Response.json({ error: "Invalid recording id" }, { status: 400 })
    }

    const recordingDelegate = getRecordingDelegate()
    if (!recordingDelegate) {
        return Response.json({ error: "Recording persistence unavailable" }, { status: 503 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true },
        })

        if (!user) {
            return Response.json({ error: "Recording not found" }, { status: 404 })
        }

        const recording = await recordingDelegate.findFirst({
            where: {
                id: recordingId,
                userId: user.id,
            },
            select: {
                id: true,
                title: true,
                transcript: true,
                durationSeconds: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                audioSizeBytes: true,
            },
        })

        if (!recording) {
            return Response.json({ error: "Recording not found" }, { status: 404 })
        }

        return Response.json({
            ...recording,
            hasAudio: Boolean(recording.audioSizeBytes && recording.audioSizeBytes > 0),
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return Response.json({ error: "Database unavailable", details: message }, { status: 503 })
    }
}
