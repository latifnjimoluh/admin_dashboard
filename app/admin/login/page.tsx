"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoginCard } from "@/components/admin/login-card"

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Fake credentials check
    if (email === "admin@moviepark.com" && password === "admin123") {
      // Store fake token in localStorage
      localStorage.setItem("admin_token", "fake_jwt_token_12345")
      router.push("/admin/dashboard")
    } else {
      setError("Identifiants incorrects")
      setIsLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] p-4">
      <LoginCard onLogin={handleLogin} isLoading={isLoading} error={error} />
    </section>
  )
}
