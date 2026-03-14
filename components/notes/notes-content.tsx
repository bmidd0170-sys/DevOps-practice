"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NoteCard } from "@/components/notes/note-card"
import { Plus, Search, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface ApiNote {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface DisplayNote {
  id: number
  title: string
  content: string
  excerpt: string
  date: string
  tags: string[]
}

export function NotesContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [notes, setNotes] = useState<DisplayNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadNotes = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await fetch("/api/notes", { cache: "no-store" })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load notes")
      }

      const mapped: DisplayNote[] = (payload as ApiNote[]).map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        excerpt: note.content.length > 160 ? `${note.content.slice(0, 157)}...` : note.content,
        date: formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }),
        tags: [],
      }))

      setNotes(mapped)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load notes"
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  const filteredNotes = useMemo(() => notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  }), [notes, searchQuery])

  const removeNote = useCallback((id: number) => {
    setNotes((current) => current.filter((note) => note.id !== id))
  }, [])

  const addDuplicatedNote = useCallback((note: DisplayNote) => {
    const nowDate = formatDistanceToNow(new Date(), { addSuffix: true })
    setNotes((current) => [{ ...note, date: nowDate }, ...current])
    toast.success("Note duplicated")
  }, [])

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-1">All your study notes in one place</p>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="w-4 h-4" />
            Create Note
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex gap-1 border border-border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading notes...</div>
      )}

      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadNotes()}>
            Retry
          </Button>
        </div>
      )}

      {/* Notes Grid/List */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "flex flex-col gap-3"
        )}
      >
        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            viewMode={viewMode}
            onDelete={removeNote}
            onDuplicate={addDuplicatedNote}
          />
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && !loadError && filteredNotes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No notes found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  )
}
