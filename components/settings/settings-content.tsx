"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Bell, Palette, Mic, Brain, Shield, Download } from "lucide-react"
import { toast } from "sonner"
import { useNotifications } from "@/components/notifications/notification-context"

const SETTINGS_STORAGE_KEY = "noteai.settings.v1"

type AppTheme = "light" | "dark" | "system"

interface AppSettings {
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

const defaultSettings: AppSettings = {
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

function applyCompactMode(enabled: boolean) {
  document.documentElement.classList.toggle("compact", enabled)
}

export function SettingsContent() {
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState("John Doe")
  const [email, setEmail] = useState("john@example.com")
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const { sendNotification } = useNotifications()

  /** Fire an in-app notification + email when a notification setting is enabled */
  const notifyToggle = async (
    enabled: boolean,
    title: string,
    message: string
  ) => {
    if (!enabled) return
    const profileRaw = localStorage.getItem("noteai.profile.v1")
    let profileEmail = email
    let profileName = name
    try {
      if (profileRaw) {
        const p = JSON.parse(profileRaw) as { name?: string; email?: string }
        if (p.email) profileEmail = p.email
        if (p.name) profileName = p.name
      }
    } catch {
      // fall back to state values
    }

    await sendNotification({
      email: profileEmail,
      recipientName: profileName,
      subject: title,
      title,
      message,
      type: "info",
    })
  }

  useEffect(() => {
    try {
      const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!rawSettings) return

      const parsed = JSON.parse(rawSettings) as Partial<AppSettings>
      const merged = { ...defaultSettings, ...parsed }
      setSettings(merged)
      applyCompactMode(Boolean(merged.compactMode))
    } catch {
      setSettings(defaultSettings)
    }
  }, [])

  const patchSettings = (partial: Partial<AppSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...partial }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))

      if (partial.compactMode !== undefined) {
        applyCompactMode(partial.compactMode)
      }

      return next
    })
  }

  const handleThemeChange = (nextTheme: AppTheme) => {
    setTheme(nextTheme)
    toast.success(`Theme updated to ${nextTheme}`)
  }

  const saveProfile = () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail) {
      toast.error("Please provide both name and email")
      return
    }

    localStorage.setItem("noteai.profile.v1", JSON.stringify({ name: trimmedName, email: trimmedEmail }))
    toast.success("Profile saved")
  }

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { name, email },
      settings,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "noteai-settings-export.json"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Data export downloaded")
  }

  useEffect(() => {
    try {
      const rawProfile = localStorage.getItem("noteai.profile.v1")
      if (!rawProfile) return
      const profile = JSON.parse(rawProfile) as { name?: string; email?: string }
      if (profile.name) setName(profile.name)
      if (profile.email) setEmail(profile.email)
    } catch {
      // Ignore invalid profile storage.
    }
  }, [])

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
          <Button onClick={saveProfile}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Select your preferred theme</p>
            </div>
            <Select value={(theme ?? "system") as AppTheme} onValueChange={(value) => handleThemeChange(value as AppTheme)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">Use smaller spacing and fonts</p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => patchSettings({ compactMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Study Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded to review your notes</p>
            </div>
            <Switch
              checked={settings.studyReminders}
              onCheckedChange={(checked) => {
                patchSettings({ studyReminders: checked })
                notifyToggle(
                  checked,
                  "Study Reminders Enabled",
                  "You'll now receive reminders to review your notes and stay on top of your study schedule."
                )
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recording Completed</Label>
              <p className="text-sm text-muted-foreground">Notify when transcription is ready</p>
            </div>
            <Switch
              checked={settings.recordingCompleted}
              onCheckedChange={(checked) => {
                patchSettings({ recordingCompleted: checked })
                notifyToggle(
                  checked,
                  "Recording Notifications Enabled",
                  "You'll be notified (and emailed) as soon as your recording transcription is ready."
                )
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">Receive a weekly study summary</p>
            </div>
            <Switch
              checked={settings.weeklySummary}
              onCheckedChange={(checked) => {
                patchSettings({ weeklySummary: checked })
                notifyToggle(
                  checked,
                  "Weekly Summary Enabled",
                  "Every week you'll receive a summary of your study progress, notes created, and recordings made."
                )
              }}
            />
          </div>
          {/* Test notification */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                notifyToggle(
                  true,
                  "Test Notification",
                  "This is a test notification from NoteAI. Your in-app and email notifications are working correctly."
                )
              }
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Recording
          </CardTitle>
          <CardDescription>Configure recording settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Audio Quality</Label>
              <p className="text-sm text-muted-foreground">Higher quality uses more storage</p>
            </div>
            <Select
              value={settings.audioQuality}
              onValueChange={(value) => patchSettings({ audioQuality: value as AppSettings["audioQuality"] })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Transcribe</Label>
              <p className="text-sm text-muted-foreground">Automatically transcribe recordings</p>
            </div>
            <Switch
              checked={settings.autoTranscribe}
              onCheckedChange={(checked) => patchSettings({ autoTranscribe: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Buddy
          </CardTitle>
          <CardDescription>Configure AI assistant behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Response Style</Label>
              <p className="text-sm text-muted-foreground">How detailed should responses be</p>
            </div>
            <Select
              value={settings.responseStyle}
              onValueChange={(value) => patchSettings({ responseStyle: value as AppSettings["responseStyle"] })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Citations</Label>
              <p className="text-sm text-muted-foreground">Highlight referenced sections</p>
            </div>
            <Switch
              checked={settings.showCitations}
              onCheckedChange={(checked) => patchSettings({ showCitations: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Generate Flashcards</Label>
              <p className="text-sm text-muted-foreground">Create flashcards when saving notes</p>
            </div>
            <Switch
              checked={settings.autoGenerateFlashcards}
              onCheckedChange={(checked) => patchSettings({ autoGenerateFlashcards: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>Manage your data and privacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analytics</Label>
              <p className="text-sm text-muted-foreground">Help us improve with usage data</p>
            </div>
            <Switch
              checked={settings.analytics}
              onCheckedChange={(checked) => patchSettings({ analytics: checked })}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="destructive" onClick={() => toast.info("Account deletion is not enabled in this lab build")}>Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
