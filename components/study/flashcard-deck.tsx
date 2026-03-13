"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, RotateCcw, Check, X, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlashcardDeckProps {
  noteId: string
  onBack: () => void
}

const flashcards = [
  {
    id: 1,
    front: "What is Machine Learning?",
    back: "A subset of artificial intelligence that focuses on building systems that learn from and make decisions based on data, rather than being explicitly programmed.",
  },
  {
    id: 2,
    front: "What is Supervised Learning?",
    back: "A type of machine learning where the algorithm learns from labeled training data, making predictions based on example input-output pairs.",
  },
  {
    id: 3,
    front: "What is Unsupervised Learning?",
    back: "A type of machine learning that deals with unlabeled data, where the system tries to learn patterns and structure without explicit instructions.",
  },
  {
    id: 4,
    front: "What is Overfitting?",
    back: "When a model learns the training data too well, including noise and outliers, causing it to perform poorly on new, unseen data.",
  },
  {
    id: 5,
    front: "What is Feature Engineering?",
    back: "The process of using domain knowledge to select and transform variables (features) that make machine learning algorithms work better.",
  },
]

export function FlashcardDeck({ noteId, onBack }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCards, setKnownCards] = useState<number[]>([])
  const [unknownCards, setUnknownCards] = useState<number[]>([])

  const currentCard = flashcards[currentIndex]
  const progress = ((currentIndex + 1) / flashcards.length) * 100

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

  const isComplete = currentIndex === flashcards.length - 1 && (knownCards.includes(currentCard.id) || unknownCards.includes(currentCard.id))

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
            <p className="text-sm text-muted-foreground">Introduction to Machine Learning</p>
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

      {/* Flashcard */}
      {!isComplete ? (
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
      ) : (
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
      )}
    </div>
  )
}
