import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import {
  getSmtpHost,
  getSmtpPort,
  getSmtpUser,
  getSmtpPass,
  getSmtpFrom,
  isSmtpConfigured,
} from "@/lib/env"

export interface NotificationPayload {
  email: string
  recipientName?: string
  subject: string
  title: string
  message: string
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
  let body: NotificationPayload

  try {
    body = (await req.json()) as NotificationPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { email, recipientName, subject, title, message } = body

  if (!email || !subject || !title || !message) {
    return NextResponse.json(
      { error: "Missing required fields: email, subject, title, message" },
      { status: 400 }
    )
  }

  // Basic email format validation (security: reject obviously bad inputs)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }

  const transporter = buildTransporter()

  if (!transporter) {
    console.warn(
      "[notifications] SMTP not configured — skipping email. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable."
    )
    return NextResponse.json({
      success: true,
      emailSent: false,
      reason: "SMTP not configured",
    })
  }

  try {
    await transporter.sendMail({
      from: getSmtpFrom(),
      to: email,
      subject,
      text: `Hi ${recipientName || "there"},\n\n${title}\n\n${message}\n\n—NoteAI`,
      html: buildHtmlEmail(recipientName || "", title, message),
    })

    return NextResponse.json({ success: true, emailSent: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[notifications] Failed to send email:", errorMessage)
    return NextResponse.json({
      success: true,
      emailSent: false,
      reason: "SMTP send failed",
    })
  }
}
