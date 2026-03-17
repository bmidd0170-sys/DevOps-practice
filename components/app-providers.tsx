"use client"

import { useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { NotificationProvider } from "@/components/notifications/notification-context"

const SETTINGS_STORAGE_KEY = "noteai.settings.v1"

function applyCompactMode(enabled: boolean) {
  document.documentElement.classList.toggle("compact", enabled)
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!rawSettings) return

      const settings = JSON.parse(rawSettings) as { compactMode?: boolean }
      applyCompactMode(Boolean(settings.compactMode))
    } catch {
      applyCompactMode(false)
    }
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <NotificationProvider>
        {children}
        <Toaster richColors position="top-right" />
      </NotificationProvider>
    </ThemeProvider>
  )
}
