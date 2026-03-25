"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { withFirebaseUserHeaders } from "@/lib/client-auth"

interface GoogleSignInResult {
  email: string
  displayName: string | null
  isNewUser: boolean
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  isConfigured: boolean
  signInWithEmailPassword: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<GoogleSignInResult>
  signUpWithEmailPassword: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({ prompt: "select_account" })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/users/settings", {
        headers: withFirebaseUserHeaders(),
        cache: "no-store",
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.settings) {
        return
      }

      // Store settings in localStorage for immediate application
      localStorage.setItem("noteai.settings.v1", JSON.stringify(payload.settings))

      // Store profile if available
      if (payload.profile) {
        localStorage.setItem("noteai.profile.v1", JSON.stringify(payload.profile))
      }

      // Apply compact mode immediately
      if (payload.settings.compactMode) {
        document.documentElement.classList.add("compact")
      }
    } catch {
      // Keep auth flow resilient if fetching settings fails
    }
  }, [])

  const syncUserToDatabase = useCallback(async () => {
    try {
      await fetch("/api/users/sync", {
        method: "POST",
        headers: withFirebaseUserHeaders(),
      })
      // After syncing user, load their settings
      await loadUserSettings()
    } catch {
      // Keep auth flow resilient if user sync fails transiently.
    }
  }, [loadUserSettings])

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)

      if (nextUser) {
        void syncUserToDatabase()
      }
    })

    return unsubscribe
  }, [syncUserToDatabase])

  const throwIfUnconfigured = useCallback(() => {
    if (!auth) {
      throw new Error(
        "Firebase auth is not configured. Add NEXT_PUBLIC_FIREBASE_* environment variables."
      )
    }
  }, [])

  const signInWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      throwIfUnconfigured()
      await signInWithEmailAndPassword(auth!, email, password)
    },
    [throwIfUnconfigured]
  )

  const signInWithGoogle = useCallback(async (): Promise<GoogleSignInResult> => {
    throwIfUnconfigured()

    const credentials = await signInWithPopup(auth!, googleProvider)
    const additionalInfo = getAdditionalUserInfo(credentials)

    return {
      email: credentials.user.email || "",
      displayName: credentials.user.displayName,
      isNewUser: Boolean(additionalInfo?.isNewUser),
    }
  }, [throwIfUnconfigured])

  const signUpWithEmailPassword = useCallback(
    async (email: string, password: string, displayName?: string) => {
      throwIfUnconfigured()
      const credentials = await createUserWithEmailAndPassword(auth!, email, password)

      if (displayName?.trim()) {
        await updateProfile(credentials.user, { displayName: displayName.trim() })
      }
    },
    [throwIfUnconfigured]
  )

  const signOutUser = useCallback(async () => {
    throwIfUnconfigured()
    await signOut(auth!)
  }, [throwIfUnconfigured])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      signInWithEmailPassword,
      signInWithGoogle,
      signUpWithEmailPassword,
      signOutUser,
    }),
    [
      loading,
      signInWithEmailPassword,
      signInWithGoogle,
      signOutUser,
      signUpWithEmailPassword,
      user,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
