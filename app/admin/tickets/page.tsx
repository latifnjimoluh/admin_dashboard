"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Filter, Eye, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import "@/lib/mobile-download" // Ensure the library is imported

interface Ticket {
  id: string
  ticket_number: string
  status: "valid" | "used" | "cancelled"
  generated_at: string
  created_at: string
  qr_data_url?: string
  qr_image_url?: string
  pdf_url?: string
  reservation?: {
    id: string
    payeur_name: string
    payeur_phone: string
    pack_name_snapshot: string
  }
}

interface PaginationData {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function TicketsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  useEffect(() => {
    if (isAuthenticated) {
      loadTickets()
    }
  }, [isAuthenticated, currentPage, statusFilter])

  const loadTickets = async () => {
    try {
      setError(null)
      setIsLoading(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(search && { q: search }),
      })

      const response = await api.get(`/tickets?${params}`)

      if (response.status === 200) {
        setTickets(response.data?.tickets || [])
        setPagination(
          response.data?.pagination || {
            total: 0,
            page: currentPage,
            pageSize: 20,
            totalPages: 0,
          },
        )
      } else {
        setError("Erreur lors du chargement des tickets")
      }
    } catch (err: any) {
      console.error("Error loading tickets:", err)
      setError(err.message || "Erreur lors du chargement des tickets")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadTickets()
  }

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setCurrentPage(1)
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowQRModal(true)
  }

  const handleDownloadTicket = async (ticket: Ticket) => {
    console.log("[v0] handleDownloadTicket START - ticket id:", ticket.id)

    if (!ticket.id) {
      console.error("[v0] handleDownloadTicket - no ticket id")
      return
    }

    try {
      console.log("[v0] handleDownloadTicket - calling api.tickets.downloadPDF")
      const { blob, filename } = await api.tickets.downloadPDF(ticket.id)

      console.log("[v0] handleDownloadTicket - received blob:", {
        size: blob.size,
        type: blob.type,
        filename: filename,
      })

      console.log("[v0] handleDownloadTicket - importing downloadUtils")
      const { downloadUtils } = await import("@/lib/mobile-download")

      console.log("[v0] handleDownloadTicket - calling smartDownload")
      await downloadUtils.smartDownload(blob, filename || `ticket-${ticket.ticket_number}.pdf`, "pdf")

      console.log("[v0] handleDownloadTicket - SUCCESS")
    } catch (err: any) {
      console.error("[v0] handleDownloadTicket - ERROR:", {
        message: err?.message,
        status: err?.status,
        stack: err?.stack,
        fullError: err,
      })
      setError(err.message || "Erreur lors du téléchargement du ticket")
    }
  }

  const handleRegenerate = async () => {
    if (!selectedTicket) return

    try {
      setIsRegenerating(true)
      const response = await api.post(`/tickets/${selectedTicket.id}/regenerate`)

      if (response.status === 200) {
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                qr_data_url: response.data.qr_data_url,
                pdf_url: response.data.pdf_url,
              }
            : null,
        )
        await loadTickets()
      } else {
        setError(response.message || "Erreur lors de la régénération du ticket")
      }
    } catch (err: any) {
      console.error("Error regenerating ticket:", err)
      setError(err.message || "Erreur lors de la régénération du ticket")
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Redirection...</p>
        </div>
      </AdminLayout>
    )
  }

  const getStatusBadge = (status: Ticket["status"]) => {
    const variants = {
      valid: "bg-green-100 text-green-900",
      used: "bg-blue-100 text-blue-900",
      cancelled: "bg-red-100 text-red-900",
    }
    const labels = {
      valid: "Valide",
      used: "Utilisé",
      cancelled: "Annulé",
    }
    return { className: variants[status], label: labels[status] }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Tickets</h1>
          <p className="text-muted-foreground">Total: {pagination.total} ticket(s)</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Search and Filter Bar */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par nom ou numéro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors text-sm md:text-base"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors text-sm md:text-base appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="valid">Valide</option>
                <option value="used">Utilisé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium whitespace-nowrap"
            >
              Rechercher
            </button>
          </div>
        </form>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets valides</p>
            <p className="text-3xl font-bold text-green-700">{tickets.filter((t) => t.status === "valid").length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets utilisés</p>
            <p className="text-3xl font-bold text-blue-700">{tickets.filter((t) => t.status === "used").length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets annulés</p>
            <p className="text-3xl font-bold text-red-700">{tickets.filter((t) => t.status === "cancelled").length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                        N° Ticket
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-sm font-semibold text-foreground whitespace-nowrap">
                        Payeur
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
                    {tickets.map((ticket) => {
                      const statusBadge = getStatusBadge(ticket.status)
                      return (
                        <tr key={ticket.id} className="hover:bg-secondary/50 transition-colors border-t border-border">
                          <td className="px-4 md:px-6 py-3 text-sm font-mono text-primary font-bold whitespace-nowrap">
                            {ticket.ticket_number}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm text-foreground whitespace-nowrap">
                            {ticket.reservation?.payeur_name || "—"}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm text-foreground whitespace-nowrap">
                            {ticket.reservation?.pack_name_snapshot || "—"}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap">
                            <span className={`badge px-2 py-1 rounded text-xs font-medium ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(ticket.generated_at).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 md:px-6 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewTicket(ticket)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-xs font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">Voir</span>
                              </button>
                              {ticket.pdf_url && (
                                <button
                                  onClick={() => handleDownloadTicket(ticket)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors text-xs font-medium"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="hidden sm:inline">PDF</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {tickets.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">Aucun ticket trouvé</p>
                  </div>
                )}
              </>
            )}
          </div>

          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-border bg-secondary/20">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} tickets)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </button>
                <button
                  onClick={() => {
                    if (currentPage < pagination.totalPages) setCurrentPage(currentPage + 1)
                  }}
                  disabled={currentPage === pagination.totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedTicket && (
        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogContent className="bg-card border border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Détails du ticket</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {selectedTicket.qr_data_url && (
                <div className="flex flex-col items-center">
                  <div className="w-56 h-56 bg-white p-4 rounded-lg flex items-center justify-center border border-gray-200">
                    <img
                      src={selectedTicket.qr_data_url || "/placeholder.svg"}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">N° Ticket</p>
                    <p className="text-foreground font-mono font-semibold">{selectedTicket.ticket_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Statut</p>
                    <span
                      className={`badge ${getStatusBadge(selectedTicket.status).className} px-2 py-1 rounded text-xs font-medium inline-block`}
                    >
                      {getStatusBadge(selectedTicket.status).label}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Généré le</p>
                    <p className="text-foreground">
                      {new Date(selectedTicket.generated_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Payeur</p>
                    <p className="text-foreground font-medium">{selectedTicket.reservation?.payeur_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Pack</p>
                    <p className="text-foreground">{selectedTicket.reservation?.pack_name_snapshot || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Téléphone</p>
                    <p className="text-foreground">{selectedTicket.reservation?.payeur_phone || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <button
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
                onClick={() => setShowQRModal(false)}
              >
                Fermer
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegenerating ? "Régénération..." : "Régénérer"}
              </button>
              {selectedTicket.pdf_url && (
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
                  onClick={() => handleDownloadTicket(selectedTicket)}
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  )
}
