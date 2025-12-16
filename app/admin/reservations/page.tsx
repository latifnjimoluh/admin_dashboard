"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Search, Filter, ChevronRight, Trash2, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [filteredReservations, setFilteredReservations] = useState<ReservationRow[]>([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("tous")
  const [userRole, setUserRole] = useState<string>("")

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    reservationId: string | null
    reservationName: string | null
    isDeleting: boolean
  }>({
    open: false,
    reservationId: null,
    reservationName: null,
    isDeleting: false,
  })

  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState<{
    open: boolean
    reservationId: string | null
    reservationName: string | null
    isDeleting: boolean
  }>({
    open: false,
    reservationId: null,
    reservationName: null,
    isDeleting: false,
  })

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
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem("admin_role") || ""
    setUserRole(role)
    loadReservations()
  }, [])

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
      case "cancelled":
        return "annulée"
      case "payment_cancelled":
        return "paiement_annulé"
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
      annulée: "badge-cancelled",
      paiement_annulé: "badge-payment-cancelled",
    }
    const labels: any = {
      en_attente: "En attente",
      partiel: "Partiel",
      payé: "Payé",
      ticket_généré: "Ticket généré",
      annulée: "Annulée",
      paiement_annulé: "Paiement annulé",
    }
    return { className: variants[statut] || "badge-en-attente", label: labels[statut] || statut }
  }

  const montantRestant = (r: ReservationRow) => r.prixTotal - r.totalPayé

  const openDeleteDialog = (reservation: ReservationRow) => {
    setDeleteDialog({
      open: true,
      reservationId: reservation.id,
      reservationName: reservation.nom,
      isDeleting: false,
    })
  }

  const openPermanentDeleteDialog = (reservation: ReservationRow) => {
    setPermanentDeleteDialog({
      open: true,
      reservationId: reservation.id,
      reservationName: reservation.nom,
      isDeleting: false,
    })
  }

  const handleDeleteReservation = async () => {
    if (!deleteDialog.reservationId) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      await api.reservations.delete(deleteDialog.reservationId)

      setReservations((prev) =>
        prev.map((r) => (r.id === deleteDialog.reservationId ? { ...r, statut: "annulée" } : r)),
      )

      toast({
        title: "Succès",
        description: `La réservation de ${deleteDialog.reservationName} a été annulée`,
      })

      setDeleteDialog({
        open: false,
        reservationId: null,
        reservationName: null,
        isDeleting: false,
      })
    } catch (err: any) {
      console.error("Erreur suppression réservation", err)

      const errorMessage =
        err.message === "Cannot delete reservation after ticket generation"
          ? "Impossible d'annuler une réservation avec un ticket généré"
          : err.message || "Erreur lors de l'annulation de la réservation"

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })

      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const handlePermanentlyDeleteReservation = async () => {
    if (!permanentDeleteDialog.reservationId) return

    setPermanentDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      await api.reservations.permanentlyDelete(permanentDeleteDialog.reservationId)

      setReservations((prev) => prev.filter((r) => r.id !== permanentDeleteDialog.reservationId))

      toast({
        title: "Succès",
        description: `La réservation de ${permanentDeleteDialog.reservationName} a été supprimée définitivement`,
      })

      setPermanentDeleteDialog({
        open: false,
        reservationId: null,
        reservationName: null,
        isDeleting: false,
      })
    } catch (err: any) {
      console.error("Erreur suppression permanente réservation", err)

      let errorMessage = "Erreur lors de la suppression définitive de la réservation"

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      toast({
        title: "Attention",
        description: errorMessage,
        variant: "destructive",
      })

      setPermanentDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  useEffect(() => {
    let result = [...reservations]

    if (search) {
      result = result.filter((r) => r.nom.toLowerCase().includes(search.toLowerCase()) || r.telephone.includes(search))
    }

    if (statusFilter !== "tous") {
      result = result.filter((r) => r.statut === statusFilter)
    }

    setFilteredReservations(result)
  }, [search, statusFilter, reservations])

  if (isLoading)
    return (
      <AdminLayout>
        <div className="p-6 text-center text-muted-foreground">Chargement des réservations...</div>
      </AdminLayout>
    )

  const totalReservations = filteredReservations.length

  const totalMontant = filteredReservations.reduce((sum, r) => sum + r.prixTotal, 0)

  const totalPayé = filteredReservations.reduce((sum, r) => sum + r.totalPayé, 0)

  const totalRestant = totalMontant - totalPayé

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Réservations</h1>
          <p className="text-muted-foreground">Total: {filteredReservations.length} réservation(s)</p>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Total réservations */}
            <div className="bg-card border rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm">Total des réservations</p>
              <p className="text-3xl font-bold">{totalReservations}</p>
            </div>

            {/* Total payé */}
            <div className="bg-card border rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm">Montant total payé</p>
              <p className="text-3xl font-bold text-green-600">{totalPayé.toLocaleString()} XAF</p>
            </div>

            {/* Total restant */}
            <div className="bg-card border rounded-lg p-6 text-center">
              <p className="text-muted-foreground text-sm">Montant restant</p>
              <p className="text-3xl font-bold text-orange-600">{totalRestant.toLocaleString()} XAF</p>
            </div>
          </div>
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
              <option value="annulée">Annulée</option>
              <option value="paiement_annulé">Paiement annulé</option>
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
                  <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
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
                      <td className="px-6 py-3 text-right text-sm font-medium">{r.prixTotal.toLocaleString()} XAF</td>
                      <td className="px-6 py-3 text-right text-sm text-green-600 font-medium">
                        {r.totalPayé.toLocaleString()} XAF
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-orange-600 font-medium">
                        {montantRestant(r).toLocaleString()} XAF
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/reservation/${r.id}`)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                          >
                            Ouvrir
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(r)}
                            disabled={r.statut === "ticket_généré"}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm font-medium"
                            title={
                              r.statut === "ticket_généré"
                                ? "Impossible de supprimer une réservation avec un ticket généré"
                                : "Annuler la réservation"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {userRole === "superadmin" && (
                            <button
                              onClick={() => openPermanentDeleteDialog(r)}
                              disabled={r.statut !== "en_attente" && r.statut !== "annulée" }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-destructive hover:bg-destructive/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm font-medium"
                              title={
                                r.statut !== "en_attente" 
                                  ? "Impossible de supprimer définitivement une réservation qui n'est pas en attente"
                                  : "Supprimer définitivement la réservation"
                              }
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {filteredReservations.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Aucune réservation trouvée</div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={permanentDeleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setPermanentDeleteDialog({
              open: false,
              reservationId: null,
              reservationName: null,
              isDeleting: false,
            })
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Supprimer définitivement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous absolument sûr de vouloir supprimer complètement la réservation de{" "}
              <strong>{permanentDeleteDialog.reservationName}</strong> ? Cette action est IRRÉVERSIBLE et supprimera
              tous les paiements et participants associés. Seul un superadmin peut effectuer cette action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={permanentDeleteDialog.isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentlyDeleteReservation}
              disabled={permanentDeleteDialog.isDeleting}
              className="bg-destructive hover:bg-destructive/90 disabled:bg-gray-400"
            >
              {permanentDeleteDialog.isDeleting ? "Suppression en cours..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog({
              open: false,
              reservationId: null,
              reservationName: null,
              isDeleting: false,
            })
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler la réservation de <strong>{deleteDialog.reservationName}</strong> ? Cette
              action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReservation}
              disabled={deleteDialog.isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
            >
              {deleteDialog.isDeleting ? "Annulation en cours..." : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
