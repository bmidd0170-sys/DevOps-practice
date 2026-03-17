"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, X, Trophy, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizModeProps {
  noteId: string
  onBack: () => void
}

const quizQuestions = [
  {
    id: 1,
    question: "What is the main difference between supervised and unsupervised learning?",
    options: [
      "Supervised learning uses more data",
      "Supervised learning uses labeled data, unsupervised does not",
      "Unsupervised learning is faster",
      "There is no difference",
    ],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: "What happens when a model is overfitted?",
    options: [
      "It performs better on all data",
      "It performs well on training data but poorly on new data",
      "It uses less memory",
      "It trains faster",
    ],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "Which of the following is NOT a type of machine learning?",
    options: [
      "Supervised Learning",
      "Unsupervised Learning",
      "Reinforcement Learning",
      "Procedural Learning",
    ],
    correctAnswer: 3,
  },
  {
    id: 4,
    question: "What is feature engineering?",
    options: [
      "Building hardware for ML",
      "Selecting and transforming variables to improve ML algorithms",
      "Creating new ML algorithms",
      "Testing ML models",
    ],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: "In reinforcement learning, how does an agent learn?",
    options: [
      "By studying textbooks",
      "By receiving labeled examples",
      "By performing actions and receiving rewards or penalties",
      "By copying human behavior exactly",
    ],
    correctAnswer: 2,
  },
]

export function QuizMode({ noteId, onBack }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<{ questionId: number; correct: boolean }[]>([])

  const currentQuestion = quizQuestions[currentIndex]
  const progress = ((currentIndex + 1) / quizQuestions.length) * 100
  const isComplete = currentIndex === quizQuestions.length - 1 && isAnswered

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
            <p className="text-sm text-muted-foreground">Introduction to Machine Learning</p>
          </div>
        </div>
        {!isComplete && (
          <div className="text-sm text-muted-foreground">
            Score: <span className="font-semibold text-foreground">{score}/{answers.length}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      {!isComplete && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Question {currentIndex + 1} of {quizQuestions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Quiz Content */}
      {!isComplete ? (
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
      ) : (
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
                    r="56"
                    className="fill-none stroke-muted"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className={cn(
                      "fill-none",
                      percentage >= 80 ? "stroke-accent" : percentage >= 60 ? "stroke-chart-3" : "stroke-destructive"
                    )}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(percentage / 100) * 352} 352`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{percentage}%</span>
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
      )}
    </div>
  )
}
