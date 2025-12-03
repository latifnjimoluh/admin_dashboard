"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { StatsGrid } from "@/components/admin/stats-grid"
import { LogoutButton } from "@/components/admin/logout-button"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    setIsAuthenticated(true)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Chargement...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="dashboard-title text-4xl font-bold mb-2">Tableau de bord</h1>
            <p className="dashboard-welcome text-muted-foreground">Bienvenue administrateur Movie in the Park</p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats Grid */}
        <StatsGrid />
      </div>
    </AdminLayout>
  )
}
