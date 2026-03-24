"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Mic, FileText, MessageSquare, Clock, TrendingUp, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface ApiNote {
  id: number
  title: string
  updatedAt: string
}

interface ApiRecording {
  id: number
  title: string
  durationSeconds: number
  createdAt: string
}

interface ApiQuestion {
  id: number
  question: string
  noteTitle: string | null
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

export function DashboardContent() {
  const [notes, setNotes] = useState<ApiNote[]>([])
  const [recordings, setRecordings] = useState<ApiRecording[]>([])
  const [questions, setQuestions] = useState<ApiQuestion[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const [notesResponse, recordingsResponse, questionsResponse] = await Promise.all([
          fetch("/api/notes", { cache: "no-store", headers: withFirebaseUserHeaders() }),
          fetch("/api/recordings", { cache: "no-store", headers: withFirebaseUserHeaders() }),
          fetch("/api/questions", { cache: "no-store", headers: withFirebaseUserHeaders() }),
        ])

        const [notesPayload, recordingsPayload, questionsPayload] = await Promise.all([
          notesResponse.json().catch(() => []),
          recordingsResponse.json().catch(() => []),
          questionsResponse.json().catch(() => []),
        ])

        if (!isMounted) return

        setNotes(notesResponse.ok && Array.isArray(notesPayload) ? notesPayload : [])
        setRecordings(recordingsResponse.ok && Array.isArray(recordingsPayload) ? recordingsPayload : [])
        setQuestions(questionsResponse.ok && Array.isArray(questionsPayload) ? questionsPayload : [])
      } catch {
        if (!isMounted) return
        setNotes([])
        setRecordings([])
        setQuestions([])
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const recentNotes = useMemo(() => notes.slice(0, 3), [notes])
  const recentRecordings = useMemo(() => recordings.slice(0, 3), [recordings])
  const recentQuestions = useMemo(() => questions.slice(0, 3), [questions])

  const totalRecordingSeconds = useMemo(
    () => recordings.reduce((acc, item) => acc + (item.durationSeconds || 0), 0),
    [recordings]
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your study overview.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/notes/new">
              <Plus className="w-4 h-4" />
              Create Note
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/recordings/new">
              <Mic className="w-4 h-4" />
              Start Recording
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FileText}
          label="Total Notes"
          value={String(notes.length)}
          description="Saved in your workspace"
        />
        <StatsCard
          icon={Mic}
          label="Recordings"
          value={String(recordings.length)}
          description={`${formatDuration(totalRecordingSeconds)} total`}
        />
        <StatsCard
          icon={MessageSquare}
          label="AI Questions"
          value={String(questions.length)}
          description="Stored chat history"
        />
        <StatsCard
          icon={TrendingUp}
          label="Study Streak"
          value="7 days"
          description="Keep it up!"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Notes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Notes</CardTitle>
              <CardDescription>Your latest study materials</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/notes">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex gap-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{note.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {recentNotes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet. Create your first note to populate this panel.</p>
            )}
          </CardContent>
        </Card>

        {/* Study Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Study Progress</CardTitle>
            <CardDescription>This week&apos;s activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10">
                  <BookOpen className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Notes Reviewed</p>
                  <p className="text-sm text-muted-foreground">{notes.length} notes available</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-foreground">Live</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted">
              <div className="h-full w-full rounded-full bg-accent" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Flashcards</p>
                  <p className="text-sm text-muted-foreground">Generated from your notes in Study mode</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-foreground">Ready</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted">
              <div className="h-full w-full rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Recordings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Recordings</CardTitle>
              <CardDescription>Lecture and meeting recordings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/recordings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRecordings.map((recording) => (
              <Link
                key={recording.id}
                href={`/recordings/${recording.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10">
                    <Mic className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{recording.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatDuration(recording.durationSeconds)}
                </span>
              </Link>
            ))}
            {recentRecordings.length === 0 && (
              <p className="text-sm text-muted-foreground">No recordings saved yet.</p>
            )}
          </CardContent>
        </Card>

        {/* AI Questions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent AI Questions</CardTitle>
              <CardDescription>Questions you&apos;ve asked</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/questions">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentQuestions.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground line-clamp-2">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">From: {q.noteTitle || "General chat"}</p>
                  </div>
                </div>
              </div>
            ))}
            {recentQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground">No AI questions yet. Ask AI Buddy from a note to populate this section.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface StatsCardProps {
  icon: React.ElementType
  label: string
  value: string
  description: string
}

function StatsCard({ icon: Icon, label, value, description }: StatsCardProps) {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
