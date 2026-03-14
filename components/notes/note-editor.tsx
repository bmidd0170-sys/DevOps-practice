"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AIBuddyPanel } from "@/components/notes/ai-buddy-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Save,
  MoreVertical,
  Sparkles,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const sampleContent = `# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence (AI) that focuses on building systems that learn from and make decisions based on data. Rather than being explicitly programmed to perform a task, these systems are trained using large amounts of data and algorithms.

## Types of Machine Learning

### Supervised Learning
In supervised learning, the algorithm learns from labeled training data, and makes predictions based on that data. The training data includes both the input and the desired output.

**Key characteristics:**
- Uses labeled datasets
- Makes predictions based on examples
- Common for classification and regression tasks

### Unsupervised Learning
Unsupervised learning deals with unlabeled data. The system tries to learn the patterns and the structure from the data without any explicit instructions.

**Applications include:**
- Clustering similar data points
- Dimensionality reduction
- Anomaly detection

### Reinforcement Learning
In reinforcement learning, an agent learns to make decisions by performing actions and receiving rewards or penalties. The goal is to maximize the cumulative reward.

## Key Concepts

### Training and Testing
The data is typically split into training and testing sets. The model learns patterns from the training set and is evaluated on the testing set to measure its performance.

### Overfitting and Underfitting
- **Overfitting** occurs when a model learns the training data too well, including noise and outliers
- **Underfitting** happens when a model is too simple to capture the underlying patterns

### Feature Engineering
Feature engineering involves using domain knowledge to select and transform variables (features) that make machine learning algorithms work better.

## Popular Algorithms

1. Linear Regression
2. Decision Trees
3. Random Forests
4. Support Vector Machines
5. Neural Networks
6. K-Nearest Neighbors

## Conclusion

Machine learning continues to evolve rapidly, with new techniques and applications emerging regularly. Understanding the fundamentals is crucial for anyone looking to work in this field.`

