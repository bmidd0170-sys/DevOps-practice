"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FlashcardDeck } from "@/components/study/flashcard-deck"
import { QuizMode } from "@/components/study/quiz-mode"
import { BookOpen, Brain, Trophy, Target, Sparkles, FileText } from "lucide-react"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface ApiNote {
  id: number
  title: string
  content: string
}

interface ApiQuestion {
  id: number
}

function estimateCards(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(5, Math.min(50, Math.round(words / 30)))
}

export function StudyContent() {
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [mode, setMode] = useState<"select" | "flashcards" | "quiz">("select")
  const [notes, setNotes] = useState<ApiNote[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadStudyData() {
      try {
        const response = await fetch("/api/notes", {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })
        const payload = await response.json().catch(() => [])
        if (!isMounted) return
        setNotes(response.ok && Array.isArray(payload) ? payload : [])
      } catch {
        if (!isMounted) return
        setNotes([])
      }
    }

    void loadStudyData()

    return () => {
      isMounted = false
    }
  }, [])

  const [questions, setQuestions] = useState<ApiQuestion[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadQuestionData() {
      try {
        const response = await fetch("/api/questions", {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })
        const payload = await response.json().catch(() => [])
        if (!isMounted) return
        setQuestions(response.ok && Array.isArray(payload) ? payload : [])
      } catch {
        if (!isMounted) return
        setQuestions([])
      }
    }

    void loadQuestionData()

    return () => {
      isMounted = false
    }
  }, [])

  const availableNotes = useMemo(
    () => notes.map((note) => ({
      id: String(note.id),
      title: note.title,
      cards: estimateCards(note.content),
    })),
    [notes]
  )

  const studyStats = useMemo(() => {
    const totalCards = availableNotes.reduce((acc, note) => acc + note.cards, 0)
    const cardsReviewed = Math.floor(totalCards * 0.4)
    const quizzesTaken = questions.length
    const averageScore = quizzesTaken > 0 ? 80 : 0

    return {
      cardsReviewed,
      totalCards,
      quizzesTaken,
      averageScore,
      streak: notes.length > 0 ? Math.min(7, notes.length) : 0,
    }
  }, [availableNotes, notes.length, questions.length])

  if (mode === "flashcards" && selectedNote) {
    return (
      <FlashcardDeck
        noteId={selectedNote}
        onBack={() => setMode("select")}
      />
    )
  }

  if (mode === "quiz" && selectedNote) {
    return (
      <QuizMode
        noteId={selectedNote}
        onBack={() => setMode("select")}
      />
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Study Mode</h1>
        <p className="text-muted-foreground mt-1">Review and test your knowledge</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cards Reviewed</p>
                <p className="text-2xl font-bold text-foreground">
                  {studyStats.cardsReviewed}/{studyStats.totalCards}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10">
                <Brain className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quizzes Taken</p>
                <p className="text-2xl font-bold text-foreground">{studyStats.quizzesTaken}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-chart-3/10">
                <Target className="w-4 h-4 text-chart-3" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {studyStats.quizzesTaken > 0 ? `${studyStats.averageScore}%` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-chart-1/10">
                <Trophy className="w-4 h-4 text-chart-1" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold text-foreground">{studyStats.streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Options */}
      <Tabs defaultValue="flashcards" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Study with Flashcards
              </CardTitle>
              <CardDescription>
                Select a note to generate flashcards and start studying
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note.id)
                    setMode("flashcards")
                  }}
                  className="flex items-center justify-between w-full p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{note.title}</h3>
                      <p className="text-sm text-muted-foreground">{note.cards} cards</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Study
                  </Button>
                </div>
              ))}
              {availableNotes.length === 0 && (
                <p className="text-sm text-muted-foreground">Create notes first to unlock flashcards and quizzes.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                Test Your Knowledge
              </CardTitle>
              <CardDescription>
                Take a quiz to test your understanding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedNote(note.id)
                    setMode("quiz")
                  }}
                  className="flex items-center justify-between w-full p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{note.title}</h3>
                      <p className="text-sm text-muted-foreground">5 questions</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    Start Quiz
                  </Button>
                </div>
              ))}
              {availableNotes.length === 0 && (
                <p className="text-sm text-muted-foreground">Create notes first to unlock flashcards and quizzes.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
