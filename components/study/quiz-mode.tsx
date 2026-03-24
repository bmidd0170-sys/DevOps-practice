"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, X, Trophy, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface QuizModeProps {
  noteId: string
  onBack: () => void
}

interface ApiNote {
  id: number
  title: string
  content: string
}

interface StudyApiQuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
}

interface StudyApiResponse {
  noteTitle?: string
  quiz?: StudyApiQuizQuestion[]
}

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

function buildQuizQuestions(content: string): QuizQuestion[] {
  const sentences = content
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30)
    .slice(0, 8)

  if (sentences.length < 2) {
    return [{
      id: 1,
      question: "Add more content to this note to generate a quiz.",
      options: ["Got it"],
      correctAnswer: 0,
    }]
  }

  return sentences.slice(0, 5).map((sentence, index) => {
    const distractors = sentences
      .filter((_, sentenceIndex) => sentenceIndex !== index)
      .slice(0, 3)

    const options = [sentence, ...distractors]
    return {
      id: index + 1,
      question: `Which statement appears in your note?`,
      options,
      correctAnswer: 0,
    }
  })
}

export function QuizMode({ noteId, onBack }: QuizModeProps) {
  const [noteTitle, setNoteTitle] = useState("Selected Note")
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<{ questionId: number; correct: boolean }[]>([])

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
          setQuizQuestions(buildQuizQuestions(payload.content))
          return
        }
      } catch {
        if (!isMounted) return
      }

      if (!isMounted) return
      setNoteTitle("Selected Note")
      setQuizQuestions(buildQuizQuestions(""))
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

        if (response.ok && payload && Array.isArray(payload.quiz) && payload.quiz.length > 0) {
          setNoteTitle(payload.noteTitle || "Selected Note")
          setQuizQuestions(
            payload.quiz.map((question, index) => ({
              id: index + 1,
              question: question.question,
              options: question.options,
              correctAnswer: question.correctAnswer,
            }))
          )
        } else {
          const error = payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "AI quiz unavailable. Using a basic quiz."
          setErrorMessage(error)
          await loadFallbackNote()
        }
      } catch {
        if (!isMounted) return
        setErrorMessage("AI quiz unavailable. Using a basic quiz.")
        await loadFallbackNote()
      } finally {
        if (isMounted) {
          setCurrentIndex(0)
          setSelectedAnswer(null)
          setIsAnswered(false)
          setScore(0)
          setAnswers([])
          setIsLoading(false)
        }
      }
    }

    void loadNote()

    return () => {
      isMounted = false
    }
  }, [noteId])

  const currentQuestion = quizQuestions[currentIndex]
  const progress = useMemo(() => {
    if (quizQuestions.length === 0) return 0
    return ((currentIndex + 1) / quizQuestions.length) * 100
  }, [currentIndex, quizQuestions.length])
  const isComplete = quizQuestions.length > 0 && currentIndex === quizQuestions.length - 1 && isAnswered

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer
    if (isCorrect) {
      setScore(score + 1)
    }
    setAnswers([...answers, { questionId: currentQuestion.id, correct: isCorrect }])
    setIsAnswered(true)
  }

  const handleNext = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setScore(0)
    setAnswers([])
  }

  const percentage = Math.round((score / quizQuestions.length) * 100)
  const safePercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0
  const ringRadius = 56
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringDashOffset = ringCircumference * (1 - safePercentage / 100)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Quiz</h1>
            <p className="text-sm text-muted-foreground">{noteTitle}</p>
          </div>
        </div>
        {!isComplete && (
          <div className="text-sm text-muted-foreground">
            Score: <span className="font-semibold text-foreground">{score}/{answers.length}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      {!isLoading && !isComplete && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentIndex + 1} of {quizQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Generating AI quiz from your saved note...</p>
      )}

      {!isLoading && errorMessage && (
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      )}

      {/* Quiz Content */}
      {!isLoading && !isComplete ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showCorrect = isAnswered && isCorrect
              const showIncorrect = isAnswered && isSelected && !isCorrect

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={isAnswered}
                  className={cn(
                    "flex items-center gap-3 w-full p-4 rounded-lg border text-left transition-colors",
                    !isAnswered && isSelected && "border-primary bg-primary/5",
                    !isAnswered && !isSelected && "border-border hover:border-primary/50 hover:bg-muted/50",
                    showCorrect && "border-accent bg-accent/10",
                    showIncorrect && "border-destructive bg-destructive/10",
                    isAnswered && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                      !isAnswered && isSelected && "border-primary bg-primary text-primary-foreground",
                      !isAnswered && !isSelected && "border-muted-foreground",
                      showCorrect && "border-accent bg-accent text-accent-foreground",
                      showIncorrect && "border-destructive bg-destructive text-destructive-foreground"
                    )}
                  >
                    {showCorrect && <Check className="w-4 h-4" />}
                    {showIncorrect && <X className="w-4 h-4" />}
                    {!isAnswered && (
                      <span className="text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-foreground",
                    showCorrect && "font-medium",
                    showIncorrect && "text-muted-foreground"
                  )}>
                    {option}
                  </span>
                </button>
              )
            })}

            <div className="flex justify-end gap-3 pt-4">
              {!isAnswered ? (
                <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
                  Submit Answer
                </Button>
              ) : currentIndex < quizQuestions.length - 1 ? (
                <Button onClick={handleNext}>
                  Next Question
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        /* Results Screen */
        <Card className="max-w-xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center">
            <div
              className={cn(
                "flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-4",
                percentage >= 80 ? "bg-accent/10" : percentage >= 60 ? "bg-chart-3/10" : "bg-destructive/10"
              )}
            >
              <Trophy
                className={cn(
                  "w-10 h-10",
                  percentage >= 80 ? "text-accent" : percentage >= 60 ? "text-chart-3" : "text-destructive"
                )}
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good Job!" : "Keep Practicing!"}
            </h2>
            <p className="text-muted-foreground mb-6">
              You scored {score} out of {quizQuestions.length} questions
            </p>
            
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={ringRadius}
                    className="fill-none stroke-muted"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={ringRadius}
                    className={cn(
                      "fill-none",
                      percentage >= 80 ? "stroke-accent" : percentage >= 60 ? "stroke-chart-3" : "stroke-destructive"
                    )}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                    strokeDashoffset={ringDashOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{safePercentage}%</span>
                </div>
              </div>
            </div>

            {/* Question Review */}
            <div className="flex justify-center gap-2 mb-6">
              {answers.map((answer, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    answer.correct
                      ? "bg-accent/10 text-accent"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {index + 1}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={onBack}>
                Back to Study
              </Button>
              <Button onClick={handleRestart}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
