"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NoteCard } from "@/components/notes/note-card"
import { Plus, Search, LayoutGrid, List, Filter } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const allNotes = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    excerpt: "Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data...",
    date: "2 hours ago",
    tags: ["AI", "Computer Science"],
  },
  {
    id: "2",
    title: "Organic Chemistry - Alkenes",
    excerpt: "Alkenes are unsaturated hydrocarbons containing at least one carbon-carbon double bond...",
    date: "Yesterday",
    tags: ["Chemistry"],
  },
  {
    id: "3",
    title: "World War II Overview",
    excerpt: "The Second World War was a global conflict that lasted from 1939 to 1945, involving most of the world's nations...",
    date: "2 days ago",
    tags: ["History"],
  },
  {
    id: "4",
    title: "Calculus - Integration Techniques",
    excerpt: "Integration is the reverse process of differentiation. There are several techniques for solving integrals...",
    date: "3 days ago",
    tags: ["Mathematics"],
  },
  {
    id: "5",
    title: "Psychology - Cognitive Development",
    excerpt: "Piaget's theory of cognitive development describes how children construct a mental model of the world...",
    date: "4 days ago",
    tags: ["Psychology"],
  },
  {
    id: "6",
    title: "Economics - Supply and Demand",
    excerpt: "The law of supply and demand describes how prices are determined in a market economy...",
    date: "5 days ago",
    tags: ["Economics"],
  },
]

const allTags = ["All", "AI", "Computer Science", "Chemistry", "History", "Mathematics", "Psychology", "Economics"]

export function NotesContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")

  const filteredNotes = allNotes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = selectedTag === "All" || note.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

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
            <Plus className="w-4 h-4 mr-2" />
            Create Note
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {allTags.map((tag) => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={cn(selectedTag === tag && "bg-accent")}
                >
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Selected Tag */}
      {selectedTag !== "All" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedTag("All")}
            className="h-7"
          >
            {selectedTag}
            <span className="ml-1 text-muted-foreground">&times;</span>
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
          <NoteCard key={note.id} note={note} viewMode={viewMode} />
        ))}
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 && (
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
