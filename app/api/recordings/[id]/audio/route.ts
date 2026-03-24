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
          audioData: true
          audioMimeType: true
          audioSizeBytes: true
        }
      }) => Promise<{
        audioData: Uint8Array | null
        audioMimeType: string | null
        audioSizeBytes: number | null
      } | null>
    }
  } | null)?.recording

  return delegate ?? null
}

function parseRangeHeader(rangeHeader: string, totalBytes: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
  if (!match) return null

  const rawStart = match[1]
  const rawEnd = match[2]

  if (!rawStart && !rawEnd) return null

  if (rawStart && rawEnd) {
    const start = Number.parseInt(rawStart, 10)
    const end = Number.parseInt(rawEnd, 10)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null
    if (start < 0 || end < start || start >= totalBytes) return null
    return {
      start,
      end: Math.min(end, totalBytes - 1),
    }
  }

  if (rawStart) {
    const start = Number.parseInt(rawStart, 10)
    if (!Number.isFinite(start) || start < 0 || start >= totalBytes) return null
    return {
      start,
      end: totalBytes - 1,
    }
  }

  const suffixLength = Number.parseInt(rawEnd, 10)
  if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null
  const clamped = Math.min(suffixLength, totalBytes)

  return {
    start: totalBytes - clamped,
    end: totalBytes - 1,
  }
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
        audioData: true,
        audioMimeType: true,
        audioSizeBytes: true,
      },
    })

    if (!recording || !recording.audioData || recording.audioData.byteLength === 0) {
      return Response.json({ error: "Audio not found" }, { status: 404 })
    }

    const bytes = Buffer.from(recording.audioData)
    const totalBytes = bytes.byteLength
    const mimeType = recording.audioMimeType || "audio/webm"
    const rangeHeader = request.headers.get("range")

    if (!rangeHeader) {
      return new Response(bytes, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(totalBytes),
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      })
    }

    const parsedRange = parseRangeHeader(rangeHeader, totalBytes)

    if (!parsedRange) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${totalBytes}`,
        },
      })
    }

    const { start, end } = parsedRange
    const chunk = bytes.subarray(start, end + 1)

    return new Response(chunk, {
      status: 206,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: "Database unavailable", details: message }, { status: 503 })
  }
}
