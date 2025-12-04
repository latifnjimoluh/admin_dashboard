"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Filter, Eye, Download, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

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
    payeur_email: string
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
  const [showTicketPreview, setShowTicketPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadingTicket, setDownloadingTicket] = useState(false)
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false)
  const [previewMode, setPreviewMode] = useState<'iframe' | 'loading'>('loading')
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)

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

  /**
   * Charge le PDF pour la prévisualisation avec blob URL
   */
  const loadPdfForPreview = async (ticketId: string) => {
    setPreviewMode('loading')
    
    try {
      console.log("[Preview] Chargement du PDF pour prévisualisation - ID:", ticketId)
      
      // Télécharger le PDF avec authentification via headers
      const { blob } = await api.getBlob(`/tickets/${ticketId}/preview`)
      
      console.log("[Preview] Blob reçu, taille:", blob.size)
      
      // Créer une URL blob locale (pas de problème d'auth avec iframe)
      const blobUrl = window.URL.createObjectURL(blob)
      
      setPdfBlobUrl(blobUrl)
      setPreviewMode('iframe')
      
      console.log("[Preview] PDF chargé avec succès")
    } catch (error: any) {
      console.error("[Preview] Erreur:", error)
      setError("Erreur lors du chargement du ticket. Veuillez réessayer.")
      setShowTicketPreview(false)
    }
  }

  /**
   * Ouvre la modal de prévisualisation et charge le ticket
   */
  const handleViewTicket = async (ticket: Ticket) => {
    setShowTicketPreview(true)
    setLoadingTicketDetails(true)
    
    // Si les infos de réservation sont manquantes, les récupérer
    if (!ticket.reservation || !ticket.reservation.payeur_name) {
      try {
        console.log("[ViewTicket] Récupération des détails du ticket:", ticket.ticket_number)
        const response = await api.scan.decode(ticket.ticket_number)
        
        if (response.status === 200 && response.data?.ticket?.reservation) {
          console.log("[ViewTicket] Détails récupérés:", response.data.reservation)
          const enrichedTicket = {
            ...ticket,
            reservation: {
              id: response.data.reservation.id,
              payeur_name: response.data.reservation.payeur_name,
              payeur_phone: response.data.reservation.payeur_phone,
              payeur_email: response.data.reservation.payeur_email,
              pack_name_snapshot: response.data.reservation.pack_name_snapshot,
            }
          }
          setSelectedTicket(enrichedTicket)
        } else {
          console.log("[ViewTicket] Pas de données supplémentaires disponibles")
          setSelectedTicket(ticket)
        }
      } catch (err) {
        console.error("[ViewTicket] Erreur lors de la récupération des détails:", err)
        setSelectedTicket(ticket)
      }
    } else {
      setSelectedTicket(ticket)
    }
    
    setLoadingTicketDetails(false)

    // Charger le PDF pour prévisualisation
    if (ticket.id && ticket.pdf_url) {
      await loadPdfForPreview(ticket.id)
    }
  }

  /**
   * Télécharge le ticket depuis la modal de prévisualisation
   */
  const handleDownloadFromPreview = async () => {
    if (!selectedTicket) return
    await handleDownloadTicket(selectedTicket)
  }

  /**
   * Télécharge le ticket
   */
  const handleDownloadTicket = async (ticket: Ticket) => {
    if (!ticket.id) {
      console.error("ID du ticket manquant")
      return
    }

    setDownloadingTicket(true)

    try {
      console.log("[Download] Début du téléchargement du ticket:", ticket.id)

      const { blob, filename } = await api.getBlob(`/tickets/${ticket.id}/download`)

      console.log("[Download] Blob reçu, taille:", blob.size)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename || `ticket-${ticket.ticket_number}.pdf`
      link.style.display = "none"

      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        console.log("[Download] Téléchargement terminé")
      }, 100)
    } catch (err: any) {
      console.error("[Download] Erreur:", err)

      const isIDMInterception =
        err.message?.includes("Failed to fetch") || err.message?.includes("ERR_FAILED")

      if (!isIDMInterception) {
        setError(err.message || "Erreur lors du téléchargement du ticket")
      } else {
        console.log("[Download] Téléchargement intercepté par le gestionnaire de téléchargements")
      }
    } finally {
      setDownloadingTicket(false)
    }
  }

  /**
   * Ferme la modal de prévisualisation et nettoie les ressources
   */
  const handleClosePreview = () => {
    // Nettoyer la blob URL pour libérer la mémoire
    if (pdfBlobUrl && pdfBlobUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(pdfBlobUrl)
      console.log("[Preview] Blob URL libérée")
    }
    
    setPdfBlobUrl(null)
    setShowTicketPreview(false)
    setPreviewMode('loading')
    setSelectedTicket(null)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets valides</p>
            <p className="text-3xl font-bold text-green-700">{tickets.filter((t) => t.status === "valid").length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-muted-foreground text-sm mb-2">Tickets utilisés</p>
            <p className="text-3xl font-bold text-blue-700">{tickets.filter((t) => t.status === "used").length}</p>
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
                                  disabled={downloadingTicket}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Preview Ticket - Modal avec PDF */}
      <Dialog open={showTicketPreview} onOpenChange={handleClosePreview}>
        <DialogContent className="bg-card border rounded-lg max-w-5xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Aperçu du ticket</DialogTitle>
                {selectedTicket && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Ticket N° <span className="font-mono font-semibold text-foreground">{selectedTicket.ticket_number}</span>
                    </p>
                    {!loadingTicketDetails && selectedTicket.reservation && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Payeur: <span className="text-foreground font-medium">{selectedTicket.reservation.payeur_name}</span></span>
                        <span>Pack: <span className="text-foreground font-medium">{selectedTicket.reservation.pack_name_snapshot}</span></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleDownloadFromPreview}
                disabled={downloadingTicket || loadingTicketDetails}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingTicket ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Télécharger
                  </>
                )}
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-6 pt-4">
            {loadingTicketDetails || previewMode === 'loading' ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Chargement du ticket...</p>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full border rounded-lg shadow-sm"
                title="Aperçu du ticket PDF"
                style={{ minHeight: '600px' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <FileText className="w-16 h-16 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Impossible de charger l'aperçu du ticket
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>Prévisualisation PDF</span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleClosePreview} 
                variant="outline"
              >
                Fermer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}