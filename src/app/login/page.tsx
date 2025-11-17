'use client'
import { LoginForm } from "@/components/auth/login-form"
import { invoke } from "@tauri-apps/api/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isLoggedIn = await invoke<boolean>("is_logged_in");
        if (isLoggedIn) {
          router.replace("/invoices");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.replace("/login"); // Redirect on error
      }
    };

    checkAuth();
  }, [router]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoginForm />
    </div>
  )
}
