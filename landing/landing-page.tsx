"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Mic,
  Brain,
  Sparkles,
  FileText,
  GraduationCap,
  ArrowRight,
  Check,
  Play,
  ChevronRight
} from "lucide-react"
import { LandingNav } from "./landing-nav"
import { FeatureCard } from "./feature-card"
import { TestimonialCard } from "./testimonial-card"
import { PricingCard } from "./pricing-card"
import { Footer } from "./footer"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-Powered Learning</span>
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Your AI Study Companion for{" "}
              <span className="text-primary">Smarter Learning</span>
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Record lectures, generate intelligent notes, create flashcards, and study smarter with
              your personal AI assistant. Built for students and professionals who want to learn faster.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/getting-started">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. Free forever for personal use.
            </p>
          </div>

          {/* Hero Image/Preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-xl border border-border bg-card p-2 shadow-2xl shadow-primary/5">
              <div className="rounded-lg bg-muted/50 p-1">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-chart-3/60" />
                    <div className="h-3 w-3 rounded-full bg-accent/60" />
                  </div>
                  <div className="ml-4 flex-1 rounded bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                    noteai.app/notes/biology-101
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
                  <div className="col-span-2 space-y-4">
                    <div className="rounded-lg bg-background p-4">
                      <div className="mb-3 h-4 w-32 rounded bg-muted" />
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-5/6 rounded bg-muted" />
                        <div className="h-3 w-4/6 rounded bg-muted" />
                      </div>
                    </div>
                    <div className="rounded-lg bg-background p-4">
                      <div className="mb-3 h-4 w-48 rounded bg-muted" />
                      <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-3/4 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">AI Buddy</span>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-background p-2 text-xs text-muted-foreground">
                        What are the key concepts?
                      </div>
                      <div className="rounded-lg bg-primary/10 p-2 text-xs text-foreground">
                        The main concepts include...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Trusted by students and professionals at
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {["Stanford", "MIT", "Harvard", "Google", "Microsoft", "Amazon"].map((name) => (
              <span key={name} className="text-lg font-semibold text-muted-foreground/60">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Features</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to study smarter
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              From recording lectures to generating flashcards, NoteAI handles the heavy lifting so you can focus on learning.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Mic}
              title="Lecture Recording"
              description="Record lectures with one tap. AI automatically transcribes and generates structured notes."
            />
            <FeatureCard
              icon={FileText}
              title="Smart Notes"
              description="AI-enhanced note editor with formatting, highlighting, and intelligent organization."
            />
            <FeatureCard
              icon={Brain}
              title="AI Study Buddy"
              description="Ask questions about your notes and get instant answers with cited references."
            />
            <FeatureCard
              icon={BookOpen}
              title="Auto Flashcards"
              description="Generate flashcards from your notes automatically. Study with spaced repetition."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Quiz Mode"
              description="Test your knowledge with AI-generated quizzes based on your study material."
            />
            <FeatureCard
              icon={Sparkles}
              title="Smart Summaries"
              description="Get concise summaries of long lectures and complex topics in seconds."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">How it works</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Start learning in minutes
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Record or Upload",
                description: "Record lectures live or upload existing audio. Our AI processes everything automatically."
              },
              {
                step: "02",
                title: "Review & Edit",
                description: "Review AI-generated notes, make edits, and ask your AI buddy any questions."
              },
              {
                step: "03",
                title: "Study & Master",
                description: "Use flashcards, quizzes, and summaries to retain information effectively."
              }
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Testimonials</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Loved by students worldwide
            </h2>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              quote="NoteAI completely changed how I study. I went from struggling to keep up in lectures to having perfect notes every time."
              author="Sarah Chen"
              role="Medical Student"
            />
            <TestimonialCard
              quote="The AI buddy feature is incredible. It's like having a tutor available 24/7 who knows all my notes inside out."
              author="Marcus Johnson"
              role="Law Student"
            />
            <TestimonialCard
              quote="I use NoteAI for every meeting and training session. The automatic transcription saves me hours each week."
              author="Emily Rodriguez"
              role="Product Manager"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-border bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Pricing</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Start free and upgrade when you need more. No hidden fees.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for trying out NoteAI"
              features={[
                "5 recordings per month",
                "Basic note editor",
                "AI summaries",
                "10 AI questions per day"
              ]}
            />
            <PricingCard
              name="Pro"
              price="$12"
              description="For serious students"
              features={[
                "Unlimited recordings",
                "Advanced note editor",
                "Unlimited AI questions",
                "Auto flashcards",
                "Quiz mode",
                "Priority support"
              ]}
              highlighted
            />
            <PricingCard
              name="Team"
              price="$29"
              description="For study groups and teams"
              features={[
                "Everything in Pro",
                "5 team members",
                "Shared notebooks",
                "Admin controls",
                "Analytics dashboard"
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Ready to study smarter?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-primary-foreground/80">
                Join thousands of students already using NoteAI to ace their classes.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base">
                  <Link href="/dashboard">
                    Get Started Free
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
