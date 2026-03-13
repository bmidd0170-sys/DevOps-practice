"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, Square, Pause, Play, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const sampleTranscript = [
  { time: "00:00", text: "Welcome to today's lecture on machine learning fundamentals." },
  { time: "00:05", text: "We'll be covering supervised learning, unsupervised learning, and reinforcement learning." },
  { time: "00:12", text: "Let's start with supervised learning, which is the most common type." },
  { time: "00:18", text: "In supervised learning, we have labeled training data." },
  { time: "00:24", text: "The algorithm learns to map inputs to outputs based on these examples." },
]

export function RecordingStudio() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [title, setTitle] = useState("")
  const [transcript, setTranscript] = useState<typeof sampleTranscript>([])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, isPaused])

  // Simulate transcript appearing
  useEffect(() => {
    if (isRecording && !isPaused) {
      const timeInSeconds = recordingTime
      const newTranscriptItems = sampleTranscript.filter((item) => {
        const [min, sec] = item.time.split(":").map(Number)
        return min * 60 + sec <= timeInSeconds
      })
      setTranscript(newTranscriptItems)
    }
  }, [recordingTime, isRecording, isPaused])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const handleStartRecording = () => {
    setIsRecording(true)
    setIsPaused(false)
    setRecordingTime(0)
    setTranscript([])
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
  }

  const handlePauseResume = () => {
    setIsPaused(!isPaused)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recordings">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recording title..."
            className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
          />
        </div>
        {isRecording && (
          <Button onClick={handleStopRecording}>
            <Save className="w-4 h-4 mr-2" />
            Save Recording
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recording Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Recording</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            {/* Timer */}
            <div className="text-5xl font-mono font-bold text-foreground mb-8">
              {formatTime(recordingTime)}
            </div>

            {/* Main Record Button */}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={cn(
                "relative flex items-center justify-center w-24 h-24 rounded-full transition-all",
                isRecording
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Mic className="w-10 h-10 text-primary-foreground" />
              )}
              {isRecording && !isPaused && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive animate-pulse" />
              )}
            </button>

            <p className="text-sm text-muted-foreground mt-4">
              {isRecording ? (isPaused ? "Paused" : "Recording...") : "Click to start recording"}
            </p>

            {/* Secondary Controls */}
            {isRecording && (
              <div className="flex items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePauseResume}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Waveform Visualization */}
            {isRecording && !isPaused && (
              <div className="flex items-center justify-center gap-1 mt-8 h-12">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Transcription */}
        <Card>
          <CardHeader>
            <CardTitle>Live Transcription</CardTitle>
          </CardHeader>
          <CardContent>
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Mic className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Start recording to see live transcription
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-auto">
                {transcript.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap mt-1">
                      {item.time}
                    </span>
                    <p className="text-sm text-foreground">{item.text}</p>
                  </div>
                ))}
                {isRecording && !isPaused && (
                  <div className="flex gap-3">
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap mt-1">
                      {formatTime(recordingTime)}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-200" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
