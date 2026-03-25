"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RecordingCard } from "@/components/recordings/recording-card"
import { Mic, Plus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface ApiRecording {
  id: number
  title: string
  durationSeconds: number
  createdAt: string
  status: "recording" | "processing" | "transcribed"
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

export function RecordingsContent() {
  const [recordings, setRecordings] = useState<ApiRecording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadRecordings() {
      try {
        const response = await fetch("/api/recordings", {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load recordings")
        }

        if (!isMounted) return
        setRecordings(Array.isArray(payload) ? payload : [])
        setLoadError(null)
      } catch (error) {
        if (!isMounted) return
        setRecordings([])
        setLoadError(error instanceof Error ? error.message : "Failed to load recordings")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadRecordings()

    return () => {
      isMounted = false
    }
  }, [])

  const totalDurationSeconds = useMemo(
    () => recordings.reduce((acc, recording) => acc + (recording.durationSeconds || 0), 0),
    [recordings]
  )

  const notesGenerated = useMemo(
    () => recordings.filter((recording) => recording.status === "transcribed").length,
    [recordings]
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recordings</h1>
          <p className="text-muted-foreground mt-1">Capture and transcribe lectures and meetings</p>
        </div>
        <Button asChild>
          <Link href="/recordings/new">
            <Mic className="w-4 h-4 mr-2" />
            New Recording
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Mic className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Recordings</p>
                <p className="text-2xl font-bold text-foreground">{recordings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10">
                <Plus className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold text-foreground">{formatDuration(totalDurationSeconds)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary">
                <Mic className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes Generated</p>
                <p className="text-2xl font-bold text-foreground">{notesGenerated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading recordings...</p>}
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Recordings</CardTitle>
          <CardDescription>Click on a recording to view transcript and generate notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recordings.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={{
                id: String(recording.id),
                title: recording.title,
                duration: formatDuration(recording.durationSeconds),
                date: format(new Date(recording.createdAt), "MMM d, h:mm a"),
                status: recording.status,
              }}
            />
          ))}
          {!isLoading && recordings.length === 0 && (
            <p className="text-sm text-muted-foreground">No recordings yet. Start one to populate this list.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
