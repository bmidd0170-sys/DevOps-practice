import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getDatabaseUrl } from "@/lib/env"
import { getAuthHeaders } from "@/lib/server-auth"
import { createServerNotification } from "@/lib/server-notifications"

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
            findMany: (args: {
                where: { userId: string }
                orderBy: { createdAt: "desc" }
                take: number
            }) => Promise<
                Array<{
                    id: number
                    title: string
                    transcript: string
                    durationSeconds: number
                    status: string
                    createdAt: Date
                }>
            >
            create: (args: {
                data: {
                    userId: string
                    title: string
                    transcript: string
                    audioData?: Buffer
                    audioMimeType?: string
                    audioFileName?: string
                    audioSizeBytes?: number
                    durationSeconds: number
                    status: string
                }
            }) => Promise<{
                id: number
                title: string
                transcript: string
                durationSeconds: number
                status: string
                createdAt: Date
            }>
        }
    } | null)?.recording

    return delegate ?? null
}

async function resolveUserId(request: Request): Promise<string | null> {
    if (!prisma) return null

    const authHeaders = getAuthHeaders(request)
    if (!authHeaders) return null

    const existingUser = await prisma.user.findUnique({
        where: { firebaseUid: authHeaders.uid },
        select: { id: true, email: true, displayName: true },
    })

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
        })

    return user.id
}

export async function GET(request: Request) {
    if (!prisma) {
        return Response.json({ error: "Database not configured" }, { status: 500 })
    }

    const authHeaders = getAuthHeaders(request)
    if (!authHeaders) {
        return Response.json({ error: "Authentication required" }, { status: 401 })
    }

    const recordingDelegate = getRecordingDelegate()
    if (!recordingDelegate) {
        return Response.json([])
    }

    try {
        const user = await prisma.user.findUnique({
            where: { firebaseUid: authHeaders.uid },
            select: { id: true },
        })

        if (!user) {
            return Response.json([])
        }

        const recordings = await recordingDelegate.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 100,
        })

        return Response.json(
            recordings.map((recording) => ({
                id: recording.id,
                title: recording.title,
                transcript: recording.transcript,
                durationSeconds: recording.durationSeconds,
                status: recording.status,
                createdAt: recording.createdAt,
            }))
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return Response.json({ error: "Database unavailable", details: message }, { status: 503 })
    }
}

export async function POST(request: Request) {
    if (!prisma) {
        return Response.json({ error: "Database not configured" }, { status: 500 })
    }

    const authHeaders = getAuthHeaders(request)
    if (!authHeaders) {
        return Response.json({ error: "Authentication required" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") ?? ""
    let title = ""
    let transcript = ""
    let durationSeconds = 0
    let status: "recording" | "processing" | "transcribed" = "transcribed"
    let audioFile: File | null = null

    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData()

        title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : ""
        transcript =
            typeof formData.get("transcript") === "string" ? String(formData.get("transcript")).trim() : ""

        const durationRaw = formData.get("durationSeconds")
        const parsedDuration =
            typeof durationRaw === "string" ? Number.parseInt(durationRaw, 10) : Number.NaN
        durationSeconds = Number.isFinite(parsedDuration) ? Math.max(0, Math.round(parsedDuration)) : 0

        const statusRaw = formData.get("status")
        if (statusRaw === "recording" || statusRaw === "processing" || statusRaw === "transcribed") {
            status = statusRaw
        }

        const uploadedAudio = formData.get("audio")
        if (uploadedAudio instanceof File && uploadedAudio.size > 0) {
            audioFile = uploadedAudio
        }
    } else {
        const body = await request.json().catch(() => null)
        title = typeof body?.title === "string" ? body.title.trim() : ""
        transcript = typeof body?.transcript === "string" ? body.transcript.trim() : ""
        durationSeconds =
            typeof body?.durationSeconds === "number" && Number.isFinite(body.durationSeconds)
                ? Math.max(0, Math.round(body.durationSeconds))
                : 0
        status =
            body?.status === "recording" || body?.status === "processing" || body?.status === "transcribed"
                ? body.status
                : "transcribed"
    }

    if (!title || !transcript) {
        return Response.json({ error: "Title and transcript are required" }, { status: 400 })
    }

    const recordingDelegate = getRecordingDelegate()
    if (!recordingDelegate) {
        return Response.json(
            { error: "Recording persistence unavailable. Run prisma generate and restart the app." },
            { status: 503 }
        )
    }

    try {
        const userId = await resolveUserId(request)
        if (!userId) {
            return Response.json({ error: "Authentication required" }, { status: 401 })
        }

        let audioData: Buffer | undefined
        let audioMimeType: string | undefined
        let audioFileName: string | undefined
        let audioSizeBytes: number | undefined

        if (audioFile) {
            const arrayBuffer = await audioFile.arrayBuffer()
            const bytes = Buffer.from(arrayBuffer)
            audioData = bytes
            audioMimeType = audioFile.type || "audio/webm"
            audioFileName = audioFile.name || `recording-${Date.now()}.webm`
            audioSizeBytes = bytes.byteLength
        }

        const recording = await recordingDelegate.create({
            data: {
                userId,
                title,
                transcript,
                ...(audioData ? { audioData } : {}),
                ...(audioMimeType ? { audioMimeType } : {}),
                ...(audioFileName ? { audioFileName } : {}),
                ...(typeof audioSizeBytes === "number" ? { audioSizeBytes } : {}),
                durationSeconds,
                status,
            },
        })

        await createServerNotification(prisma, {
            userId,
            email: authHeaders.email,
            recipientName: authHeaders.displayName,
            title: "New Recording Saved",
            message: `Your recording "${title}" is now available in your recordings list.`,
            type: "success",
        })

        return Response.json(recording, { status: 201 })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return Response.json({ error: "Database unavailable", details: message }, { status: 503 })
    }
}
