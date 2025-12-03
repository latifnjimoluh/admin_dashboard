"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ArrowLeft, Plus, Download, Eye, FileText, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface Participant {
  id: string
  name: string
  phone: string | null
  email: string | null
}

interface Payment {
  id: string
  amount: number
  method: string
  createdAt: string
  creator?: { name?: string; role?: string }
}

interface ActionLog {
  id: string
  action_type: string
  createdAt: string
  meta: any
  user?: { name?: string; role?: string }
}

interface ReservationData {
  id: string
  payeur_name: string
  payeur_phone: string
  payeur_email: string
  pack_name: string
  quantity: number
  total_price: number
  total_paid: number
  remaining_amount: number
  status: string
  createdAt: string
  participants: Participant[]
  payments: Payment[]
  actions: ActionLog[]
}

interface TicketData {
  ticket_number: string
  qr_data_url: string
  pdf_url: string
  generated_at: string
}

export default function ReservationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const reservationId = params.id as string

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [ticketData, setTicketData] = useState<TicketData | null>(null)
  const [loadingTicket, setLoadingTicket] = useState(false)

  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showTicketPreview, setShowTicketPreview] = useState(false)
  const [newPayment, setNewPayment] = useState({
  amount: "",
  method: "cash",
  file: null as File | null,
})
const [paymentError, setPaymentError] = useState("");



  useEffect(() => {
    if (typeof window === "undefined") return
    if (!localStorage.getItem("admin_token")) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  const loadReservation = async () => {
    setLoadingData(true)
    try {
      const res = await api.reservations.getOne(reservationId)

      if (!res?.data?.reservation) {
        console.error("Réservation introuvable :", res)
        return
      }

      const r = res.data.reservation

      const mapped: ReservationData = {
        id: r.id,
        payeur_name: r.payeur_name,
        payeur_phone: r.payeur_phone,
        payeur_email: r.payeur_email,
        pack_name: r.pack_name_snapshot || r.pack?.name,
        quantity: r.quantity || 1,
        total_price: r.total_price,
        total_paid: r.total_paid,
        remaining_amount: r.remaining_amount,
        status: r.status,
        createdAt: r.createdAt,
        participants: r.participants.map((p: any) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email,
        })),
        payments: (r.payments || []).map((p: any) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          createdAt: p.createdAt,
          creator: p.creator,
        })),
        actions: (r.actions || []).map((a: any) => ({
          id: a.id,
          action_type: a.action_type,
          createdAt: a.createdAt,
          meta: a.meta,
          user: a.user,
        })),
      }

      setReservation(mapped)

      if (mapped.status === "ticket_generated") {
        await loadTicket()
      }
    } catch (err) {
      console.error("Erreur récupération réservation:", err)
    }
    setLoadingData(false)
  }

  const loadTicket = async () => {
    setLoadingTicket(true)
    try {
      const res = await api.tickets.getByReservation(reservationId)
      if (res.status === 200 && res.data) {
        const ticket = res.data.ticket || res.data
        setTicketData(ticket)
      }
    } catch (err: any) {
      if (err.status !== 404) {
        console.error("Error loading ticket:", err)
      }
    } finally {
      setLoadingTicket(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadReservation()
  }, [isAuthenticated])

  const mapActionDescription = (a: ActionLog) => {
    if (a.meta?.description) return a.meta.description
    if (a.action_type === "payment.add") {
      const method = a.meta.method === "cash" ? "espèces" : a.meta.method === "momo" ? "Mobile Money" : a.meta.method
      return `Un paiement de ${a.meta.amount} XAF a été enregistré (${method})`
    }
    if (a.action_type === "payment.delete") {
      return `Un paiement de ${a.meta.amount} XAF a été annulé`
    }
    if (a.action_type === "ticket.generate") {
      return `Le ticket ${a.meta.ticket_number || "N/A"} a été généré avec succès`
    }
    return a.action_type
  }

  const formatUserLabel = (user?: { name?: string; role?: string } | null) => {
    if (!user) return "Admin"
    const name = user.name?.trim()
    const role = user.role?.trim()
    if (name && role) return `${name} (${role})`
    if (name) return name
    if (role) return role
    return "Admin"
  }

  const mapStatus = (status: string) => {
    const variants: any = {
      pending: { class: "badge-en-attente", label: "En attente" },
      partial: { class: "badge-partiel", label: "Partiel" },
      paid: { class: "badge-paye", label: "Payé" },
      ticket_generated: { class: "badge-ticket-genere", label: "Ticket généré" },
    }
    return variants[status] || { class: "badge-en-attente", label: status }
  }

  const handleAddPayment = async () => {
  setPaymentError("");

  const amountValue = Number(newPayment.amount);

  if (!amountValue || isNaN(amountValue) || amountValue <= 0) {
    setPaymentError("Veuillez saisir un montant valide.");
    return;
  }

  try {
    await api.payments.add(reservation!.id, {
      amount: amountValue,
      method: newPayment.method,
      proof: newPayment.file || undefined,
    });

    await loadReservation();
    setShowAddPayment(false);

    setNewPayment({
      amount: "",
      method: "cash",
      file: null,
    });
  } catch (err: any) {
  console.error("Erreur ajout paiement :", err);

  // ✔ Récupération correcte du message backend
  const backendMsg =
    err?.data?.message ||   // cas FormData
    err?.message ||         // message retourné par api.ts
    "";

  // 🔥 Détection du dépassement
  if (backendMsg.includes("dépasse le montant restant")) {

    const match = backendMsg.match(/montant restant\s*\((\d+)\s?XAF\)/i);
    const montantRestant = match ? match[1] : null;

    if (montantRestant) {
      setPaymentError(
        `La somme saisie est supérieure au montant restant (${montantRestant} XAF). Bien vouloir réessayer avec ${montantRestant} XAF ou moins.`
      );
      return;
    }
  }

  // 🔥 Afficher le message backend si aucun cas particulier
  setPaymentError(
    backendMsg || "Une erreur est survenue lors de l'ajout du paiement."
  );
}

};



  const handleViewTicket = () => {
    if (ticketData?.pdf_url) {
      setShowTicketPreview(true)
    }
  }

  const handleDownloadTicket = () => {
    if (ticketData?.pdf_url) {
      const link = document.createElement("a")
      link.href = ticketData.pdf_url
      link.download = `ticket-${ticketData.ticket_number}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleGenerateTicket = async () => {
    setLoadingTicket(true)
    try {
      const res = await api.tickets.generate(reservationId)
      if (res.status === 201 || res.status === 200) {
        const ticket = res.data.ticket || res.data
        setTicketData(ticket)
        await loadReservation()
      }
    } catch (err: any) {
      console.error("Ticket generation error:", err)
      if (err.status === 409) {
        await loadTicket()
      }
    } finally {
      setLoadingTicket(false)
    }
  }

  // --- Modifié : génération du bon avec logo optionnel ---
  const generateBonAvancement = () => {
    if (!reservation) return

    const canvas = document.createElement("canvas")
    canvas.width = 600
    canvas.height = 800
    const ctx = canvas.getContext("2d")!

    const logoSrc = "/logo.png" // place ton logo dans /public/logo.png

    const drawAll = (logoImg?: HTMLImageElement) => {
      // Fond blanc
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Header avec fond sombre
      ctx.fillStyle = "#1a1a1a"
      ctx.fillRect(0, 0, canvas.width, 120)

      // Si logo fourni, l'afficher à gauche, sinon on laisse le texte centré
      if (logoImg) {
        const logoW = 100
        const logoH = 80
        const logoX = 30
        const logoY = 18
        try {
          ctx.drawImage(logoImg, logoX, logoY, logoW, logoH)
        } catch (e) {
          // ignore si drawImage échoue
        }
        // Titre déplacé pour laisser la place au logo
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "left"
        ctx.fillText("Movie in the Park", 150, 52)

        ctx.font = "14px Arial"
        ctx.fillText("Bon d'avancement", 150, 78)
      } else {
        // Pas de logo : titre centré
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 28px Arial"
        ctx.textAlign = "left"
        ctx.fillText("Movie in the Park", 30, 60)

        ctx.font = "16px Arial"
        ctx.fillText("Bon d'avancement", 30, 90)
      }

      // Date d'émission
      ctx.font = "14px Arial"
      ctx.textAlign = "right"
      ctx.fillStyle = "#ffffff"
      ctx.fillText("Date d'émission", canvas.width - 30, 60)
      ctx.font = "bold 16px Arial"
      ctx.fillText(new Date().toLocaleDateString("fr-FR"), canvas.width - 30, 85)

      // Section Informations du payeur
      ctx.textAlign = "left"
      ctx.fillStyle = "#333333"
      ctx.font = "bold 18px Arial"
      ctx.fillText("INFORMATIONS DU PAYEUR", 30, 180)

      // Grille d'informations
      ctx.font = "14px Arial"
      ctx.fillStyle = "#666666"
      ctx.fillText("Nom complet", 30, 220)
      ctx.fillStyle = "#000000"
      ctx.font = "bold 14px Arial"
      ctx.fillText(reservation.payeur_name, 30, 240)

      ctx.font = "14px Arial"
      ctx.fillStyle = "#666666"
      ctx.fillText("Téléphone", 320, 220)
      ctx.fillStyle = "#000000"
      ctx.font = "bold 14px Arial"
      ctx.fillText(reservation.payeur_phone, 320, 240)

      ctx.font = "14px Arial"
      ctx.fillStyle = "#666666"
      ctx.fillText("Email", 30, 280)
      ctx.fillStyle = "#000000"
      ctx.font = "bold 14px Arial"
      ctx.fillText(reservation.payeur_email || "—", 30, 300)

      ctx.font = "14px Arial"
      ctx.fillStyle = "#666666"
      ctx.fillText("Pack", 320, 280)
      ctx.fillStyle = "#000000"
      ctx.font = "bold 14px Arial"
      ctx.fillText(reservation.pack_name, 320, 300)

      // Encadré détails du paiement
      ctx.strokeStyle = "#e0e0e0"
      ctx.lineWidth = 2
      ctx.strokeRect(30, 350, canvas.width - 60, 180)

      ctx.fillStyle = "#000000"
      ctx.font = "bold 18px Arial"
      ctx.fillText("Détails du paiement", 50, 390)

      // Prix total
      ctx.font = "14px Arial"
      ctx.fillStyle = "#666666"
      ctx.fillText("Prix total", 50, 430)
      ctx.fillStyle = "#000000"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "right"
      ctx.fillText(`${reservation.total_price.toLocaleString()} XAF`, canvas.width - 50, 430)

      // Montant payé
      ctx.textAlign = "left"
      ctx.font = "14px Arial"
      ctx.fillStyle = "#666666"
      ctx.fillText("Montant payé", 50, 470)
      ctx.fillStyle = "#16a34a"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "right"
      ctx.fillText(`${reservation.total_paid.toLocaleString()} XAF`, canvas.width - 50, 470)

      // Montant restant
      ctx.textAlign = "left"
      ctx.font = "bold 16px Arial"
      ctx.fillStyle = "#000000"
      ctx.fillText("Montant restant", 50, 510)
      ctx.fillStyle = "#ea580c"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "right"
      ctx.fillText(`${reservation.remaining_amount.toLocaleString()} XAF`, canvas.width - 50, 510)
      // ==== DERNIERS PAIEMENTS ==== //
      ctx.textAlign = "left"
      ctx.fillStyle = "#333333"
      ctx.font = "bold 18px Arial"
      ctx.fillText("Derniers paiements", 30, 560)

      let y = 590

      // On récupère les 3 paiements les plus récents
      const lastPayments = [...reservation.payments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)

      if (lastPayments.length === 0) {
        ctx.font = "14px Arial"
        ctx.fillStyle = "#666"
        ctx.fillText("Aucun paiement enregistré", 30, y)
        y += 20
      } else {
        lastPayments.forEach((p) => {
          const date = new Date(p.createdAt).toLocaleDateString("fr-FR")
          const method =
            p.method === "cash"
              ? "Espèces"
              : p.method === "momo"
              ? "Mobile Money"
              : p.method === "card"
              ? "Carte bancaire"
              : p.method

          ctx.font = "14px Arial"
          ctx.fillStyle = "#555"
          ctx.fillText(`${date} — ${method}`, 30, y)

          ctx.textAlign = "right"
          ctx.fillStyle = "#000"
          ctx.font = "bold 16px Arial"
          ctx.fillText(`${p.amount.toLocaleString()} XAF`, canvas.width - 50, y)

          ctx.textAlign = "left"
          y += 24
        })
      }


      // Footer
      ctx.textAlign = "center"
      ctx.font = "11px Arial"
      ctx.fillStyle = "#999999"
      ctx.fillText(`Document généré automatiquement — Movie in the Park`, canvas.width / 2, 720)
      ctx.fillText(`Réservation #${reservation.id.substring(0, 8)}`, canvas.width / 2, 740)

      // Télécharger
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `bon-avancement-${reservation.payeur_name.replace(/\s+/g, "-")}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      })
    }

    // Tenter de charger le logo, si présent dans /public/logo.png
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = logoSrc

    // Si le logo charge correctement : dessiner avec le logo
    img.onload = () => {
      drawAll(img)
    }

    // Si erreur de chargement (fichier absent, CORS...), dessiner sans logo
    img.onerror = () => {
      drawAll(undefined)
    }
  }
  // --- Fin modification ---

  const renderPaymentSummary = () => {
    if (!reservation) return null
    const montantRestant = reservation.remaining_amount
    const isFullyPaid = montantRestant === 0
    const hasTicket = reservation.status === "ticket_generated" && ticketData

    return (
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Résumé paiement</h2>

        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground text-sm">Total payé</p>
            <p className="text-2xl font-bold text-green-600">
              {reservation.total_paid.toLocaleString()} XAF
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-sm">Montant restant</p>
            <p className="text-2xl font-bold text-orange-600">{montantRestant.toLocaleString()} XAF</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {montantRestant > 0 && (
            <button
              onClick={generateBonAvancement}
              className="w-full flex items-center justify-center bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Bon d'avancement
            </button>
          )}

          {isFullyPaid && !hasTicket && (
            <button
              onClick={handleGenerateTicket}
              disabled={loadingTicket}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loadingTicket ? "Génération..." : "Générer le ticket"}
            </button>
          )}

          {isFullyPaid && hasTicket && (
            <>
              <button
                onClick={handleViewTicket}
                className="w-full flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir le ticket
              </button>
              <button
                onClick={handleDownloadTicket}
                className="w-full flex items-center justify-center bg-secondary text-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le ticket
              </button>
            </>
          )}
        </div>

        {hasTicket && ticketData && (
          <div className="mt-4 p-3 bg-secondary rounded-md">
            <p className="text-xs text-muted-foreground">Numéro du ticket</p>
            <p className="text-sm font-mono font-bold">{ticketData.ticket_number}</p>
          </div>
        )}
      </div>
    )
  }

  if (!isAuthenticated || !reservation) return null

  const badge = mapStatus(reservation.status)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-secondary rounded-md"
            aria-label="Retour"
            title="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold">Détails de la réservation</h1>
            <p className="text-muted-foreground">ID : {reservation.id}</p>
          </div>
        </div>

        {loadingData ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* PAYEUR */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Informations du payeur</h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nom</p>
                    <p className="font-medium">{reservation.payeur_name}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{reservation.payeur_phone}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{reservation.payeur_email}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Pack</p>
                    <p className="font-medium">{reservation.pack_name}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Quantité</p>
                    <p className="font-medium">{reservation.quantity}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Prix total</p>
                    <p className="font-medium">{reservation.total_price.toLocaleString()} XAF</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Statut</p>
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                  </div>
                </div>
              </div>

              {/* PARTICIPANTS */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Participants ({reservation.participants.length}/{reservation.quantity})
                </h2>

                <div className="space-y-3">
                  {reservation.participants.map((p, index) => (
                    <div key={p.id} className="p-3 bg-secondary rounded-md">
                      <p className="font-medium">
                        {index === 0 ? "👤 " : ""}
                        {p.name}
                      </p>
                      {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                      {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                    </div>
                  ))}
                </div>

                {reservation.participants.length < reservation.quantity && (
                  <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/50 rounded-md">
                    <p className="text-sm text-orange-600">
                      ⚠️ Places restantes: {reservation.quantity - reservation.participants.length}
                    </p>
                  </div>
                )}
              </div>

              {/* PAYMENTS */}
              <div className="bg-card border rounded-lg p-6">
                <div className="flex justify-between mb-4">
                  <h2 className="text-xl font-semibold">Paiements</h2>

                  <button
                    onClick={() => setShowAddPayment(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md"
                  >
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Montant</th>
                        <th className="text-left py-2">Méthode</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Admin</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reservation.payments.map((p) => (
                        <tr key={p.id} className="border-b">
                          <td className="font-medium py-2">{p.amount.toLocaleString()} XAF</td>
                          <td className="py-2">{p.method}</td>
                          <td className="py-2">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
                          <td className="py-2">{formatUserLabel(p.creator)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {reservation.payments.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucun paiement enregistré</p>
                  )}
                </div>
              </div>

              {/* ACTION LOGS */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Historique des actions</h2>

                <div className="space-y-3">
                  {reservation.actions.map((a) => (
                    <div key={a.id} className="p-3 bg-secondary rounded-md text-sm">
                      <p className="font-medium">{mapActionDescription(a)}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString("fr-FR")}
                        </p>
                        {a.user && (
                          <p className="text-xs text-muted-foreground">
                            Par : <span className="font-medium">{formatUserLabel(a.user)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">{renderPaymentSummary()}</div>
          </div>
        )}
      </div>

      {/* AJOUT PAIEMENT */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="bg-card border rounded-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
          </DialogHeader>

          {/* 🔥 MESSAGE D'ERREUR AFFICHÉ ICI */}
          {paymentError && (
            <div className="text-red-600 bg-red-100 border border-red-300 p-2 rounded-md text-sm">
              {paymentError}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm">Montant (XAF)</label>
              <input
                type="number"
                min="1"
                value={newPayment.amount}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    amount: e.target.value.replace(/[^0-9]/g, ""),
                  })
                }
                className="w-full px-3 py-2 bg-input border rounded-md"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="payment-method" className="text-sm">Méthode</label>
              <select
                id="payment-method"
                value={newPayment.method}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, method: e.target.value })
                }
                className="w-full px-3 py-2 bg-input border rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="momo">Mobile Money</option>
                <option value="orange">Orange Money</option>
              </select>
            </div>

            <div>
              <label className="text-sm">Justificatif (image ou PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    file: e.target.files ? e.target.files[0] : null,
                  })
                }
                className="w-full px-3 py-2 bg-input border rounded-md"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowAddPayment(false)}
              className="px-4 py-2 bg-secondary rounded-md"
            >
              Annuler
            </button>

            <button
              onClick={handleAddPayment}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


            {/* PREVIEW TICKET */}
            <Dialog open={showTicketPreview} onOpenChange={setShowTicketPreview}>
              <DialogContent className="bg-card border rounded-lg max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle>Aperçu du ticket</DialogTitle>
                </DialogHeader>

                <div className="px-6 py-4 flex-1 overflow-hidden">
                  {ticketData?.pdf_url && (
                    <iframe
                      src={ticketData.pdf_url}
                      className="w-full h-[65vh] border rounded-md"
                      title="Aperçu du ticket"
                    />
                  )}
                </div>

          <DialogFooter className="px-6 py-4 border-t flex gap-2">
            <Button onClick={() => setShowTicketPreview(false)} variant="outline">
              Fermer
            </Button>
            <Button onClick={handleDownloadTicket} className="bg-primary text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
