"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Use `null` as the initial state to represent "loading" or "unknown"
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isLoggedIn = await invoke<boolean>("is_logged_in");
        const onboardingCompleted = await invoke<boolean>("is_onboarded");

        if (!isLoggedIn) {
          // Use replace so the user can't click "back" to the protected page
          router.replace("/login");
        } else if (!onboardingCompleted) {
          router.replace("/onboarding");
        } else {
          // If everything is okay, authorize rendering
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.replace("/login"); // Redirect on error
      }
    };

    checkAuth();
  }, [router]);

  // While checking the auth status, show a loading screen
  if (isAuthorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If authorized, render the actual page content
  return <>{children}</>;
}