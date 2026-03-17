"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RecordingCard } from "@/components/recordings/recording-card"
import { Mic, Plus } from "lucide-react"
import Link from "next/link"

const recordings = [
  {
    id: "1",
    title: "Calculus Lecture 12 - Integration",
    duration: "45:23",
    date: "Today, 2:30 PM",
    status: "transcribed" as const,
  },
  {
    id: "2",
    title: "Physics Lab Discussion",
    duration: "32:10",
    date: "Yesterday, 10:00 AM",
    status: "transcribed" as const,
  },
  {
    id: "3",
    title: "Chemistry Study Group",
    duration: "1:12:45",
    date: "Mar 7, 3:00 PM",
    status: "transcribed" as const,
  },
  {
    id: "4",
    title: "History Lecture - WWI Origins",
    duration: "52:30",
    date: "Mar 6, 9:00 AM",
    status: "transcribed" as const,
  },
  {
    id: "5",
    title: "Economics Review Session",
    duration: "38:15",
    date: "Mar 5, 4:00 PM",
    status: "processing" as const,
  },
]

export function RecordingsContent() {
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
                <p className="text-2xl font-bold text-foreground">12</p>
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
                <p className="text-2xl font-bold text-foreground">5.2 hrs</p>
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
                <p className="text-2xl font-bold text-foreground">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Recordings</CardTitle>
          <CardDescription>Click on a recording to view transcript and generate notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recordings.map((recording) => (
            <RecordingCard key={recording.id} recording={recording} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
