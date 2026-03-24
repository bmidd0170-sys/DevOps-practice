"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  Search,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface ApiQuestion {
  id: number
  question: string
  answer: string
  createdAt: string
  noteId: number | null
  noteTitle: string | null
}

export function QuestionsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [questionsHistory, setQuestionsHistory] = useState<ApiQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadQuestions() {
      try {
        const response = await fetch("/api/questions", {
          cache: "no-store",
          headers: withFirebaseUserHeaders(),
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load AI questions")
        }

        if (!isMounted) return
        setQuestionsHistory(Array.isArray(payload) ? payload : [])
        setLoadError(null)
      } catch (error) {
        if (!isMounted) return
        setQuestionsHistory([])
        setLoadError(error instanceof Error ? error.message : "Failed to load AI questions")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadQuestions()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredQuestions = useMemo(() => questionsHistory.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.noteTitle || "general chat").toLowerCase().includes(searchQuery.toLowerCase())
  ), [questionsHistory, searchQuery])

  const uniqueNoteCount = useMemo(
    () => new Set(questionsHistory.map((item) => item.noteId).filter((id) => id !== null)).size,
    [questionsHistory]
  )

  const thisWeekCount = useMemo(() => {
    const now = Date.now()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    return questionsHistory.filter((item) => {
      const createdAt = new Date(item.createdAt).getTime()
      return Number.isFinite(createdAt) && now - createdAt <= sevenDaysMs
    }).length
  }, [questionsHistory])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Questions</h1>
        <p className="text-muted-foreground mt-1">History of questions you&apos;ve asked the AI Buddy</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold text-foreground">{questionsHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes Referenced</p>
                <p className="text-2xl font-bold text-foreground">{uniqueNoteCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary">
                <Clock className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">{thisWeekCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading question history...</p>}
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium leading-relaxed">
                    {item.question}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    <Link
                      href={item.noteId ? `/notes/${item.noteId}` : "/notes"}
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-3 h-3" />
                      {item.noteTitle || "General chat"}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  {expandedId === item.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent
              className={cn(
                "overflow-hidden transition-all duration-200",
                expandedId === item.id ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pt-0 pb-0"
              )}
            >
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>

                {item.noteId && item.noteTitle && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Referenced Note
                    </p>
                    <Link
                      href={`/notes/${item.noteId}`}
                      className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <FileText className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{item.noteTitle}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">Open note context</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No questions found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search</p>
        </div>
      )}
    </div>
  )
}
