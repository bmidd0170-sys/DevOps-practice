"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, Square, Pause, Play, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TranscriptItem {
  time: string
  text: string
}

interface TranscriptionResponse {
  text?: string
  segments?: Array<{ start?: number; text?: string }>
  error?: string
}

export function RecordingStudio() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [title, setTitle] = useState("")
  const [transcript, setTranscript] = useState<TranscriptItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, isPaused])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setError(null)

    try {
      const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: audioBlob.type || "audio/webm",
      })
      const formData = new FormData()
      formData.append("audio", file)

      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      })

      const data = await response.json() as TranscriptionResponse
      if (!response.ok) {
        throw new Error(data.error || "Transcription failed")
      }

      const mappedSegments = (data.segments || [])
        .filter((segment) => typeof segment.text === "string")
        .map((segment) => ({
          time: formatTime(Math.floor(segment.start || 0)),
          text: String(segment.text),
        }))

      if (mappedSegments.length > 0) {
        setTranscript(mappedSegments)
      } else if (data.text) {
        setTranscript([{ time: "00:00", text: data.text }])
      } else {
        setTranscript([])
      }
    } catch (transcriptionError) {
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Failed to transcribe audio"
      )
    } finally {
      setIsTranscribing(false)
    }
  }, [formatTime])

  const handleStartRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support microphone recording.")
      return
    }

    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : undefined
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        })
        chunksRef.current = []
        mediaRecorderRef.current = null
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        void transcribeAudio(audioBlob)
      }

      mediaRecorder.start(250)
      mediaRecorderRef.current = mediaRecorder

      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      setTranscript([])
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to access microphone"
      )
    }
  }

  const handleStopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
    }

    setIsRecording(false)
    setIsPaused(false)
  }

  const handlePauseResume = () => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder) return

    if (mediaRecorder.state === "recording") {
      mediaRecorder.pause()
      setIsPaused(true)
      return
    }

    if (mediaRecorder.state === "paused") {
      mediaRecorder.resume()
      setIsPaused(false)
    }
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
          <Button onClick={handleStopRecording} disabled={isTranscribing}>
            <Save className="w-4 h-4 mr-2" />
            Stop & Transcribe
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
              onClick={isRecording ? handleStopRecording : () => void handleStartRecording()}
              disabled={isTranscribing}
              className={cn(
                "relative flex items-center justify-center w-24 h-24 rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-60",
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
              {isTranscribing
                ? "Transcribing with AI..."
                : isRecording
                  ? (isPaused ? "Paused" : "Recording...")
                  : "Click to start recording"}
            </p>

            {error && (
              <p className="text-sm text-destructive mt-2 text-center max-w-xs">
                {error}
              </p>
            )}

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
                  {isTranscribing
                    ? "AI is processing your audio..."
                    : "Start recording to generate a transcript"}
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
