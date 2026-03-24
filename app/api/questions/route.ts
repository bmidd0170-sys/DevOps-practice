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

function getAiQuestionDelegate() {
  const delegate = (prisma as PrismaClient & {
    aiQuestion?: {
      findMany: (args: {
        where: { userId: string }
        orderBy: { createdAt: "desc" }
        take: number
        include: { note: { select: { id: true; title: true } } }
      }) => Promise<
        Array<{
          id: number
          question: string
          answer: string
          createdAt: Date
          note: { id: number; title: string } | null
        }>
      >
    }
  } | null)?.aiQuestion

  return delegate ?? null
}

export async function GET(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not configured" }, { status: 500 })
  }

  const authHeaders = getAuthHeaders(request)
  if (!authHeaders) {
    return Response.json({ error: "Authentication required" }, { status: 401 })
  }

  const aiQuestionDelegate = getAiQuestionDelegate()
  if (!aiQuestionDelegate) {
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

    const history = await aiQuestionDelegate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { note: { select: { id: true, title: true } } },
    })

    return Response.json(
      history.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        createdAt: item.createdAt,
        noteId: item.note?.id ?? null,
        noteTitle: item.note?.title ?? null,
      }))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: "Database unavailable", details: message }, { status: 503 })
  }
}
