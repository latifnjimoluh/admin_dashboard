"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Filter, ChevronRight } from "lucide-react"

interface Reservation {
  id: string
  nom: string
  telephone: string
  pack: string
  statut: "en_attente" | "partiel" | "payé" | "ticket_généré"
  prixTotal: number
  totalPayé: number
  dateReservation: string
}

const mockReservations: Reservation[] = [
  {
    id: "1",
    nom: "Jean Dupont",
    telephone: "237 6 70 123 456",
    pack: "Couple",
    statut: "en_attente",
    prixTotal: 50000,
    totalPayé: 0,
    dateReservation: "2024-11-28",
  },
  {
    id: "2",
    nom: "Marie Simo",
    telephone: "237 6 75 789 012",
    pack: "Famille",
    statut: "partiel",
    prixTotal: 120000,
    totalPayé: 60000,
    dateReservation: "2024-11-27",
  },
  {
    id: "3",
    nom: "Pierre Ndong",
    telephone: "237 6 80 345 678",
    pack: "VIP",
    statut: "payé",
    prixTotal: 80000,
    totalPayé: 80000,
    dateReservation: "2024-11-26",
  },
  {
    id: "4",
    nom: "Sophie Asso",
    telephone: "237 6 85 901 234",
    pack: "Simple",
    statut: "ticket_généré",
    prixTotal: 25000,
    totalPayé: 25000,
    dateReservation: "2024-11-25",
  },
  {
    id: "5",
    nom: "André Fouda",
    telephone: "237 6 90 567 890",
    pack: "Couple",
    statut: "partiel",
    prixTotal: 50000,
    totalPayé: 30000,
    dateReservation: "2024-11-24",
  },
]

export default function ReservationsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("tous")
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    let result = mockReservations

    if (search) {
      result = result.filter((r) => r.nom.toLowerCase().includes(search.toLowerCase()) || r.telephone.includes(search))
    }

    if (statusFilter !== "tous") {
      result = result.filter((r) => r.statut === statusFilter)
    }

    setFilteredReservations(result)
  }, [search, statusFilter])

  if (isLoading || !isAuthenticated) return null

  const getStatutBadge = (statut: Reservation["statut"]) => {
    const variants = {
      en_attente: "badge-en-attente",
      partiel: "badge-partiel",
      payé: "badge-paye",
      ticket_généré: "badge-ticket-genere",
    }
    const labels = {
      en_attente: "En attente",
      partiel: "Partiel",
      payé: "Payé",
      ticket_généré: "Ticket généré",
    }
    return { className: variants[statut], label: labels[statut] }
  }

  const montantRestant = (reservation: Reservation) => reservation.prixTotal - reservation.totalPayé

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Réservations</h1>
          <p className="text-muted-foreground">Total: {filteredReservations.length} réservation(s)</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors text-sm md:text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors text-sm md:text-base appearance-none"
            >
              <option value="tous">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="partiel">Partiel</option>
              <option value="payé">Payé</option>
              <option value="ticket_généré">Ticket généré</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Nom
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Téléphone
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Pack
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Statut
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                    Total
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                    Payé
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-sm font-semibold text-foreground whitespace-nowrap">
                    Restant
                  </th>
                  <th className="px-4 md:px-6 py-3 text-center text-sm font-semibold text-foreground whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => {
                  const badge = getStatutBadge(reservation.statut)
                  return (
                    <tr key={reservation.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm text-foreground whitespace-nowrap">{reservation.nom}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {reservation.telephone}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-foreground whitespace-nowrap">
                        {reservation.pack}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap">
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-right text-foreground whitespace-nowrap font-medium">
                        {reservation.prixTotal.toLocaleString()} XAF
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-right text-green-700 whitespace-nowrap font-medium">
                        {reservation.totalPayé.toLocaleString()} XAF
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-right text-orange-700 whitespace-nowrap font-medium">
                        {montantRestant(reservation).toLocaleString()} XAF
                      </td>
                      <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/admin/reservation/${reservation.id}`)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                        >
                          <span className="hidden sm:inline">Ouvrir</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredReservations.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Aucune réservation trouvée</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
