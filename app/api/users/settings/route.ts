import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomUUID } from "node:crypto"
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

type SettingsRow = {
  theme: string
  compactMode: boolean
  studyReminders: boolean
  recordingCompleted: boolean
  weeklySummary: boolean
  audioQuality: string
  autoTranscribe: boolean
  responseStyle: string
  showCitations: boolean
  autoGenerateFlashcards: boolean
  analytics: boolean
}

async function readSettingsRow(userId: string): Promise<SettingsRow | null> {
  if (!prisma) return null

  const rows = await prisma.$queryRaw<SettingsRow[]>`
    SELECT
      "theme",
      "compactMode",
      "studyReminders",
      "recordingCompleted",
      "weeklySummary",
      "audioQuality",
      "autoTranscribe",
      "responseStyle",
      "showCitations",
      "autoGenerateFlashcards",
      "analytics"
    FROM "UserSettings"
    WHERE "userId" = ${userId}
    LIMIT 1
  `

  return rows[0] ?? null
}

async function upsertSettingsRow(userId: string, settings: Required<SettingsPayload>) {
  if (!prisma) return

  const settingsId = randomUUID()

  await prisma.$executeRaw`
    INSERT INTO "UserSettings" (
      "id",
      "userId",
      "theme",
      "compactMode",
      "studyReminders",
      "recordingCompleted",
      "weeklySummary",
      "audioQuality",
      "autoTranscribe",
      "responseStyle",
      "showCitations",
      "autoGenerateFlashcards",
      "analytics",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${settingsId},
      ${userId},
      ${settings.theme},
      ${settings.compactMode},
      ${settings.studyReminders},
      ${settings.recordingCompleted},
      ${settings.weeklySummary},
      ${settings.audioQuality},
      ${settings.autoTranscribe},
      ${settings.responseStyle},
      ${settings.showCitations},
      ${settings.autoGenerateFlashcards},
      ${settings.analytics},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "theme" = EXCLUDED."theme",
      "compactMode" = EXCLUDED."compactMode",
      "studyReminders" = EXCLUDED."studyReminders",
      "recordingCompleted" = EXCLUDED."recordingCompleted",
      "weeklySummary" = EXCLUDED."weeklySummary",
      "audioQuality" = EXCLUDED."audioQuality",
      "autoTranscribe" = EXCLUDED."autoTranscribe",
      "responseStyle" = EXCLUDED."responseStyle",
      "showCitations" = EXCLUDED."showCitations",
      "autoGenerateFlashcards" = EXCLUDED."autoGenerateFlashcards",
      "analytics" = EXCLUDED."analytics",
      "updatedAt" = CURRENT_TIMESTAMP
  `
}

type SettingsPayload = {
  theme?: "light" | "dark" | "system"
  compactMode?: boolean
  studyReminders?: boolean
  recordingCompleted?: boolean
  weeklySummary?: boolean
  audioQuality?: "low" | "medium" | "high"
  autoTranscribe?: boolean
  responseStyle?: "concise" | "balanced" | "detailed"
  showCitations?: boolean
  autoGenerateFlashcards?: boolean
  analytics?: boolean
}

type UpdateBody = {
  profile?: {
    name?: string
    email?: string
  }
  settings?: SettingsPayload
}

const defaultSettings: Required<SettingsPayload> = {
  theme: "system",
  compactMode: false,
  studyReminders: true,
  recordingCompleted: true,
  weeklySummary: false,
  audioQuality: "high",
  autoTranscribe: true,
  responseStyle: "balanced",
  showCitations: true,
  autoGenerateFlashcards: false,
  analytics: true,
}

async function getOrCreateUser(request: Request) {
  if (!prisma) {
    return { error: Response.json({ error: "Database not configured" }, { status: 500 }) }
  }

  const authHeaders = getAuthHeaders(request)
  if (!authHeaders) {
    return { error: Response.json({ error: "Authentication required" }, { status: 401 }) }
  }

  const existing = await prisma.user.findUnique({
    where: { firebaseUid: authHeaders.uid },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  })

  if (existing) {
    if ((!existing.email && authHeaders.email) || (!existing.displayName && authHeaders.displayName)) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...(!existing.email && authHeaders.email ? { email: authHeaders.email } : {}),
          ...(!existing.displayName && authHeaders.displayName
            ? { displayName: authHeaders.displayName }
            : {}),
        },
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      })

      return { user: updated }
    }

    return { user: existing }
  }

  const user = await prisma.user.create({
    data: {
      firebaseUid: authHeaders.uid,
      email: authHeaders.email,
      displayName: authHeaders.displayName,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  })

  return { user }
}

export async function GET(request: Request) {
  try {
    const userResult = await getOrCreateUser(request)
    if ("error" in userResult) return userResult.error

    let settings = await readSettingsRow(userResult.user.id)
    if (!settings) {
      await upsertSettingsRow(userResult.user.id, defaultSettings)
      settings = await readSettingsRow(userResult.user.id)
    }

    const safeSettings = settings ?? defaultSettings

    return Response.json({
      profile: {
        name: userResult.user.displayName || "",
        email: userResult.user.email || "",
      },
      settings: {
        theme: safeSettings.theme,
        compactMode: safeSettings.compactMode,
        studyReminders: safeSettings.studyReminders,
        recordingCompleted: safeSettings.recordingCompleted,
        weeklySummary: safeSettings.weeklySummary,
        audioQuality: safeSettings.audioQuality,
        autoTranscribe: safeSettings.autoTranscribe,
        responseStyle: safeSettings.responseStyle,
        showCitations: safeSettings.showCitations,
        autoGenerateFlashcards: safeSettings.autoGenerateFlashcards,
        analytics: safeSettings.analytics,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: "Failed to load settings", details: message }, { status: 503 })
  }
}

export async function PUT(request: Request) {
  try {
    const userResult = await getOrCreateUser(request)
    if ("error" in userResult) return userResult.error

    const body = (await request.json().catch(() => null)) as UpdateBody | null
    if (!body) {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const profile = body.profile
    const settings = body.settings

    if (profile) {
      const nextName = typeof profile.name === "string" ? profile.name.trim() : undefined
      const nextEmail = typeof profile.email === "string" ? profile.email.trim() : undefined

      await prisma!.user.update({
        where: { id: userResult.user.id },
        data: {
          ...(nextName !== undefined ? { displayName: nextName } : {}),
          ...(nextEmail !== undefined ? { email: nextEmail } : {}),
        },
      })
    }

    if (settings) {
      const merged = { ...defaultSettings, ...settings }

      await upsertSettingsRow(userResult.user.id, merged)
    }

    return GET(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: "Failed to save settings", details: message }, { status: 503 })
  }
}
