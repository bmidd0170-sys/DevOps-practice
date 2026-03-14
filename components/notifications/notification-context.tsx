"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import type { NotificationPayload } from "@/app/api/notifications/route"

const STORE_KEY = "noteai.notifications.v1"

export interface AppNotification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: string
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void
  markAllRead: () => void
  clearAll: () => void
  /** Adds in-app notification AND sends an email via the API */
  sendNotification: (
    payload: NotificationPayload & { type?: AppNotification["type"] }
  ) => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setNotifications(JSON.parse(raw) as AppNotification[])
    } catch {
      // ignore corrupt storage
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
  }, [])

  const sendNotification = useCallback(
    async (payload: NotificationPayload & { type?: AppNotification["type"] }) => {
      const { type = "info", ...rest } = payload

      // Always add an in-app notification immediately
      addNotification({ title: rest.title, message: rest.message, type })

      // Fire-and-forget email (don't block the UI)
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rest),
        })
      } catch {
        // Email failure is non-critical — in-app notification already shown
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
