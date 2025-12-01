"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Filter, Eye, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Ticket {
  id: string
  nomPayeur: string
  pack: string
  statut: "valide" | "utilisé" | "annulé"
  dateGeneration: string
  nomParticipant?: string
}

const mockTickets: Ticket[] = [
  {
    id: "TICKET-001",
    nomPayeur: "Jean Dupont",
    nomParticipant: "Jean Dupont",
    pack: "Couple",
    statut: "valide",
    dateGeneration: "2024-11-27",
  },
  {
    id: "TICKET-002",
    nomPayeur: "Jean Dupont",
    nomParticipant: "Marie Dupont",
    pack: "Couple",
    statut: "valide",
    dateGeneration: "2024-11-27",
  },
  {
    id: "TICKET-003",
    nomPayeur: "Pierre Ndong",
    nomParticipant: "Pierre Ndong",
    pack: "VIP",
    statut: "utilisé",
    dateGeneration: "2024-11-25",
  },
  {
    id: "TICKET-004",
    nomPayeur: "Sophie Asso",
    nomParticipant: "Sophie Asso",
    pack: "Simple",
    statut: "valide",
    dateGeneration: "2024-11-24",
  },
  {
    id: "TICKET-005",
    nomPayeur: "Marie Simo",
    nomParticipant: "Marie Simo",
    pack: "Famille",
    statut: "utilisé",
    dateGeneration: "2024-11-23",
  },
  {
    id: "TICKET-006",
    nomPayeur: "Marie Simo",
    nomParticipant: "Enfant 1 Simo",
    pack: "Famille",
    statut: "valide",
    dateGeneration: "2024-11-23",
  },
  {
    id: "TICKET-007",
    nomPayeur: "André Fouda",
    nomParticipant: "André Fouda",
    pack: "Couple",
    statut: "annulé",
    dateGeneration: "2024-11-22",
  },
]

export default function TicketsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("tous")
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

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
    let result = mockTickets

    if (search) {
      result = result.filter(
        (t) =>
          t.nomPayeur.toLowerCase().includes(search.toLowerCase()) ||
          t.id.includes(search.toUpperCase()) ||
          (t.nomParticipant && t.nomParticipant.toLowerCase().includes(search.toLowerCase())),
      )
    }

    if (statusFilter !== "tous") {
      result = result.filter((t) => t.statut === statusFilter)
    }

    setFilteredTickets(result)
  }, [search, statusFilter])

  if (isLoading || !isAuthenticated) return null

  const getStatusBadge = (statut: Ticket["statut"]) => {
    const variants = {
      valide: "bg-green-100 text-green-900",
      utilisé: "bg-blue-100 text-blue-900",
      annulé: "bg-red-100 text-red-900",
    }
    const labels = {
      valide: "Valide",
      utilisé: "Utilisé",
      annulé: "Annulé",
    }
    return { className: variants[statut], label: labels[statut] }
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowQRModal(true)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Tickets</h1>
          <p className="text-muted-foreground">Total: {filteredTickets.length} ticket(s)</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom, participant ou numéro..."
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
              <option value="valide">Valide</option>
              <option value="utilisé">Utilisé</option>
              <option value="annulé">Annulé</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets valides</p>
            <p className="text-3xl font-bold text-green-700">
              {filteredTickets.filter((t) => t.statut === "valide").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets utilisés</p>
            <p className="text-3xl font-bold text-blue-700">
              {filteredTickets.filter((t) => t.statut === "utilisé").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets annulés</p>
            <p className="text-3xl font-bold text-red-700">
              {filteredTickets.filter((t) => t.statut === "annulé").length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    N° Ticket
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Payeur
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Participant
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Pack
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Statut
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                    Généré le
                  </th>
                  <th className="px-4 md:px-6 py-3 text-center text-sm font-semibold text-foreground whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.statut)
                  return (
                    <tr key={ticket.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono text-primary font-bold whitespace-nowrap">
                        {ticket.id}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-foreground whitespace-nowrap">
                        {ticket.nomPayeur}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {ticket.nomParticipant || "-"}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-foreground whitespace-nowrap">{ticket.pack}</td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap">
                        <span className={`badge ${statusBadge.className}`}>{statusBadge.label}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {ticket.dateGeneration}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                        >
                          <span className="hidden sm:inline">Voir</span>
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredTickets.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Aucun ticket trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedTicket && (
        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogContent className="bg-card border border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Détails du ticket</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="w-56 h-56 bg-white p-4 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="30" height="30" fill="black" />
                    <rect x="60" y="10" width="30" height="30" fill="black" />
                    <rect x="10" y="60" width="30" height="30" fill="black" />
                    <rect x="20" y="20" width="10" height="10" fill="white" />
                    <rect x="70" y="20" width="10" height="10" fill="white" />
                    <rect x="20" y="70" width="10" height="10" fill="white" />
                    <rect x="40" y="40" width="20" height="20" fill="black" />
                    <text x="50" y="95" textAnchor="middle" fontSize="6" fill="black">
                      {selectedTicket.id}
                    </text>
                  </svg>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">N° Ticket:</span>
                  <span className="text-foreground font-mono font-semibold">{selectedTicket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payeur:</span>
                  <span className="text-foreground font-medium">{selectedTicket.nomPayeur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participant:</span>
                  <span className="text-foreground font-medium">{selectedTicket.nomParticipant || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pack:</span>
                  <span className="text-foreground font-medium">{selectedTicket.pack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut:</span>
                  <span className={`badge ${getStatusBadge(selectedTicket.statut).className}`}>
                    {getStatusBadge(selectedTicket.statut).label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Généré le:</span>
                  <span className="text-foreground">{selectedTicket.dateGeneration}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
                onClick={() => setShowQRModal(false)}
              >
                Fermer
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm">
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  )
}
