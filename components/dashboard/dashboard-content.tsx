"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Mic, FileText, MessageSquare, Clock, TrendingUp, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"

const recentNotes = [
  { id: 1, title: "Introduction to Machine Learning", date: "2 hours ago", tags: ["AI", "Computer Science"] },
  { id: 2, title: "Organic Chemistry - Alkenes", date: "Yesterday", tags: ["Chemistry"] },
  { id: 3, title: "World War II Overview", date: "2 days ago", tags: ["History"] },
]

const recentRecordings = [
  { id: 1, title: "Calculus Lecture 12", duration: "45:23", date: "Today" },
  { id: 2, title: "Physics Lab Discussion", duration: "32:10", date: "Yesterday" },
]

const recentQuestions = [
  { id: 1, question: "What are the key differences between supervised and unsupervised learning?", note: "Introduction to Machine Learning" },
  { id: 2, question: "Explain the mechanism of addition reactions in alkenes", note: "Organic Chemistry - Alkenes" },
]

export function DashboardContent() {
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
            <Link href="/dashboard">
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
          value="24"
          description="+3 this week"
        />
        <StatsCard
          icon={Mic}
          label="Recordings"
          value="12"
          description="5.2 hours total"
        />
        <StatsCard
          icon={MessageSquare}
          label="AI Questions"
          value="89"
          description="+15 this week"
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
              <Link href="/dashboard">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                href="/dashboard"
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
                      <span className="text-sm text-muted-foreground">{note.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
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
                  <p className="text-sm text-muted-foreground">12 of 24</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-foreground">50%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted">
              <div className="h-full w-1/2 rounded-full bg-accent" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Flashcards</p>
                  <p className="text-sm text-muted-foreground">45 of 120</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-foreground">38%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted">
              <div className="h-full w-[38%] rounded-full bg-primary" />
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
              <Link href="/dashboard">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRecordings.map((recording) => (
              <Link
                key={recording.id}
                href="/dashboard"
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10">
                    <Mic className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{recording.title}</h3>
                    <p className="text-sm text-muted-foreground">{recording.date}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{recording.duration}</span>
              </Link>
            ))}
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
              <Link href="/dashboard">View all</Link>
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
                    <p className="text-xs text-muted-foreground mt-1">From: {q.note}</p>
                  </div>
                </div>
              </div>
            ))}
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
