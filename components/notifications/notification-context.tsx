"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import type { NotificationPayload } from "@/app/api/notifications/route"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

const STORE_KEY = "noteai.notifications.v1"

export interface AppNotification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: string
}

export interface SendNotificationResult {
  emailSent: boolean
  reason?: string
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void
  markAllRead: () => void
  clearAll: () => void
  /** Adds in-app notification and optionally sends an email via the API */
  sendNotification: (
    payload: NotificationPayload & { type?: AppNotification["type"] }
  ) => Promise<SendNotificationResult>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    let mounted = true

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })
        if (!response.ok) {
          throw new Error("Failed to load notifications")
        }

        const remote = (await response.json()) as AppNotification[]
        if (mounted && Array.isArray(remote) && remote.length > 0) {
          const trimmed = remote.slice(0, 50)
          setNotifications(trimmed)
          localStorage.setItem(STORE_KEY, JSON.stringify(trimmed))
          return
        }
      } catch {
        // Fall through to local storage.
      }

      try {
        const raw = localStorage.getItem(STORE_KEY)
        if (raw && mounted) setNotifications(JSON.parse(raw) as AppNotification[])
      } catch {
        // ignore corrupt storage
      }
    }

    loadNotifications()

    return () => {
      mounted = false
    }
  }, [])

  const persist = (next: AppNotification[]) => {
    // Keep at most 50 notifications
    const trimmed = next.slice(0, 50)
    localStorage.setItem(STORE_KEY, JSON.stringify(trimmed))
    return trimmed
  }

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
      setNotifications((prev) => {
        const next: AppNotification = {
          ...n,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          read: false,
          createdAt: new Date().toISOString(),
        }
        return persist([next, ...prev])
      })
    },
    []
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      return persist(next)
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    localStorage.removeItem(STORE_KEY)

    void fetch("/api/notifications", {
      method: "DELETE",
      headers: withFirebaseUserHeaders(),
    }).catch(() => {
      // Keep UX snappy even if server-side cleanup fails transiently.
    })
  }, [])

  const sendNotification = useCallback(
    async (payload: NotificationPayload & { type?: AppNotification["type"] }) => {
      const { type = "info", ...rest } = payload
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`

      // Always add an in-app notification immediately
      setNotifications((prev) => {
        const next: AppNotification = {
          id: tempId,
          title: rest.title,
          message: rest.message,
          type,
          read: false,
          createdAt: new Date().toISOString(),
        }
        return persist([next, ...prev])
      })

      try {
        const response = await fetch("/api/notifications", {
          method: "POST",
          headers: withFirebaseUserHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ ...rest, type }),
        })

        if (!response.ok) {
          throw new Error("Failed to send notification")
        }

        let data: {
          notification?: AppNotification | null
          emailSent?: boolean
          reason?: string
        } | null = null

        try {
          data = (await response.json()) as {
            notification?: AppNotification | null
            emailSent?: boolean
            reason?: string
          }
        } catch (parseError) {
          // Response wasn't valid JSON; treat as email send attempt
          data = {
            emailSent: false,
            reason: "Response parsing failed",
          }
        }

        if (data?.notification) {
          setNotifications((prev) => {
            const withoutTemp = prev.filter((n) => n.id !== tempId)
            const exists = withoutTemp.some((n) => n.id === data?.notification?.id)
            return exists ? persist(withoutTemp) : persist([data!.notification!, ...withoutTemp])
          })
        } else {
          setNotifications((prev) => persist(prev.filter((n) => n.id !== tempId)))
          addNotification({ title: rest.title, message: rest.message, type })
        }

        return {
          emailSent: Boolean(data?.emailSent),
          reason: data?.reason,
        }
      } catch {
        // Keep local notification even when API/email fails.
        setNotifications((prev) =>
          persist(
            prev.map((n) =>
              n.id === tempId
                ? { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }
                : n
            )
          )
        )

        return {
          emailSent: false,
          reason: "Failed to send notification",
        }
      }
    },
    [addNotification]
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAllRead, clearAll, sendNotification }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>")
  return ctx
}
