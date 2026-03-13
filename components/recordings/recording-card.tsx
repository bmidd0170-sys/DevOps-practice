"use client"

import { Button } from "@/components/ui/button"
import { Mic, Play, Clock, Calendar, FileText, MoreVertical, Trash2, Download } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Recording {
  id: string
  title: string
  duration: string
  date: string
  status: "recording" | "processing" | "transcribed"
}

interface RecordingCardProps {
  recording: Recording
}

export function RecordingCard({ recording }: RecordingCardProps) {
  return (
    <Link href={`/recordings/${recording.id}`}>
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg",
            recording.status === "recording" ? "bg-destructive/10" : "bg-primary/10"
          )}>
            {recording.status === "recording" ? (
              <div className="w-4 h-4 rounded-full bg-destructive animate-pulse" />
            ) : (
              <Mic className={cn(
                "w-5 h-5",
                recording.status === "processing" ? "text-muted-foreground" : "text-primary"
              )} />
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{recording.title}</h3>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className="text-sm">{recording.duration}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className="text-sm">{recording.date}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={recording.status} />
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatusBadge({ status }: { status: Recording["status"] }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded-full",
        status === "recording" && "bg-destructive/10 text-destructive",
        status === "processing" && "bg-muted text-muted-foreground",
        status === "transcribed" && "bg-accent/10 text-accent"
      )}
    >
      {status === "recording" && "Recording"}
      {status === "processing" && "Processing"}
      {status === "transcribed" && "Transcribed"}
    </span>
  )
}
