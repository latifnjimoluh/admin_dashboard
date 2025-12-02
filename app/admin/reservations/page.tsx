"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Filter, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"

interface ReservationRow {
  id: string
  nom: string
  telephone: string
  pack: string
  quantity: number
  statut: string
  prixTotal: number
  totalPayé: number
  dateReservation: string
}

export default function ReservationsPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [filteredReservations, setFilteredReservations] = useState<ReservationRow[]>([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("tous")

  // =============================
  //     1. FETCH RESERVATIONS
  // =============================
  const loadReservations = async () => {
    try {
      const res = await api.reservations.getAll()
      const raw = res.data?.reservations || res.data || []

      const mapped: ReservationRow[] = raw.map((r: any) => ({
        id: r.id,
        nom: r.payeur_name,
        telephone: r.payeur_phone,
        pack: r.pack?.name || r.pack_name_snapshot || "Pack inconnu",
        quantity: r.quantity || 1,
        statut: mapBackendStatus(r.status),
        prixTotal: r.total_price,
        totalPayé: r.total_paid || 0,
        dateReservation: new Date(r.createdAt).toLocaleDateString("fr-FR"),
      }))

      setReservations(mapped)
      setFilteredReservations(mapped)
    } catch (err) {
      console.error("Erreur API réservations", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [])

  // =============================
  //     2. FILTRAGE
  // =============================
  useEffect(() => {
    let result = [...reservations]

    if (search) {
      result = result.filter(
        (r) =>
          r.nom.toLowerCase().includes(search.toLowerCase()) ||
          r.telephone.includes(search)
      )
    }

    if (statusFilter !== "tous") {
      result = result.filter((r) => r.statut === statusFilter)
    }

    setFilteredReservations(result)
  }, [search, statusFilter, reservations])

  // =============================
  //     3. MAPPING STATUT
  // =============================
  const mapBackendStatus = (status: string) => {
    switch (status) {
      case "pending":
        return "en_attente"
      case "partial":
        return "partiel"
      case "paid":
        return "payé"
      case "ticket_generated":
        return "ticket_généré"
      default:
        return "en_attente"
    }
  }

  const getStatutBadge = (statut: string) => {
    const variants: any = {
      en_attente: "badge-en-attente",
      partiel: "badge-partiel",
      payé: "badge-paye",
      ticket_généré: "badge-ticket-genere",
    }
    const labels: any = {
      en_attente: "En attente",
      partiel: "Partiel",
      payé: "Payé",
      ticket_généré: "Ticket généré",
    }
    return { className: variants[statut] || "badge-en-attente", label: labels[statut] || statut }
  }

  const montantRestant = (r: ReservationRow) => r.prixTotal - r.totalPayé

  if (isLoading)
    return (
      <AdminLayout>
        <div className="p-6 text-center text-muted-foreground">Chargement des réservations...</div>
      </AdminLayout>
    )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Réservations</h1>
          <p className="text-muted-foreground">
            Total: {filteredReservations.length} réservation(s)
          </p>
        </div>

        {/* Search + Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none"
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
                <tr className="bg-secondary/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nom</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Téléphone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Pack</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Qté</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Payé</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Restant</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((r) => {
                  const badge = getStatutBadge(r.statut)
                  return (
                    <tr key={r.id} className="hover:bg-secondary/50 transition-colors border-t border-border">
                      <td className="px-6 py-3 text-sm font-medium">{r.nom}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{r.telephone}</td>
                      <td className="px-6 py-3 text-sm">{r.pack}</td>
                      <td className="px-6 py-3 text-center text-sm">
                        <span className="px-2 py-1 bg-secondary rounded-md font-medium">{r.quantity}</span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-medium">
                        {r.prixTotal.toLocaleString()} XAF
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-green-600 font-medium">
                        {r.totalPayé.toLocaleString()} XAF
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-orange-600 font-medium">
                        {montantRestant(r).toLocaleString()} XAF
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => router.push(`/admin/reservation/${r.id}`)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                        >
                          Ouvrir
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {filteredReservations.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Aucune réservation trouvée
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}