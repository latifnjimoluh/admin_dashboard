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

      // L'API client retourne un objet { status, message, data }
      // `data` contient normalement { token, refreshToken, user }
      const payload = response?.data ?? response

      if (!payload || (!payload.token && !payload.data?.token)) {
        throw new Error(response?.message || "Réponse inattendue du serveur")
      }

      const token = payload.token ?? payload.data?.token
      const refreshToken = payload.refreshToken ?? payload.data?.refreshToken
      const user = payload.user ?? payload.data?.user

      // Sauvegarde des tokens
      if (token) localStorage.setItem("admin_token", token)
      if (refreshToken) localStorage.setItem("admin_refresh_token", refreshToken)
      if (user?.role) localStorage.setItem("admin_role", user.role)

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
