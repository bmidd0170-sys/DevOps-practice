import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getDatabaseUrl } from "@/lib/env"
import { getAuthHeaders } from "@/lib/server-auth"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

let prisma: PrismaClient | null = null
const databaseUrl = getDatabaseUrl()

if (databaseUrl) {
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: databaseUrl,
      }),
    })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
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

  try {
    const existing = await prisma.user.findUnique({
      where: { firebaseUid: authHeaders.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            ...(!existing.email && authHeaders.email ? { email: authHeaders.email } : {}),
            ...(!existing.displayName && authHeaders.displayName
              ? { displayName: authHeaders.displayName }
              : {}),
          },
          select: {
            id: true,
            firebaseUid: true,
            email: true,
            displayName: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : await prisma.user.create({
          data: {
            firebaseUid: authHeaders.uid,
            email: authHeaders.email,
            displayName: authHeaders.displayName,
          },
          select: {
            id: true,
            firebaseUid: true,
            email: true,
            displayName: true,
            createdAt: true,
            updatedAt: true,
          },
        })

    return Response.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: "Failed to sync user", details: message }, { status: 503 })
  }
}
