"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, Calendar, Clock, FileText, Headphones } from "lucide-react"
import { withFirebaseUserHeaders } from "@/lib/client-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface RecordingDetail {
  id: number
  title: string
  transcript: string
  durationSeconds: number
  status: "recording" | "processing" | "transcribed"
  createdAt: string
  hasAudio: boolean
}

function formatDuration(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0
  const hours = Math.floor(safeSeconds / 3600)
  const mins = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function RecordingDetailContent() {
  const params = useParams<{ id: string }>()
  const [recording, setRecording] = useState<RecordingDetail | null>(null)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const audioObjectUrlRef = useRef<string | null>(null)

  const recordingId = useMemo(() => {
    const rawId = params?.id
    const parsed = Number.parseInt(String(rawId), 10)
    return Number.isInteger(parsed) ? parsed : null
  }, [params?.id])

  useEffect(() => {
    let isMounted = true

    if (!recordingId || recordingId < 1) {
      setIsLoading(false)
      setLoadError("Invalid recording id")
      return
    }

    async function loadRecording() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/recordings/${recordingId}`, {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load recording")
        }

        if (!isMounted) return
        setRecording(payload as RecordingDetail)
        setLoadError(null)
      } catch (error) {
        if (!isMounted) return
        setRecording(null)
        setLoadError(error instanceof Error ? error.message : "Failed to load recording")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadRecording()

    return () => {
      isMounted = false
    }
  }, [recordingId])

  useEffect(() => {
    let isMounted = true

    async function loadAudio() {
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current)
        audioObjectUrlRef.current = null
      }

      if (!recording?.hasAudio) {
        setAudioSrc(null)
        return
      }

      setAudioSrc(null)

      try {
        const response = await fetch(`/api/recordings/${recording.id}/audio`, {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })

        if (!response.ok) {
          throw new Error("Failed to load recording audio")
        }

        const blob = await response.blob()
        if (!isMounted) return

        const nextUrl = URL.createObjectURL(blob)
        audioObjectUrlRef.current = nextUrl
        setAudioSrc(nextUrl)
      } catch {
        if (!isMounted) return
        setAudioSrc(null)
      }
    }

    void loadAudio()

    return () => {
      isMounted = false
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current)
        audioObjectUrlRef.current = null
      }
    }
  }, [recording?.hasAudio, recording?.id])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/recordings">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {recording?.title || "Recording"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Playback and saved transcript</p>
          </div>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading recording...</p>}
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {recording && !isLoading && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Playback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(recording.durationSeconds)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(recording.createdAt), "MMM d, yyyy h:mm a")}</span>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    recording.status === "recording" && "bg-destructive/10 text-destructive",
                    recording.status === "processing" && "bg-muted text-muted-foreground",
                    recording.status === "transcribed" && "bg-accent/10 text-accent"
                  )}
                >
                  {recording.status}
                </span>
              </div>

              {audioSrc ? (
                <audio className="w-full" controls preload="metadata" src={audioSrc}>
                  Your browser does not support audio playback.
                </audio>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  <Headphones className="w-4 h-4" />
                  Audio is not available for this older recording.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Saved Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recording.transcript.trim().length > 0 ? (
                <div className="rounded-md bg-muted/40 p-4 text-sm leading-6 whitespace-pre-wrap">
                  {recording.transcript}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No transcript was saved for this recording.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