export function NoteEditor({ noteId }: { noteId: string }) {
  const router = useRouter()
  const alignmentCycle = ["left", "center", "right"] as const
  type TextAlignment = (typeof alignmentCycle)[number]

  const [title, setTitle] = useState("")
  const [fontSize, setFontSize] = useState<number | string>(16)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true)
  const [plainText, setPlainText] = useState("")
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [isBoldActive, setIsBoldActive] = useState(false)
  const [isItalicActive, setIsItalicActive] = useState(false)
  const [isHighlightActive, setIsHighlightActive] = useState(false)
  const [textAlignment, setTextAlignment] = useState<TextAlignment>("left")
  const [highlightMode, setHighlightMode] = useState(false)
  const [isLoadingNote, setIsLoadingNote] = useState(noteId !== "new")
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<string[]>([])
  const redoStackRef = useRef<string[]>([])
  // Saves the editor's selection when focus leaves (e.g. user clicks size input)
  const savedRangeRef = useRef<Range | null>(null)

  const refreshUndoRedoState = useCallback(() => {
    setCanUndo(historyRef.current.length > 1)
    setCanRedo(redoStackRef.current.length > 0)
  }, [])

  const commitHistorySnapshot = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const html = editor.innerHTML
    const history = historyRef.current
    if (history[history.length - 1] === html) {
      refreshUndoRedoState()
      return
    }

    history.push(html)
    if (history.length > 200) {
      history.shift()
    }
    redoStackRef.current = []
    refreshUndoRedoState()
  }, [refreshUndoRedoState])

  const findHighlightElement = useCallback((node: Node | null) => {
    const editor = editorRef.current
    let current: Node | null = node

    while (current && current !== editor) {
      if (current instanceof HTMLElement) {
        const hasInlineHighlight = current.dataset.noteHighlight === "true"
        if (current.tagName === "MARK" || hasInlineHighlight) {
          return current
        }
      }
      current = current.parentNode
    }

    return null
  }, [])

  const unwrapElement = useCallback((element: HTMLElement) => {
    const parent = element.parentNode
    if (!parent) return

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element)
    }

    parent.removeChild(element)
    parent.normalize()
  }, [])

  const refreshFormattingState = useCallback(() => {
    const selection = window.getSelection()
    const editor = editorRef.current

    if (!selection || !editor || !selection.rangeCount) {
      setIsBoldActive(false)
      setIsItalicActive(false)
      setIsHighlightActive(false)
      return
    }

    const anchorNode = selection.anchorNode
    if (!anchorNode || !editor.contains(anchorNode)) {
      setIsBoldActive(false)
      setIsItalicActive(false)
      setIsHighlightActive(false)
      return
    }

    setIsBoldActive(document.queryCommandState("bold"))
    setIsItalicActive(document.queryCommandState("italic"))
    if (document.queryCommandState("justifyCenter")) {
      setTextAlignment("center")
    } else if (document.queryCommandState("justifyRight")) {
      setTextAlignment("right")
    } else {
      setTextAlignment("left")
    }

    setIsHighlightActive(Boolean(findHighlightElement(selection.anchorNode)))
  }, [findHighlightElement])

  const applyHistorySnapshot = useCallback((html: string) => {
    const editor = editorRef.current
    if (!editor) return

    editor.innerHTML = html
    setPlainText(editor.innerText.replace(/\u200B/g, ""))
    requestAnimationFrame(refreshFormattingState)
  }, [refreshFormattingState])

  useEffect(() => {
    let cancelled = false

    const loadNote = async () => {
      if (noteId === "new") {
        setIsLoadingNote(false)
        setTitle("")
        setPlainText("")
        if (editorRef.current) {
          editorRef.current.innerHTML = ""
          historyRef.current = [editorRef.current.innerHTML]
          redoStackRef.current = []
        }
        refreshUndoRedoState()
        refreshFormattingState()
        return
      }

      setIsLoadingNote(true)
      try {
        const response = await fetch(`/api/notes/${noteId}`, { cache: "no-store" })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load note")
        }

        if (cancelled) return

        const loadedTitle = typeof payload?.title === "string" ? payload.title : ""
        const loadedContent = typeof payload?.content === "string" ? payload.content : ""

        setTitle(loadedTitle)
        setPlainText(loadedContent)
        if (editorRef.current) {
          editorRef.current.innerText = loadedContent
          historyRef.current = [editorRef.current.innerHTML]
          redoStackRef.current = []
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load note"
          toast.error(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNote(false)
          refreshUndoRedoState()
          refreshFormattingState()
        }
      }
    }

    void loadNote()

    return () => {
      cancelled = true
    }
  }, [noteId, refreshFormattingState, refreshUndoRedoState])

  useEffect(() => {
    const handleSelectionChange = () => {
      refreshFormattingState()
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
    }
  }, [refreshFormattingState])

  /** Persist selection whenever editor loses focus so toolbar clicks can restore it. */
  const handleEditorBlur = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }, [])

  /** Restore the last saved selection inside the editor. */
  const restoreSelection = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    if (savedRangeRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedRangeRef.current)
      }
    }
  }, [])

  /**
   * Apply font size to selected text, or insert an anchor span at the cursor
   * so that text typed immediately after uses that size.
   */
  const applyFontSize = useCallback((size: number) => {
    restoreSelection()
    const editor = editorRef.current
    if (!editor) return

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return

    const range = sel.getRangeAt(0)
    const span = document.createElement("span")
    span.style.fontSize = `${size}px`

    if (!sel.isCollapsed) {
      // Wrap the selected content in a sized span
      const fragment = range.extractContents()
      span.appendChild(fragment)
      range.insertNode(span)
      // Collapse selection to end of inserted span
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      newRange.collapse(false)
      sel.removeAllRanges()
      sel.addRange(newRange)
    } else {
      // Nothing selected — insert an anchor span with a zero-width space so
      // the cursor sits inside it. Text typed right after will inherit the size.
      span.textContent = "\u200B"
      range.insertNode(span)
      const newRange = document.createRange()
      newRange.setStart(span.firstChild!, 1)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
    }
    setPlainText(editor.innerText.replace(/\u200B/g, ""))
    requestAnimationFrame(commitHistorySnapshot)
    requestAnimationFrame(refreshFormattingState)
  }, [commitHistorySnapshot, refreshFormattingState, restoreSelection])

  /** Run a browser execCommand (bold, italic, lists, etc.). Uses mousedown on
   *  toolbar buttons so focus (and selection) stays in the editor. */
  const execCmd = useCallback((command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value ?? undefined)
    requestAnimationFrame(commitHistorySnapshot)
    requestAnimationFrame(refreshFormattingState)
  }, [commitHistorySnapshot, refreshFormattingState])

  /** Wrap the current selection (or insert placeholder) in an arbitrary element. */
  const wrapSelection = useCallback((makeEl: () => HTMLElement) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return

    const range = sel.getRangeAt(0)
    const el = makeEl()

    if (sel.isCollapsed) {
      if (el.tagName === "PRE") {
        // Keep empty code blocks visually empty while still allowing caret placement.
        el.textContent = "\u200B"
      } else {
        el.textContent = el.tagName === "BLOCKQUOTE" ? "Quote…" : ""
      }
      range.insertNode(el)
      const newRange = document.createRange()
      if (el.tagName === "PRE" && el.firstChild) {
        newRange.setStart(el.firstChild, 1)
        newRange.collapse(true)
      } else {
        newRange.selectNodeContents(el)
      }
      sel.removeAllRanges()
      sel.addRange(newRange)
    } else {
      const fragment = range.extractContents()
      el.appendChild(fragment)
      range.insertNode(el)
      sel.collapseToEnd()
    }
    setPlainText(editor.innerText.replace(/\u200B/g, ""))
    requestAnimationFrame(commitHistorySnapshot)
    requestAnimationFrame(refreshFormattingState)
  }, [commitHistorySnapshot, refreshFormattingState])

  const toggleHighlight = useCallback(() => {
    setHighlightMode((prev) => !prev)
  }, [])

  const wrapLastInsertedText = useCallback(() => {
    if (!highlightMode) return

    const editor = editorRef.current
    if (!editor) return

    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return

    const range = sel.getRangeAt(0)
    const cursorNode = range.startContainer

    // Check if cursor is already inside a highlight
    if (findHighlightElement(cursorNode)) return

    // Look backwards from cursor to find the last text node
    let textNode = cursorNode.nodeType === 3 ? cursorNode : null

    if (!textNode && cursorNode.nodeType === 1) {
      // Cursor is at element level, find the last text node
      if (cursorNode.lastChild && cursorNode.lastChild.nodeType === 3) {
        textNode = cursorNode.lastChild as Text
      }
    }

    if (!textNode || textNode.textContent === "") return

    // Get the text content
    const text = textNode.textContent
    if (!text) return

    // Create highlight span and wrap the text node
    const highlight = document.createElement("span")
    highlight.dataset.noteHighlight = "true"
    highlight.style.backgroundColor = "#fef08a"
    highlight.textContent = text

    textNode.parentNode?.replaceChild(highlight, textNode)

    // Position cursor at end of highlight
    const newRange = document.createRange()
    newRange.setStart(highlight.firstChild!, text.length)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
  }, [highlightMode, findHighlightElement])

  const handleInput = useCallback(() => {
    setPlainText(editorRef.current?.innerText?.replace(/\u200B/g, "") ?? "")
    wrapLastInsertedText()
    requestAnimationFrame(commitHistorySnapshot)
    requestAnimationFrame(refreshFormattingState)
  }, [commitHistorySnapshot, wrapLastInsertedText, refreshFormattingState])

  const handleUndo = useCallback(() => {
    const history = historyRef.current
    if (history.length <= 1) return

    const currentSnapshot = history.pop()
    if (!currentSnapshot) return

    redoStackRef.current.push(currentSnapshot)
    const previousSnapshot = history[history.length - 1]
    if (previousSnapshot === undefined) return

    applyHistorySnapshot(previousSnapshot)
    refreshUndoRedoState()
  }, [applyHistorySnapshot, refreshUndoRedoState])

  const handleRedo = useCallback(() => {
    const redoStack = redoStackRef.current
    if (redoStack.length === 0) return

    const nextSnapshot = redoStack.pop()
    if (!nextSnapshot) return

    historyRef.current.push(nextSnapshot)
    applyHistorySnapshot(nextSnapshot)
    refreshUndoRedoState()
  }, [applyHistorySnapshot, refreshUndoRedoState])

  const cycleAlignment = useCallback(() => {
    const currentIndex = alignmentCycle.indexOf(textAlignment)
    const nextAlignment = alignmentCycle[(currentIndex + 1) % alignmentCycle.length]

    if (nextAlignment === "left") {
      execCmd("justifyLeft")
    } else if (nextAlignment === "center") {
      execCmd("justifyCenter")
    } else {
      execCmd("justifyRight")
    }
  }, [alignmentCycle, execCmd, textAlignment])

  const scrollToSection = useCallback((_sectionId: string) => {
    editorRef.current?.focus()
  }, [])

  const handleHighlight = useCallback((text: string) => {
    if ((editorRef.current?.innerText ?? "").includes(text)) {
      return `highlight-${Date.now()}`
    }
    return null
  }, [])

  const AlignmentIcon = textAlignment === "center"
    ? AlignCenter
    : textAlignment === "right"
      ? AlignRight
      : AlignLeft

  const handleSave = useCallback(async () => {
    const content = (editorRef.current?.innerText ?? plainText).replace(/\u200B/g, "").trim()
    const cleanTitle = title.trim()

    if (!cleanTitle || !content) {
      toast.error("Both title and note content are required")
      return
    }

    setIsSaving(true)
    try {
      const isCreate = noteId === "new"
      const endpoint = isCreate ? "/api/notes" : `/api/notes/${noteId}`
      const method = isCreate ? "POST" : "PUT"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          content,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to save note")
      }

      setTitle(payload.title)
      setPlainText(payload.content)
      toast.success("Note saved")

      if (isCreate) {
        router.replace(`/notes/${payload.id}`)
      } else {
        router.refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save note"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [noteId, plainText, router, title])

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/notes">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isAIPanelOpen ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Buddy
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || isLoadingNote}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Toolbar — buttons use onMouseDown + preventDefault to keep editor focus/selection */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30">
          <Button
            variant="ghost" size="icon"
            onMouseDown={(e) => { e.preventDefault(); handleUndo() }}
            disabled={!canUndo}
            className="h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onMouseDown={(e) => { e.preventDefault(); handleRedo() }}
            disabled={!canRedo}
            className="h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />

          {/* Font size control */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground select-none">Size</span>
            <input
              type="text"
              inputMode="numeric"
              value={fontSize}
              onChange={(e) => {
                const input = e.target.value
                if (input === "") {
                  setFontSize("")
                  return
                }
                if (!/^\d+$/.test(input)) return
                setFontSize(input)
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return
                e.preventDefault()
                if (fontSize === "") return

                const parsed = parseInt(String(fontSize), 10)
                if (Number.isNaN(parsed)) return

                const clamped = Math.min(72, Math.max(8, parsed))
                setFontSize(clamped)
                applyFontSize(clamped)
              }}
              onFocus={(e) => e.target.select()}
              className="w-14 h-8 rounded-md border border-border bg-background px-2 text-sm text-center text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Font size"
            />
          </div>
          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", isBoldActive && "bg-accent text-accent-foreground")}
            onMouseDown={(e) => { e.preventDefault(); execCmd("bold") }}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", isItalicActive && "bg-accent text-accent-foreground")}
            onMouseDown={(e) => { e.preventDefault(); execCmd("italic") }}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", highlightMode && "bg-accent text-accent-foreground")}
            onMouseDown={(e) => { e.preventDefault(); toggleHighlight() }}>
            <Highlighter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onMouseDown={(e) => { e.preventDefault(); cycleAlignment() }}
            title={`Text alignment: ${textAlignment}. Click to cycle.`}
            aria-label={`Text alignment: ${textAlignment}. Click to cycle.`}
          >
            <AlignmentIcon className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onMouseDown={(e) => { e.preventDefault(); execCmd("insertUnorderedList") }}>
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onMouseDown={(e) => { e.preventDefault(); execCmd("insertOrderedList") }}>
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onMouseDown={(e) => {
              e.preventDefault()
              wrapSelection(() => {
                const pre = document.createElement("pre")
                pre.style.cssText = "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background:rgba(0,0,0,.08);padding:.6em .75em;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere;margin:.4em 0"
                return pre
              })
            }}>
            <Code className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex">
          <div className={cn("flex-1 overflow-auto", isAIPanelOpen && "lg:mr-96")}>
            <div className="max-w-3xl mx-auto p-6 lg:p-8 relative">
              {plainText === "" && (
                <p className="absolute top-9 left-10 text-base leading-7 text-muted-foreground pointer-events-none select-none">
                  Start writing your note…
                </p>
              )}
              <div
                ref={editorRef}
                contentEditable={!isLoadingNote}
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleEditorBlur}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === "z") {
                    e.preventDefault()
                    handleUndo()
                  } else if (e.ctrlKey && e.key === "y") {
                    e.preventDefault()
                    handleRedo()
                  }
                }}
                className="w-full min-h-[70vh] rounded-xl border border-border bg-card px-4 py-3 text-base leading-7 text-foreground outline-none focus:ring-2 focus:ring-ring [&_p]:m-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1"
                spellCheck
              />
              {isLoadingNote && (
                <p className="mt-3 text-sm text-muted-foreground">Loading note...</p>
              )}
            </div>
          </div>

          {/* AI Buddy Panel */}
          <AIBuddyPanel
            isOpen={isAIPanelOpen}
            onClose={() => setIsAIPanelOpen(false)}
            noteContent={plainText}
          />
        </div>
      </div>
    </div>
  )
}



