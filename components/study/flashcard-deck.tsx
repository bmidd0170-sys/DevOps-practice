"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, RotateCcw, Check, X, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface FlashcardDeckProps {
  noteId: string
  onBack: () => void
}

interface ApiNote {
  id: number
  title: string
  content: string
}

interface StudyApiFlashcard {
  front: string
  back: string
}

interface StudyApiResponse {
  noteTitle?: string
  flashcards?: StudyApiFlashcard[]
}

interface Flashcard {
  id: number
  front: string
  back: string
}

function buildFlashcards(content: string): Flashcard[] {
  const sentences = content
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40)
    .slice(0, 12)

  if (sentences.length === 0) {
    return [{
      id: 1,
      front: "What is this note about?",
      back: "Add more note content to generate study cards.",
    }]
  }

  return sentences.map((sentence, index) => ({
    id: index + 1,
    front: `Key point ${index + 1}`,
    back: sentence,
  }))
}

export function FlashcardDeck({ noteId, onBack }: FlashcardDeckProps) {
  const [noteTitle, setNoteTitle] = useState("Selected Note")
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCards, setKnownCards] = useState<number[]>([])
  const [unknownCards, setUnknownCards] = useState<number[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadFallbackNote() {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })
        const payload = await response.json().catch(() => null) as ApiNote | null

        if (!isMounted) return

        if (response.ok && payload?.content) {
          setNoteTitle(payload.title || "Selected Note")
          setFlashcards(buildFlashcards(payload.content))
          return
        }
      } catch {
        if (!isMounted) return
      }

      if (!isMounted) return
      setNoteTitle("Selected Note")
      setFlashcards(buildFlashcards(""))
    }

    async function loadNote() {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const headers = withFirebaseUserHeaders({
          "content-type": "application/json",
        })

        const response = await fetch("/api/ai/study", {
          method: "POST",
          cache: "no-store",
          headers,
          body: JSON.stringify({ noteId }),
        })
        const payload = await response.json().catch(() => null) as StudyApiResponse | { error?: string } | null

        if (!isMounted) return

        if (response.ok && payload && Array.isArray(payload.flashcards) && payload.flashcards.length > 0) {
          setNoteTitle(payload.noteTitle || "Selected Note")
          setFlashcards(
            payload.flashcards.map((card, index) => ({
              id: index + 1,
              front: card.front,
              back: card.back,
            }))
          )
        } else {
          const error = payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "AI flashcards unavailable. Using a basic study set."
          setErrorMessage(error)
          await loadFallbackNote()
        }
      } catch {
        if (!isMounted) return
        setErrorMessage("AI flashcards unavailable. Using a basic study set.")
        await loadFallbackNote()
      } finally {
        if (isMounted) {
          setIsLoading(false)
          setCurrentIndex(0)
          setIsFlipped(false)
          setKnownCards([])
          setUnknownCards([])
        }
      }
    }

    void loadNote()

    return () => {
      isMounted = false
    }
  }, [noteId])

  const currentCard = flashcards[currentIndex]
  const progress = useMemo(() => {
    if (flashcards.length === 0) return 0
    return ((currentIndex + 1) / flashcards.length) * 100
  }, [currentIndex, flashcards.length])

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleKnow = () => {
    setKnownCards([...knownCards, currentCard.id])
    handleNext()
  }

  const handleDontKnow = () => {
    setUnknownCards([...unknownCards, currentCard.id])
    handleNext()
  }

  const handleShuffle = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownCards([])
    setUnknownCards([])
  }

  const isComplete = flashcards.length > 0 && currentIndex === flashcards.length - 1 && (knownCards.includes(currentCard.id) || unknownCards.includes(currentCard.id))

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Flashcards</h1>
            <p className="text-sm text-muted-foreground">{noteTitle}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleShuffle}>
          <Shuffle className="w-4 h-4 mr-2" />
          Restart
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <div className="flex gap-4">
            <span className="text-accent">Known: {knownCards.length}</span>
            <span className="text-destructive">Review: {unknownCards.length}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Generating AI flashcards from your saved note...</p>
      )}

      {!isLoading && errorMessage && (
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      )}

      {/* Flashcard */}
      {!isLoading && !isComplete ? (
        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="perspective-1000 cursor-pointer w-full max-w-xl"
          >
            <div
              className={cn(
                "relative w-full h-80 transition-transform duration-500 preserve-3d",
                isFlipped && "rotate-y-180"
              )}
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* Front */}
              <Card
                className="absolute inset-0 backface-hidden flex items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="p-0 text-center">
                  <p className="text-xl font-medium text-foreground">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card
                className="absolute inset-0 backface-hidden flex items-center justify-center p-8 bg-primary/5"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <CardContent className="p-0 text-center">
                  <p className="text-lg text-foreground leading-relaxed">{currentCard.back}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            {isFlipped && (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDontKnow}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Review Again
                </Button>
                <Button
                  size="lg"
                  onClick={handleKnow}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Got It
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" onClick={() => setIsFlipped(!isFlipped)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip Card
          </Button>
        </div>
      ) : !isLoading ? (
        /* Completion Screen */
        <Card className="max-w-xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Session Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You reviewed all {flashcards.length} cards
            </p>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">{knownCards.length}</p>
                <p className="text-sm text-muted-foreground">Known</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-destructive">{unknownCards.length}</p>
                <p className="text-sm text-muted-foreground">Need Review</p>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={onBack}>
                Back to Study
              </Button>
              <Button onClick={handleShuffle}>
                Study Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
