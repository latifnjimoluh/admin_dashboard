"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/admin/stat-card"
import { Users, CreditCard, AlertCircle, Ticket, Check } from "lucide-react"
import { api } from "@/lib/api"

const mockStats = [
  {
    title: "Total Réservations",
    icon: Users,
    value: 142,
    // Pastel Blue
    gradient: "from-[#e3e9ff] to-[#d6dfff]",
    textColor: "text-[#3b4d8c]",
    iconColor: "text-[#5a6fb8]",
  },
  {
    title: "Total Encaissé",
    icon: CreditCard,
    value: 1240000,
    format: (val: number) => `${val.toLocaleString("fr-FR")} XAF`,
    // Pastel Green
    gradient: "from-[#e5f6ea] to-[#d9eedf]",
    textColor: "text-[#3b7a4e]",
    iconColor: "text-[#58a879]",
  },
  {
    title: "Paiements partiels",
    icon: AlertCircle,
    value: 58,
    // Pastel Yellow
    gradient: "from-[#f9f2d9] to-[#f3e8c3]",
    textColor: "text-[#8a6d1f]",
    iconColor: "text-[#d6b444]",
  },
  {
    title: "Tickets générés",
    icon: Ticket,
    value: 84,
    // Pastel Purple
    gradient: "from-[#f1e4fb] to-[#e9d7f7]",
    textColor: "text-[#7b4ca0]",
    iconColor: "text-[#b07cd5]",
  },
  {
    title: "Entrées validées",
    icon: Check,
    value: 56,
    // Pastel Red
    gradient: "from-[#fde4e4] to-[#f7d3d3]",
    textColor: "text-[#9b3a3a]",
    iconColor: "text-[#d66a6a]",
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

        // Fetch reservations, tickets and payments (use large pageSize to approximate totals)
        const [resRes, resTickets, resPayments, resPacks] = await Promise.all([
          api.reservations.getAll("?page=1&pageSize=1000"),
          api.tickets.getAll(),
          api.payments.getAll(),
          api.packs.getAll("?is_active=true&page=1&pageSize=1000"),
        ])

        const reservationsRaw = resRes.data?.reservations || resRes.data || []
        const ticketsRaw = resTickets.data?.tickets || resTickets.data || []
        const paymentsRaw = resPayments.data?.payments || resPayments.data || []
        const packsRaw = resPacks.data?.packs || resPacks.data || []

        const totalReservations = Array.isArray(reservationsRaw) ? reservationsRaw.length : 0
        const totalTickets = Array.isArray(ticketsRaw) ? ticketsRaw.length : 0
        const totalPacks = Array.isArray(packsRaw) ? packsRaw.length : 0

        const totalPaid = Array.isArray(reservationsRaw)
          ? reservationsRaw.reduce((acc: number, r: any) => acc + (r.total_paid || 0), 0)
          : 0

        const partialPayments = Array.isArray(reservationsRaw)
          ? reservationsRaw.filter((r: any) => (r.total_paid || 0) < (r.total_price || 0)).length
          : 0

        // Build updated stats based on mockStats order
        const updatedStats = [
          { ...mockStats[0], value: totalReservations },
          { ...mockStats[1], value: totalPaid },
          { ...mockStats[2], value: partialPayments },
          { ...mockStats[3], value: totalTickets },
          { ...mockStats[4], value: 0 }, // Entrées validées not available from summary
        ]

        if (!mounted) return

        // Animate from 0 -> value similar to previous implementation
        const duration = 800
        const start = Date.now()

        const animate = () => {
          const now = Date.now()
          const progress = Math.min((now - start) / duration, 1)

          setStats(
            updatedStats.map((stat) => ({
              ...stat,
              displayValue: Math.floor((stat.value as number) * progress),
            }))
          )

          if (progress < 1) requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
      } catch (err: any) {
        console.error("Failed to load stats:", err)
        if (mounted) setError("Impossible de charger les statistiques")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadStats()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} stat={stat} delay={index * 100} />
      ))}
    </div>
  )
}
