"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth/auth-context"

const SETTINGS_STORAGE_KEY = "noteai.settings.v1"

type AppTheme = "light" | "dark" | "system"

interface AppSettings {
  theme: AppTheme
  compactMode: boolean
  studyReminders: boolean
  recordingCompleted: boolean
  weeklySummary: boolean
  audioQuality: "low" | "medium" | "high"
  autoTranscribe: boolean
  responseStyle: "concise" | "balanced" | "detailed"
  showCitations: boolean
  autoGenerateFlashcards: boolean
  analytics: boolean
}

function applyCompactMode(enabled: boolean) {
  document.documentElement.classList.toggle("compact", enabled)
}

/**
 * SettingsApplier: Applies user settings (theme, compact mode) immediately after auth completes.
 * This component should be placed inside the theme provider hierarchy but after auth is available.
 */
export function SettingsApplier({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { setTheme } = useTheme()

  useEffect(() => {
    // Only apply settings once user is loaded and settings are available
    if (loading) return

    try {
      const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!rawSettings) return

      const settings = JSON.parse(rawSettings) as Partial<AppSettings>

      // Apply theme
      if (settings.theme) {
        setTheme(settings.theme)
      }

      // Apply compact mode
      if (settings.compactMode !== undefined) {
        applyCompactMode(Boolean(settings.compactMode))
      }
    } catch {
      // Silently fail if settings parsing fails
    }
  }, [loading, setTheme])

  return <>{children}</>
}
