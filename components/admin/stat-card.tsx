"use client"

import Users from "lucide-react/dist/esm/icons/users"
import Ticket from "lucide-react/dist/esm/icons/ticket"
import CreditCard from "lucide-react/dist/esm/icons/credit-card"
import type { LucideIcon } from "lucide-react"


interface StatCardProps {
  stat: {
    title: string
    icon: LucideIcon
    displayValue: number
    value: number
    gradient: string
    textColor: string
    iconColor: string
    format?: (val: number) => string
  }
  delay: number
}

/* ============================
   STATS CONFIG
===============================*/
export const stats = [
  {
    title: "Utilisateurs",
    icon: Users,
    displayValue: 100,
    value: 150,
    gradient: "from-purple-500 to-indigo-500",
    textColor: "text-white",
    iconColor: "text-white",
  },
  {
    title: "Tickets générés",
    icon: Ticket,
    displayValue: 50,
    value: 100,
    gradient: "from-pink-500 to-rose-500",
    textColor: "text-white",
    iconColor: "text-white",
  },
  {
    title: "Paiements",
    icon: CreditCard,
    displayValue: 80,
    value: 120,
    gradient: "from-emerald-500 to-green-600",
    textColor: "text-white",
    iconColor: "text-white",
  }
]

/* ============================
   STAT CARD COMPONENT
===============================*/
export function StatCard({ stat, delay }: StatCardProps) {
  const Icon = stat.icon
  const formattedValue = stat.format ? stat.format(stat.displayValue) : stat.displayValue

  const progressPercent = stat.value > 0
    ? (stat.displayValue / stat.value) * 100
    : 0

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4"
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: "600ms",
      }}
    >
      <div
        className={`
          bg-gradient-to-br ${stat.gradient}
          rounded-xl p-6 border border-white/60 shadow-sm
          transition-all duration-300
          hover:shadow-md hover:scale-[1.015]
        `}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`${stat.textColor} text-sm font-medium mb-1`}>
              {stat.title}
            </p>

            <p className={`${stat.textColor} text-3xl font-bold`}>
              {formattedValue}
            </p>
          </div>

          <div className={`${stat.iconColor}`}>
            <Icon className="w-8 h-8 opacity-90" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden">
          <div
            className={`h-full ${stat.iconColor} rounded-full transition-all duration-700`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
