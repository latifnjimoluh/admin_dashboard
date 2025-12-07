"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { LogoutButton } from "@/components/admin/logout-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Users, BarChart3 } from "lucide-react"
import { DailyEvolutionChart } from "@/components/admin/daily-evolution-chart"
import api from "@/lib/api"

interface VisitorStats {
  total_visits: number
  unique_visitors: number
  average_visits_per_user: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    setIsAuthenticated(true)
    fetchStats()
  }, [router])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await api.tracking.stats()
      setStats(response.data)
      setError(null)
    } catch (err: any) {
      console.error("[Analytics] Error fetching stats:", err)
      setError(err.message || "Erreur lors du chargement des statistiques")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics visiteurs</h1>
            <p className="text-muted-foreground">Statistiques de visite et d'engagement du site</p>
          </div>
          <LogoutButton />
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Block 1 - Quick Statistics */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-4">Statistiques rapides</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-10 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Visits Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total des visites</CardTitle>
                  <Eye className="h-5 w-5 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{stats.total_visits.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-2">Nombre total de chargements du site</p>
                </CardContent>
              </Card>

              {/* Unique Visitors Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visiteurs uniques</CardTitle>
                  <Users className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.unique_visitors.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-2">Basé sur IP hashée</p>
                </CardContent>
              </Card>

              {/* Average Visits Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moyenne par visiteur</CardTitle>
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.average_visits_per_user.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-2">Visites moyennes par utilisateur</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Stats Block 2 - Daily Evolution Graph */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-4">Évolution journalière</h2>
          </div>
          <DailyEvolutionChart daysToShow={30} />
        </div>

        {/* Refresh Button */}
        <div className="flex gap-4">
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Chargement..." : "Rafraîchir"}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
