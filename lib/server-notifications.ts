import { PrismaClient } from "@prisma/client"

export type ServerNotificationType = "info" | "success" | "warning" | "error"

type CreateServerNotificationInput = {
  userId: string
  email?: string
  recipientName?: string
  title: string
  subject?: string
  message: string
  type?: ServerNotificationType
}

export async function createServerNotification(
  prisma: PrismaClient | null,
  input: CreateServerNotificationInput
): Promise<void> {
  if (!prisma) return

  const notificationDelegate = (prisma as PrismaClient & {
    notification?: {
      create: (args: {
        data: {
          userId: string
          email: string
          recipientName?: string
          subject: string
          title: string
          message: string
          type: string
          emailSent: boolean
        }
      }) => Promise<unknown>
    }
  }).notification

  if (!notificationDelegate) return

  try {
    await notificationDelegate.create({
      data: {
        userId: input.userId,
        email: input.email?.trim() || "",
        recipientName: input.recipientName,
        subject: input.subject || input.title,
        title: input.title,
        message: input.message,
        type: input.type || "info",
        emailSent: false,
      },
    })
  } catch {
    // Keep feature flows resilient if notification persistence is temporarily unavailable.
  }
}
