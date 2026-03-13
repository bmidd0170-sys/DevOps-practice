"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  X,
  Send,
  Sparkles,
  FileText,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Wand2,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
}

interface Citation {
  id: string
  text: string
  preview: string
}

interface AIBuddyPanelProps {
  isOpen: boolean
  onClose: () => void
  noteContent: string
  onHighlight: (text: string) => string | null
  onScrollToSection: (sectionId: string) => void
}

const suggestedPrompts = [
  { icon: FileText, label: "Summarize this note", prompt: "Summarize the key points of this note" },
  { icon: Lightbulb, label: "Explain this section", prompt: "Explain the main concepts in simpler terms" },
  { icon: HelpCircle, label: "Create a quiz", prompt: "Create 5 quiz questions from this lecture" },
  { icon: BookOpen, label: "Key ideas", prompt: "What are the key ideas I should remember?" },
]

const sampleResponses: Record<string, { content: string; citations: Citation[] }> = {
  "summarize": {
    content: "This note covers the fundamentals of Machine Learning, a subset of AI focused on building data-driven systems. The key topics include:\n\n**Three Types of ML:**\n1. Supervised Learning - uses labeled data\n2. Unsupervised Learning - finds patterns in unlabeled data\n3. Reinforcement Learning - learns through rewards/penalties\n\n**Important Concepts:**\n- Training vs Testing data splits\n- Overfitting and Underfitting challenges\n- Feature Engineering importance\n\nThe note concludes with popular algorithms like Linear Regression, Decision Trees, and Neural Networks.",
    citations: [
      {
        id: "cite-1",
        text: "Supervised Learning",
        preview: "In supervised learning, the algorithm learns from labeled training data..."
      },
      {
        id: "cite-2",
        text: "Overfitting",
        preview: "Overfitting occurs when a model learns the training data too well..."
      }
    ]
  },
  "explain": {
    content: "Let me break down the main concepts in simpler terms:\n\n**Machine Learning** is like teaching a computer to recognize patterns, similar to how you learn to recognize faces - you see many examples and eventually figure out what makes each face unique.\n\n**Supervised Learning** is like having a teacher. You show the computer examples with answers (like flash cards with questions and answers).\n\n**Unsupervised Learning** is like giving a child a box of toys without instructions - they'll naturally group similar toys together.\n\n**Reinforcement Learning** is like training a pet - good behavior gets treats, bad behavior doesn't.",
    citations: [
      {
        id: "cite-3",
        text: "Types of Machine Learning",
        preview: "Machine learning can be categorized into three main types..."
      }
    ]
  },
  "quiz": {
    content: "Here are 5 quiz questions based on your notes:\n\n**Question 1:** What is the main difference between supervised and unsupervised learning?\n\n**Question 2:** What happens when a model is \"overfitted\"?\n\n**Question 3:** Name three popular machine learning algorithms mentioned in the notes.\n\n**Question 4:** What is feature engineering and why is it important?\n\n**Question 5:** In reinforcement learning, how does an agent learn to make decisions?",
    citations: []
  },
  "key": {
    content: "The key ideas you should remember are:\n\n1. **ML learns from data** - Unlike traditional programming, ML systems improve through experience\n\n2. **Three learning paradigms** - Supervised (labeled data), Unsupervised (patterns), Reinforcement (rewards)\n\n3. **Data splitting is crucial** - Always separate training and testing data\n\n4. **Balance is key** - Avoid both overfitting (too complex) and underfitting (too simple)\n\n5. **Features matter** - Good feature engineering can make or break a model",
    citations: [
      {
        id: "cite-4",
        text: "Key Concepts",
        preview: "The data is typically split into training and testing sets..."
      }
    ]
  }
}

export function AIBuddyPanel({
  isOpen,
  onClose,
  noteContent,
  onHighlight,
  onScrollToSection,
}: AIBuddyPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (prompt?: string) => {
    const messageText = prompt || input
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let responseData = sampleResponses["key"]
    const lowerPrompt = messageText.toLowerCase()
    
    if (lowerPrompt.includes("summarize") || lowerPrompt.includes("summary")) {
      responseData = sampleResponses["summarize"]
    } else if (lowerPrompt.includes("explain") || lowerPrompt.includes("simpler")) {
      responseData = sampleResponses["explain"]
    } else if (lowerPrompt.includes("quiz") || lowerPrompt.includes("question")) {
      responseData = sampleResponses["quiz"]
    }

    // Create highlights for citations
    const processedCitations = responseData.citations.map((citation) => {
      const highlightId = onHighlight(citation.preview)
      return { ...citation, highlightId }
    })

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: responseData.content,
      citations: processedCitations,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const handleCitationClick = (citation: Citation) => {
    const highlightId = onHighlight(citation.preview)
    if (highlightId) {
      onScrollToSection(highlightId)
    }
  }

  if (!isOpen) return null

  return (
    <aside className="fixed right-0 top-0 h-screen w-96 bg-card border-l border-border flex flex-col z-20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">AI Buddy</h2>
            <p className="text-xs text-muted-foreground">Ask about your notes</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                <Wand2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">How can I help?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ask me anything about your notes
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Suggested
              </p>
              {suggestedPrompts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(item.prompt)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <item.icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm whitespace-pre-wrap",
                      message.role === "assistant" && "text-foreground"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: message.content
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Referenced sections:
                      </p>
                      {message.citations.map((citation) => (
                        <Card
                          key={citation.id}
                          onClick={() => handleCitationClick(citation)}
                          className="p-2 cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {citation.text}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {citation.preview}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your notes..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </aside>
  )
}
