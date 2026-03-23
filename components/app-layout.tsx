"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useAuth } from "@/components/auth/auth-context"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, isConfigured } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      const encodedPath = encodeURIComponent(pathname || "/dashboard")
      router.replace(`/login?next=${encodedPath}`)
    }
  }, [loading, pathname, router, user])

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-semibold">Firebase is not configured</h1>
          <p className="text-sm text-muted-foreground">
            Add the NEXT_PUBLIC_FIREBASE_* variables to run authentication.
          </p>
        </div>
      </div>
    )
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header with notification bell */}
        <header className="flex h-14 shrink-0 items-center justify-end border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
