"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Brain, Eye, EyeOff, ArrowRight, Sparkles, BookOpen, Mic } from "lucide-react"
import { useNotifications } from "@/components/notifications/notification-context"
import { useAuth } from "@/components/auth/auth-context"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, isConfigured, signInWithEmailPassword, signInWithGoogle, signUpWithEmailPassword } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { sendNotification } = useNotifications()

  const getNextPath = () => {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("next")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const trimmedEmail = email.trim()
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()

    try {
      if (isSignUp) {
        await signUpWithEmailPassword(trimmedEmail, password, fullName)
      } else {
        await signInWithEmailPassword(trimmedEmail, password)
      }

      // Save (or update) the profile so all notifications use the real email.
      localStorage.setItem(
        "noteai.profile.v1",
        JSON.stringify({
          name: (isSignUp ? fullName : user?.displayName) || trimmedEmail,
          email: trimmedEmail,
        })
      )

      if (isSignUp) {
        // Send a welcome notification in-app + email on new account creation.
        await sendNotification({
          email: trimmedEmail,
          recipientName: fullName || trimmedEmail,
          subject: "Welcome to NoteAI!",
          title: "Welcome to NoteAI!",
          message:
            "Your account is ready. Start by creating a note, recording a lecture, or asking the AI anything about your study material.",
          type: "success",
        })
      }

      const next = getNextPath() || (isSignUp ? "/getting-started" : "/dashboard")
      router.push(next)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    try {
      const result = await signInWithGoogle()

      localStorage.setItem(
        "noteai.profile.v1",
        JSON.stringify({
          name: result.displayName || result.email,
          email: result.email,
        })
      )

      if (result.isNewUser && result.email) {
        await sendNotification({
          email: result.email,
          recipientName: result.displayName || result.email,
          subject: "Welcome to NoteAI!",
          title: "Welcome to NoteAI!",
          message:
            "Your account is ready. Start by creating a note, recording a lecture, or asking the AI anything about your study material.",
          type: "success",
        })
      }

      const next = getNextPath() || "/dashboard"
      router.push(next)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google authentication failed"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      router.replace(getNextPath() || "/dashboard")
    }
  }, [router, user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    )
  }

  if (user) return null

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-semibold">Firebase is not configured</h1>
          <p className="text-sm text-muted-foreground">
            Add the NEXT_PUBLIC_FIREBASE_* variables and reload to enable email/password login.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">NoteAI</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="text-xl font-medium leading-relaxed text-primary-foreground/90">
            "NoteAI transformed my study routine completely. I went from struggling to keep up in lectures to having organized, searchable notes with AI-powered insights."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/10 text-lg font-semibold text-primary-foreground">
              SC
            </div>
            <div>
              <p className="font-medium text-primary-foreground">Sarah Chen</p>
              <p className="text-sm text-primary-foreground/70">Medical Student, Stanford</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-primary-foreground/10 p-4 text-center">
            <Mic className="mx-auto mb-2 h-6 w-6 text-primary-foreground/80" />
            <p className="text-xs text-primary-foreground/70">Smart Recording</p>
          </div>
          <div className="rounded-lg bg-primary-foreground/10 p-4 text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary-foreground/80" />
            <p className="text-xs text-primary-foreground/70">AI Assistant</p>
          </div>
          <div className="rounded-lg bg-primary-foreground/10 p-4 text-center">
            <BookOpen className="mx-auto mb-2 h-6 w-6 text-primary-foreground/80" />
            <p className="text-xs text-primary-foreground/70">Auto Flashcards</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">NoteAI</span>
            </Link>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="space-y-1 px-0 lg:px-6">
              <CardTitle className="text-2xl font-bold">
                {isSignUp ? "Create an account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? "Enter your details to get started with NoteAI"
                  : "Enter your credentials to access your account"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 lg:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        required={isSignUp}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        required={isSignUp}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      required
                      className="pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" required className="mt-1" />
                    <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                )}

                {!isSignUp && (
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                      Remember me for 30 days
                    </Label>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {isSignUp ? "Creating account..." : "Signing in..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isSignUp ? "Create account" : "Sign in"}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
              >
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden="true">
                  <path
                    d="M21.35 11.1H12v2.98h5.39c-.23 1.49-1.69 4.37-5.39 4.37-3.25 0-5.9-2.7-5.9-6.03s2.65-6.03 5.9-6.03c1.85 0 3.09.79 3.8 1.47l2.58-2.49C16.73 3.85 14.56 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.59-.07-1.04-.15-1.5Z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or use email + password
                </span>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-medium text-primary hover:underline"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
