"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mic, Square, Pause, Play, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface TranscriptItem {
  time: string
  text: string
}

interface TranscriptionResponse {
  text?: string
  segments?: Array<{ start?: number; text?: string }>
  error?: string
  details?: string
  hint?: string
}

interface RecordingSaveResponse {
  error?: string
  details?: string
}

interface SpeechRecognitionAlternativeItem {
  transcript: string
}

interface SpeechRecognitionResultItem {
  length: number
  item(index: number): SpeechRecognitionAlternativeItem
  [index: number]: SpeechRecognitionAlternativeItem
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResultItem
  [index: number]: SpeechRecognitionResultItem
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

export function RecordingStudio() {
  const TRANSCRIBE_DISABLED_KEY = "recording-ai-transcribe-disabled"
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [title, setTitle] = useState("")
  const [transcript, setTranscript] = useState<TranscriptItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isAiTranscribeDisabled, setIsAiTranscribeDisabled] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const localTranscriptRef = useRef<TranscriptItem[]>([])
  const recordingTimeRef = useRef(0)

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const stopSpeechRecognition = useCallback(() => {
    const recognition = speechRecognitionRef.current
    if (!recognition) return

    try {
      recognition.onend = null
      recognition.stop()
    } catch {
      // Ignore stop errors from inactive recognizers.
    }

    speechRecognitionRef.current = null
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedValue = window.sessionStorage.getItem(TRANSCRIBE_DISABLED_KEY)
    if (storedValue === "1") {
      setIsAiTranscribeDisabled(true)
    }
  }, [])

  useEffect(() => {
    recordingTimeRef.current = recordingTime
  }, [recordingTime])

