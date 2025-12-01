"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/admin/stat-card"
import { Users, CreditCard, AlertCircle, Ticket, Check } from "lucide-react"

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
  const [stats, setStats] = useState(
    mockStats.map((s) => ({ ...s, displayValue: 0 }))
  )

  useEffect(() => {
    const duration = 1400
    const start = Date.now()

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - start) / duration, 1)

      setStats(
        mockStats.map((stat) => ({
          ...stat,
          displayValue: Math.floor(stat.value * progress),
        }))
      )

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} stat={stat} delay={index * 100} />
      ))}
    </div>
  )
}
