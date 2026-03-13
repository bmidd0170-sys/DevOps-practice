"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { FileText, Clock, MoreVertical, Edit, Trash2, Copy } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Note {
  id: string
  title: string
  excerpt: string
  date: string
  tags: string[]
}

interface NoteCardProps {
  note: Note
  viewMode: "grid" | "list"
}

export function NoteCard({ note, viewMode }: NoteCardProps) {
  if (viewMode === "list") {
    return (
      <Link href={`/notes/${note.id}`}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{note.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{note.excerpt}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex gap-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-sm whitespace-nowrap">{note.date}</span>
              </div>
              <NoteActions noteId={note.id} />
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow group">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <NoteActions noteId={note.id} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{note.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.excerpt}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex gap-1">
              {note.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
              {note.tags.length > 2 && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  +{note.tags.length - 2}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{note.date}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function NoteActions({ noteId }: { noteId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