  const disableAiTranscription = useCallback(() => {
    setIsAiTranscribeDisabled(true)
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(TRANSCRIBE_DISABLED_KEY, "1")
    }
  }, [TRANSCRIBE_DISABLED_KEY])

  const clearAiTranscriptionDisable = useCallback(() => {
    setIsAiTranscribeDisabled(false)
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(TRANSCRIBE_DISABLED_KEY)
    }
  }, [TRANSCRIBE_DISABLED_KEY])

  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return

    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionImpl) {
      return
    }

    stopSpeechRecognition()

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onresult = (event) => {
      const nextItems: TranscriptItem[] = []

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results.item(i)
        const text = result?.item(0)?.transcript?.trim() || result?.[0]?.transcript?.trim()
        if (!text) continue

        nextItems.push({
          time: formatTime(recordingTimeRef.current),
          text,
        })
      }

      if (nextItems.length === 0) return

      localTranscriptRef.current = [...localTranscriptRef.current, ...nextItems]
      setTranscript(localTranscriptRef.current)
    }

    recognition.onerror = () => {
      // Keep recorder running even when browser speech recognition errors.
    }

    recognition.onend = () => {
      if (isRecording && !isPaused) {
        try {
          recognition.start()
        } catch {
          // Ignore restart failures; server transcription still runs on stop.
        }
      }
    }

    try {
      recognition.start()
      speechRecognitionRef.current = recognition
    } catch {
      speechRecognitionRef.current = null
    }
  }, [formatTime, isPaused, isRecording, stopSpeechRecognition])

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
      stopSpeechRecognition()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }, [stopSpeechRecognition])

  const persistRecording = useCallback(async (params: {
    transcriptText: string
    durationSeconds: number
    audioBlob: Blob
  }) => {
    const resolvedTitle = title.trim() || `Recording ${new Date().toLocaleString()}`

    const file = new File([params.audioBlob], `recording-${Date.now()}.webm`, {
      type: params.audioBlob.type || "audio/webm",
    })
    const formData = new FormData()
    formData.append("title", resolvedTitle)
    formData.append("transcript", params.transcriptText)
    formData.append("durationSeconds", String(params.durationSeconds))
    formData.append("status", "transcribed")
    formData.append("audio", file)

    const response = await fetch("/api/recordings", {
      method: "POST",
      headers: withFirebaseUserHeaders(),
      body: formData,
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as RecordingSaveResponse | null
      throw new Error(payload?.error || "Failed to save recording")
    }

    setSaveMessage("Recording saved to your library.")
  }, [title])

  const transcribeAudio = useCallback(async (audioBlob: Blob, durationSeconds: number) => {
    setIsTranscribing(true)
    setError(null)
    setSaveMessage(null)

    const hasBrowserTranscript = localTranscriptRef.current.length > 0

    if (isAiTranscribeDisabled && hasBrowserTranscript) {
      try {
        setTranscript(localTranscriptRef.current)
        const transcriptText = localTranscriptRef.current.map((segment) => segment.text).join("\n")
        await persistRecording({ transcriptText, durationSeconds, audioBlob })
        setError("Saved recording using browser live transcript (AI transcription disabled).")
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Recording could not be saved."
        )
      } finally {
        setIsTranscribing(false)
      }
      return
    }

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
        if (response.status === 403) {
          disableAiTranscription()
        }
        const errorParts = [data.error, data.details, data.hint]
          .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
        throw new Error(errorParts.join(". ") || "Transcription failed")
      }

      if (isAiTranscribeDisabled) {
        clearAiTranscriptionDisable()
      }

      const mappedSegments = (data.segments || [])
        .filter((segment) => typeof segment.text === "string")
        .map((segment) => ({
          time: formatTime(Math.floor(segment.start || 0)),
          text: String(segment.text),
        }))

      if (mappedSegments.length > 0) {
        setTranscript(mappedSegments)
        const transcriptText = mappedSegments.map((segment) => segment.text).join("\n")
        await persistRecording({ transcriptText, durationSeconds, audioBlob })
      } else if (data.text) {
        setTranscript([{ time: "00:00", text: data.text }])
        await persistRecording({ transcriptText: data.text, durationSeconds, audioBlob })
      } else if (localTranscriptRef.current.length > 0) {
        setTranscript(localTranscriptRef.current)
        const transcriptText = localTranscriptRef.current.map((segment) => segment.text).join("\n")
        await persistRecording({ transcriptText, durationSeconds, audioBlob })
      } else {
        setTranscript([])
      }
    } catch (transcriptionError) {
      if (localTranscriptRef.current.length > 0) {
        setTranscript(localTranscriptRef.current)
        try {
          const transcriptText = localTranscriptRef.current.map((segment) => segment.text).join("\n")
          await persistRecording({ transcriptText, durationSeconds, audioBlob })
          setError(
            "AI transcription is unavailable for this API key. Saved browser speech transcript instead."
          )
        } catch (saveError) {
          setError(
            saveError instanceof Error
              ? saveError.message
              : "AI transcription failed and recording could not be saved."
          )
        }
        return
      }

      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Failed to transcribe audio"
      )
    } finally {
      setIsTranscribing(false)
    }
  }, [clearAiTranscriptionDisable, disableAiTranscription, formatTime, isAiTranscribeDisabled, persistRecording])

  const handleStartRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support microphone recording.")
      return
    }

    setError(null)
    setSaveMessage(null)

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
      localTranscriptRef.current = []
      setTranscript([])

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
        stopSpeechRecognition()
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        void transcribeAudio(audioBlob, recordingTimeRef.current)
      }

      mediaRecorder.start(250)
      mediaRecorderRef.current = mediaRecorder

      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)
      startSpeechRecognition()
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

    stopSpeechRecognition()

    setIsRecording(false)
    setIsPaused(false)
  }

  const handlePauseResume = () => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder) return

    if (mediaRecorder.state === "recording") {
      mediaRecorder.pause()
      stopSpeechRecognition()
      setIsPaused(true)
      return
    }

    if (mediaRecorder.state === "paused") {
      mediaRecorder.resume()
      startSpeechRecognition()
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

            {saveMessage && (
              <p className="text-sm text-accent mt-2 text-center max-w-xs">
                {saveMessage}
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
