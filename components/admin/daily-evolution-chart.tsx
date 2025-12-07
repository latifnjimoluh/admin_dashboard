"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"

interface DailyData {
  date: string
  total_visits: number
  unique_visitors: number
}

interface EvolutionData {
  period_days: number
  data: DailyData[]
}

export function DailyEvolutionChart({ daysToShow = 30 }: { daysToShow?: number }) {
  const [data, setData] = useState<DailyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvolutionData()
  }, [daysToShow])

  const fetchEvolutionData = async () => {
    try {
      setIsLoading(true)
      const response = await api.tracking.evolution(daysToShow)
      const evolutionData = response.data as EvolutionData
      setData(evolutionData.data)
      setError(null)
    } catch (err: any) {
      console.error("[DailyEvolutionChart] Error:", err)
      setError(err.message || "Erreur lors du chargement des données")
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00Z")
    return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Graphique d'évolution</CardTitle>
        <CardDescription>Visites totales et visiteurs uniques des 30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Chargement du graphique...</p>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.map((item) => ({ ...item, dateFormatted: formatDate(item.date) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateFormatted" style={{ fontSize: "12px" }} />
              <YAxis />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                formatter={(value) => value.toLocaleString("fr-FR")}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_visits"
                stroke="hsl(22 89% 55%)"
                name="Visites totales"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="unique_visitors"
                stroke="hsl(240 84% 60%)"
                name="Visiteurs uniques"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
