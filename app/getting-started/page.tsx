"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  GraduationCap, 
  Briefcase, 
  User, 
  BookOpen,
  Mic,
  FileText,
  Sparkles,
  Check,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, name: "Profile", description: "Tell us about yourself" },
  { id: 2, name: "Purpose", description: "How will you use NoteAI?" },
  { id: 3, name: "Preferences", description: "Customize your experience" },
  { id: 4, name: "Ready", description: "You're all set!" },
]

const userTypes = [
  { 
    id: "student", 
    icon: GraduationCap, 
    title: "Student", 
    description: "College, university, or graduate studies" 
  },
  { 
    id: "professional", 
    icon: Briefcase, 
    title: "Professional", 
    description: "Meetings, training, and work notes" 
  },
  { 
    id: "personal", 
    icon: User, 
    title: "Personal", 
    description: "Self-learning and personal projects" 
  },
]

const features = [
  { id: "recording", icon: Mic, title: "Lecture Recording", description: "Record and transcribe audio" },
  { id: "notes", icon: FileText, title: "Smart Notes", description: "AI-enhanced note taking" },
  { id: "flashcards", icon: BookOpen, title: "Flashcards", description: "Auto-generated study cards" },
  { id: "ai", icon: Sparkles, title: "AI Assistant", description: "Ask questions about your notes" },
]

const subjects = [
  "Science & Medicine",
  "Business & Finance", 
  "Law & Politics",
  "Technology & Engineering",
  "Arts & Humanities",
  "Languages",
  "Mathematics",
  "Other"
]

export default function GettingStartedPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    displayName: "",
    userType: "",
    selectedFeatures: ["recording", "notes", "flashcards", "ai"],
    subjects: [] as string[],
  })

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/dashboard")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter(f => f !== featureId)
        : [...prev.selectedFeatures, featureId]
    }))
  }

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.displayName.length > 0
      case 2:
        return formData.userType.length > 0
      case 3:
        return formData.selectedFeatures.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">NoteAI</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Skip for now</Link>
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-muted-foreground">
              {steps[currentStep - 1].name}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                      currentStep > step.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={cn(
                    "mt-2 text-xs font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "mx-4 h-0.5 w-16 transition-colors sm:w-24",
                      currentStep > step.id ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-6">
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Let's personalize your experience
                </h1>
                <p className="mt-2 text-muted-foreground">
                  We'll use this information to customize NoteAI for you
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">What should we call you?</Label>
                      <Input
                        id="displayName"
                        placeholder="Enter your name"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>What best describes you?</Label>
                      <RadioGroup
                        value={formData.userType}
                        onValueChange={(value) => setFormData({ ...formData, userType: value })}
                        className="grid gap-3"
                      >
                        {userTypes.map((type) => (
                          <Label
                            key={type.id}
                            htmlFor={type.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors hover:bg-muted/50",
                              formData.userType === type.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg",
                              formData.userType === type.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}>
                              <type.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{type.title}</p>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                            {formData.userType === type.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Purpose */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  What will you study?
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Select the subjects you're interested in (you can change this later)
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    {subjects.map((subject) => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border-2 p-4 text-left transition-colors hover:bg-muted/50",
                          formData.subjects.includes(subject)
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        )}
                      >
                        <span className={cn(
                          "text-sm font-medium",
                          formData.subjects.includes(subject) ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {subject}
                        </span>
                        {formData.subjects.includes(subject) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Enable your favorite features
                </h1>
                <p className="mt-2 text-muted-foreground">
                  We'll show these prominently in your dashboard
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <Card
                    key={feature.id}
                    className={cn(
                      "cursor-pointer border-2 transition-colors hover:bg-muted/50",
                      formData.selectedFeatures.includes(feature.id)
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() => toggleFeature(feature.id)}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg",
                        formData.selectedFeatures.includes(feature.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{feature.title}</p>
                          <Checkbox
                            checked={formData.selectedFeatures.includes(feature.id)}
                            className="pointer-events-none"
                          />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {currentStep === 4 && (
            <div className="space-y-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-10 w-10 text-primary" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  You're all set, {formData.displayName || "there"}!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Your NoteAI workspace is ready. Here's what you can do next:
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {[
                      { title: "Record your first lecture", description: "Start capturing audio and let AI do the rest", href: "/recordings/new" },
                      { title: "Create a new note", description: "Write notes with AI-powered assistance", href: "/notes/new" },
                      { title: "Explore your dashboard", description: "See an overview of your learning progress", href: "/dashboard" },
                    ].map((item, index) => (
                      <Link
                        key={index}
                        href={item.href}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="text-left">
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(currentStep === 1 && "invisible")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {currentStep === steps.length ? "Go to Dashboard" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
