"use client"

import { useState } from "react"
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

const questionsHistory = [
  {
    id: "1",
    question: "What are the key differences between supervised and unsupervised learning?",
    answer: "Supervised learning uses labeled training data where the algorithm learns from example input-output pairs. The model makes predictions based on these examples. Unsupervised learning deals with unlabeled data, where the system tries to find patterns and structure without explicit guidance.",
    noteId: "1",
    noteTitle: "Introduction to Machine Learning",
    date: "2 hours ago",
    citations: [
      { text: "Supervised Learning", preview: "In supervised learning, the algorithm learns from labeled training data..." },
      { text: "Unsupervised Learning", preview: "Unsupervised learning deals with unlabeled data..." },
    ],
  },
  {
    id: "2",
    question: "Explain the mechanism of addition reactions in alkenes",
    answer: "Addition reactions in alkenes involve the breaking of the carbon-carbon double bond and the addition of atoms or groups to each of the carbon atoms. The pi bond in the double bond is relatively weak and can be broken to allow new bonds to form. Common addition reactions include hydrogenation, halogenation, and hydration.",
    noteId: "2",
    noteTitle: "Organic Chemistry - Alkenes",
    date: "Yesterday",
    citations: [
      { text: "Addition Reactions", preview: "Alkenes undergo addition reactions due to their unsaturated nature..." },
    ],
  },
  {
    id: "3",
    question: "What were the main causes of World War II?",
    answer: "The main causes of World War II include: 1) The Treaty of Versailles and its harsh terms on Germany, 2) The rise of fascism and nationalism in Europe, 3) The global economic depression of the 1930s, 4) The policy of appeasement by Western powers, and 5) Germany's aggressive expansion under Nazi rule.",
    noteId: "3",
    noteTitle: "World War II Overview",
    date: "3 days ago",
    citations: [],
  },
  {
    id: "4",
    question: "What is the difference between overfitting and underfitting?",
    answer: "Overfitting occurs when a model learns the training data too well, including noise and outliers, causing it to perform poorly on new data. Underfitting happens when a model is too simple to capture the underlying patterns in the data. Both result in poor generalization to new, unseen data.",
    noteId: "1",
    noteTitle: "Introduction to Machine Learning",
    date: "4 days ago",
    citations: [
      { text: "Overfitting and Underfitting", preview: "Overfitting occurs when a model learns the training data too well..." },
    ],
  },
  {
    id: "5",
    question: "Summarize the key integration techniques in calculus",
    answer: "Key integration techniques include: 1) Basic integration using antiderivatives, 2) Integration by substitution (u-substitution), 3) Integration by parts, 4) Partial fractions for rational functions, 5) Trigonometric substitution for integrals involving square roots, and 6) Numerical methods like Simpson's rule for approximations.",
    noteId: "4",
    noteTitle: "Calculus - Integration Techniques",
    date: "5 days ago",
    citations: [],
  },
]

export function QuestionsContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredQuestions = questionsHistory.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.noteTitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Questions</h1>
        <p className="text-muted-foreground mt-1">History of questions you&apos;ve asked the AI Buddy</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold text-foreground">{questionsHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes Referenced</p>
                <p className="text-2xl font-bold text-foreground">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                <Clock className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      href={`/notes/${item.noteId}`}
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-3 h-3" />
                      {item.noteTitle}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span className="text-sm text-muted-foreground">{item.date}</span>
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
                
                {item.citations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Referenced Sections
                    </p>
                    {item.citations.map((citation, index) => (
                      <Link
                        key={index}
                        href={`/notes/${item.noteId}`}
                        className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <FileText className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground">{citation.text}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{citation.preview}</p>
                        </div>
                      </Link>
                    ))}
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
