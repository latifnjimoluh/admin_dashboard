"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoginCard } from "@/components/admin/login-card"
import { api } from "@/lib/api"

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    try {
      // --- Appel API réel ---
      const response = await api.auth.login(email, password)

      // Sauvegarde des tokens
      localStorage.setItem("admin_token", response.token)
      localStorage.setItem("admin_refresh_token", response.refreshToken)
      localStorage.setItem("admin_role", response.user.role)

      // Redirection
      router.push("/admin/dashboard")
    } catch (err: any) {
      setError(err.message || "Erreur de connexion")
      setIsLoading(false)
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#1a1a1a] p-4">
      <LoginCard onLogin={handleLogin} isLoading={isLoading} error={error} />
    </section>
  )
}
