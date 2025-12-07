"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/admin/stat-card"
import { StatsGridSkeleton } from "@/components/admin/stats-grid-skeleton"
import { Users, CreditCard, AlertCircle, Ticket, Check, Eye, BarChart3 } from "lucide-react"
import { api } from "@/lib/api"
import { cacheManager } from "@/lib/cache"

const mockStats = [
  {
    title: "Total Réservations",
    icon: Users,
    value: 142,
    gradient: "from-[#e3e9ff] to-[#d6dfff]",
    textColor: "text-[#3b4d8c]",
    iconColor: "text-[#5a6fb8]",
  },
  {
    title: "Total Encaissé",
    icon: CreditCard,
    value: 1240000,
    format: (val: number) => `${val.toLocaleString("fr-FR")} XAF`,
    gradient: "from-[#e5f6ea] to-[#d9eedf]",
    textColor: "text-[#3b7a4e]",
    iconColor: "text-[#58a879]",
  },
  {
    title: "Paiements partiels",
    icon: AlertCircle,
    value: 58,
    gradient: "from-[#f9f2d9] to-[#f3e8c3]",
    textColor: "text-[#8a6d1f]",
    iconColor: "text-[#d6b444]",
  },
  {
    title: "Tickets générés",
    icon: Ticket,
    value: 84,
    gradient: "from-[#f1e4fb] to-[#e9d7f7]",
    textColor: "text-[#7b4ca0]",
    iconColor: "text-[#b07cd5]",
  },
  {
    title: "Entrées validées",
    icon: Check,
    value: 56,
    gradient: "from-[#fde4e4] to-[#f7d3d3]",
    textColor: "text-[#9b3a3a]",
    iconColor: "text-[#d66a6a]",
  },
  {
    title: "Total des visites",
    icon: Eye,
    value: 0,
    gradient: "from-[#e8f5e9] to-[#c8e6c9]",
    textColor: "text-[#2e7d32]",
    iconColor: "text-[#558b2f]",
  },
  {
    title: "Visiteurs uniques",
    icon: Users,
    value: 0,
    gradient: "from-[#f3e5f5] to-[#e1bee7]",
    textColor: "text-[#6a1b9a]",
    iconColor: "text-[#8e24aa]",
  },
  {
    title: "Moyenne par visiteur",
    icon: BarChart3,
    value: 0,
    format: (val: number) => val.toFixed(2),
    gradient: "from-[#fff3e0] to-[#ffe0b2]",
    textColor: "text-[#e65100]",
    iconColor: "text-[#ff6f00]",
  },
]

export function StatsGrid() {
  const [stats, setStats] = useState(mockStats.map((s) => ({ ...s, displayValue: 0 })))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const cachedStats = cacheManager.get("dashboard_stats")
        if (cachedStats && mounted) {
          setStats(
            cachedStats.map((stat: any, index: number) => ({
              ...stat,
              icon: mockStats[index].icon,
              displayValue: stat.displayValue || stat.value,
            })),
          )
          setLoading(false)
          // Still fetch fresh data in background for next refresh
          loadFreshStats()
          return
        }

        await loadFreshStats()
      } catch (err: any) {
        console.error("Failed to load stats:", err)
        if (mounted) setError("Impossible de charger les statistiques")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const loadFreshStats = async () => {
      try {
        const [resRes, resTickets, resPayments, resPacks, resScanStats, resTrackingStats] = await Promise.all([
          api.reservations.getAll("?page=1&pageSize=1000"),
          api.tickets.getAll(),
          api.payments.getAll(),
          api.packs.getAll("?is_active=true&page=1&pageSize=1000"),
          api.scan.stats(),
          api.tracking.stats(),
        ])

        const reservationsRaw = resRes.data?.reservations || resRes.data || []
        const ticketsRaw = resTickets.data?.tickets || resTickets.data || []
        const paymentsRaw = resPayments.data?.payments || resPayments.data || []
        const packsRaw = resPacks.data?.packs || resPacks.data || []
        const scanStatsData = resScanStats.data || {}
        const trackingStatsData = resTrackingStats.data || {}

        const totalReservations = Array.isArray(reservationsRaw) ? reservationsRaw.length : 0
        const totalTickets = Array.isArray(ticketsRaw) ? ticketsRaw.length : 0
        const totalPacks = Array.isArray(packsRaw) ? packsRaw.length : 0

        const totalPaid = Array.isArray(reservationsRaw)
          ? reservationsRaw.reduce((acc: number, r: any) => acc + (r.total_paid || 0), 0)
          : 0

        const partialPayments = Array.isArray(reservationsRaw)
          ? reservationsRaw.filter((r: any) => {
              const totalPrice = r.total_price || 0
              const totalPaidAmount = r.total_paid || 0
              return totalPaidAmount > 0 && totalPaidAmount < totalPrice
            }).length
          : 0

        const validatedEntries = scanStatsData.validated_entries || 0

        const totalVisits = trackingStatsData.total_visits || 0
        const uniqueVisitors = trackingStatsData.unique_visitors || 0
        const averageVisitsPerUser = trackingStatsData.average_visits_per_user || 0

        // Build updated stats based on mockStats order
        const updatedStats = [
          { ...mockStats[0], value: totalReservations },
          { ...mockStats[1], value: totalPaid },
          { ...mockStats[2], value: partialPayments },
          { ...mockStats[3], value: totalTickets },
          { ...mockStats[4], value: validatedEntries },
          { ...mockStats[5], value: totalVisits },
          { ...mockStats[6], value: uniqueVisitors },
          { ...mockStats[7], value: averageVisitsPerUser },
        ]

        cacheManager.set("dashboard_stats", updatedStats, { expiryTime: 5 * 60 * 1000 })

        if (!mounted) return

        // Animate from 0 -> value
        const duration = 800
        const start = Date.now()

        const animate = () => {
          const now = Date.now()
          const progress = Math.min((now - start) / duration, 1)

          setStats(
            updatedStats.map((stat) => ({
              ...stat,
              displayValue: Math.floor((stat.value as number) * progress),
            })),
          )

          if (progress < 1) requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
      } catch (err: any) {
        console.error("Failed to load fresh stats:", err)
        if (mounted) setError("Impossible de charger les statistiques")
      }
    }

    loadStats()

    return () => {
      mounted = false
    }
  }, [])

  if (loading && stats.every((s) => s.displayValue === 0)) {
    return <StatsGridSkeleton />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} stat={stat} delay={index * 100} />
      ))}
    </div>
  )
}
