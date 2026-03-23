import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  getDatabaseUrl,
  getSmtpConfigDebug,
  getSmtpHost,
  getSmtpPort,
  getSmtpUser,
  getSmtpPass,
  getSmtpFrom,
  isSmtpConfigured,
} from "@/lib/env"
import { getAuthHeaders } from "@/lib/server-auth"

export interface NotificationPayload {
  email?: string
  recipientName?: string
  subject: string
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
}

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

function getNotificationDelegate() {
  const delegate = (prisma as PrismaClient & {
    notification?: {
      create: (args: {
        data: {
          email: string
          userId: string
          recipientName?: string
          subject: string
          title: string
          message: string
          type: string
          emailSent: boolean
        }
      }) => Promise<{
        id: number
        title: string
        message: string
        type: string
        createdAt: Date
        emailSent: boolean
      }>
      findMany: (args: {
        where: { userId: string }
        orderBy: { createdAt: "desc" }
        take: number
      }) => Promise<
        Array<{
          id: number
          title: string
          message: string
          type: string
          createdAt: Date
          emailSent: boolean
        }>
      >
    }
  } | null)?.notification

  return delegate ?? null
}

function buildTransporter() {
  if (!isSmtpConfigured()) {
    return null
  }

  return nodemailer.createTransport({
    host: getSmtpHost(),
    port: getSmtpPort(),
    secure: getSmtpPort() === 465,
    auth: {
      user: getSmtpUser(),
      pass: getSmtpPass(),
    },
  })
}

function buildHtmlEmail(name: string, title: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
      .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08); overflow: hidden; }
      .header { background: #6366f1; padding: 28px 32px; color: #fff; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
      .header p { margin: 4px 0 0; font-size: 13px; opacity: .8; }
      .body { padding: 28px 32px; color: #374151; }
      .body h2 { margin: 0 0 10px; font-size: 16px; color: #111827; }
      .body p { margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; }
      .footer { padding: 16px 32px; background: #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>NoteAI</h1>
        <p>Your personal study assistant</p>
      </div>
      <div class="body">
        <p style="margin-bottom:16px">Hi ${name || "there"},</p>
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
      <div class="footer">
        You're receiving this because you have notifications enabled in NoteAI.<br />
        Manage your preferences in Settings → Notifications.
      </div>
    </div>
  </body>
</html>
  `.trim()
}

export async function POST(req: NextRequest) {
  const authHeaders = getAuthHeaders(req)
  if (!authHeaders) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  let body: NotificationPayload

  try {
    body = (await req.json()) as NotificationPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { email, recipientName, subject, title, message, type = "info" } = body
  const normalizedEmail =
    typeof email === "string" && email.trim()
      ? email.trim()
      : typeof authHeaders.email === "string" && authHeaders.email.trim()
        ? authHeaders.email.trim()
        : ""

  if (!subject || !title || !message) {
    return NextResponse.json(
      { error: "Missing required fields: subject, title, message" },
      { status: 400 }
    )
  }

  const transporter = buildTransporter()
  let emailSent = false
  let reason: string | undefined

  if (!transporter) {
    const smtpDebug = getSmtpConfigDebug()
    console.warn(
      `[notifications] SMTP not configured — skipping email. Missing: ${smtpDebug.missing.join(", ") || "none"}. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable.`
    )
    reason = "SMTP not configured"
  }

  if (transporter && !normalizedEmail) {
    reason = "Recipient email missing"
    console.warn(
      "[notifications] SMTP configured but recipient email is missing — skipping email send."
    )
  }

  if (transporter && normalizedEmail) {
    // Basic email format validation (security: reject obviously bad inputs)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    try {
      await transporter.sendMail({
        from: getSmtpFrom(),
        to: normalizedEmail,
        subject,
        text: `Hi ${recipientName || "there"},\n\n${title}\n\n${message}\n\n—NoteAI`,
        html: buildHtmlEmail(recipientName || "", title, message),
      })
      emailSent = true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      console.error("[notifications] Failed to send email:", errorMessage)
      reason = "SMTP send failed"
    }
  }

  let createdNotification: {
    id: string
    title: string
    message: string
    type: "info" | "success" | "warning" | "error"
    read: boolean
    createdAt: string
  } | null = null

  const notificationDelegate = getNotificationDelegate()
  if (notificationDelegate) {
    try {
      const existingUser = await prisma?.user.findUnique({
        where: { firebaseUid: authHeaders.uid },
        select: { id: true, email: true, displayName: true },
      })

      const user = existingUser
        ? await prisma?.user.update({
            where: { id: existingUser.id },
            data: {
              ...(!existingUser.email && authHeaders.email ? { email: authHeaders.email } : {}),
              ...(!existingUser.displayName && authHeaders.displayName
                ? { displayName: authHeaders.displayName }
                : {}),
            },
            select: { id: true },
          })
        : await prisma?.user.create({
            data: {
              firebaseUid: authHeaders.uid,
              email: authHeaders.email,
              displayName: authHeaders.displayName,
            },
            select: { id: true },
          })

      if (!user) {
        return NextResponse.json({ error: "Database not configured" }, { status: 500 })
      }

      const created = await notificationDelegate.create({
        data: {
          userId: user.id,
          email: normalizedEmail,
          recipientName,
          subject,
          title,
          message,
          type,
          emailSent,
        },
      })

      createdNotification = {
        id: String(created.id),
        title: created.title,
        message: created.message,
        type: (created.type as "info" | "success" | "warning" | "error") || "info",
        read: false,
        createdAt: created.createdAt.toISOString(),
      }
    } catch (error) {
      console.error(
        "[notifications] Failed to persist notification:",
        error instanceof Error ? error.message : String(error)
      )
    }
  } else if (prisma) {
    console.warn(
      "[notifications] Notification model is unavailable on Prisma client. Run prisma generate and restart dev server."
    )
    reason = reason || "Notification persistence unavailable"
  }

  return NextResponse.json({
    success: true,
    emailSent,
    reason,
    notification: createdNotification,
  })
}

export async function GET(req: NextRequest) {
  const authHeaders = getAuthHeaders(req)
  if (!authHeaders) {
    return NextResponse.json([])
  }

  const notificationDelegate = getNotificationDelegate()
  if (!notificationDelegate) {
    return NextResponse.json([])
  }

  try {
    const user = await prisma?.user.findUnique({
      where: { firebaseUid: authHeaders.uid },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json([])
    }

    const notifications = await notificationDelegate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(
      notifications.map((n) => ({
        id: String(n.id),
        title: n.title,
        message: n.message,
        type: (n.type as "info" | "success" | "warning" | "error") || "info",
        read: false,
        createdAt: n.createdAt.toISOString(),
        emailSent: n.emailSent,
      }))
    )
  } catch (error) {
    console.error(
      "[notifications] Failed to load notifications:",
      error instanceof Error ? error.message : String(error)
    )
    return NextResponse.json([])
  }
}
