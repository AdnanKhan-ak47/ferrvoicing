"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is logged in (replace with actual auth logic)
      const isLoggedIn = await invoke("is_logged_in");
      const onboardingCompleted = await invoke("is_onboarded");
      console.log("onboardingCompleted: ", onboardingCompleted);

      if (!isLoggedIn) {
        router.push("/login")
      } else if (!onboardingCompleted) {
        router.push("/onboarding")
      } else {
        setIsAuthenticated(true)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
