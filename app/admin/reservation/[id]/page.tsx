"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ArrowLeft, Plus, Download, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

import { api } from "@/lib/api"

// --------------------------------------------------------------
// 🧩 INTERFACES 100 % ALIGNÉES BACKEND
// --------------------------------------------------------------
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
  creator?: { name: string }
}

interface ActionLog {
  id: string
  action_type: string
  createdAt: string
  meta: any
}

interface ReservationData {
  id: string
  payeur_name: string
  payeur_phone: string
  payeur_email: string
  pack_name: string
  total_price: number
  total_paid: number
  remaining_amount: number
  status: string
  createdAt: string

  participants: Participant[]
  payments: Payment[]
  actions: ActionLog[]
}

// --------------------------------------------------------------

export default function ReservationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const reservationId = params.id as string

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [reservation, setReservation] = useState<ReservationData | null>(null)

  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [ticketDataUrl, setTicketDataUrl] = useState<string | null>(null)
  const [ticketCode, setTicketCode] = useState<string | null>(null)
  const [ticketGenerating, setTicketGenerating] = useState(false)
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null)
  const [showAdvancementPDF, setShowAdvancementPDF] = useState(false)

  const [newPayment, setNewPayment] = useState({ amount: "", method: "cash" })
  
  const mapActionDescription = (a: ActionLog) => {
    if (a.meta?.description) return a.meta.description

    if (a.action_type === "payment.add") {
      return `Paiement ajouté : +${a.meta.amount} XAF (${a.meta.method})`
    }
    if (a.action_type === "payment.delete") {
      return `Paiement supprimé : -${a.meta.amount} XAF`
    }
    if (a.action_type === "reservation.update") {
      return `Modification des informations du payeur`
    }
    if (a.action_type === "pack.change") {
      return `Changement de pack : ${a.meta.old} → ${a.meta.new}`
    }

    return a.action_type
  }

  // --------------------------------------------------------------
  // 🔐 AUTH CHECK
  // --------------------------------------------------------------
  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  // --------------------------------------------------------------
  // 📌 LOAD RESERVATION
  // --------------------------------------------------------------
  const loadReservation = async () => {
    setLoadingData(true)
    try {
      const res = await api.reservations.getOne(reservationId)

      if (!res?.reservation) {
        console.error("Réservation introuvable :", res)
        return
      }

      const r = res.reservation

      const mapped: ReservationData = {
        id: r.id,
        payeur_name: r.payeur_name,
        payeur_phone: r.payeur_phone,
        payeur_email: r.payeur_email,

        pack_name: r.pack_name_snapshot || r.pack?.name,
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

        actions: r.actions,
      }

      setReservation(mapped)
    } catch (err) {
      console.error("Erreur récupération réservation:", err)
    }
    setLoadingData(false)
  }

  useEffect(() => {
    if (isAuthenticated) loadReservation()
  }, [isAuthenticated])

  // --------------------------------------------------------------
  // 🎨 BADGE STATUT
  // --------------------------------------------------------------
  const mapStatus = (status: string) => {
    const variants: any = {
      pending: { class: "badge-en-attente", label: "En attente" },
      partial: { class: "badge-partiel", label: "Partiel" },
      paid: { class: "badge-paye", label: "Payé" },
      ticket_generated: { class: "badge-ticket-genere", label: "Ticket généré" },
    }
    return variants[status] || { class: "badge-en-attente", label: status }
  }

  if (!isAuthenticated || !reservation) return null

  const badge = mapStatus(reservation.status)
  const totalPayé = reservation.total_paid
  const montantRestant = reservation.remaining_amount

  // --------------------------------------------------------------
  // 💵 AJOUTER UN PAIEMENT
  // --------------------------------------------------------------
  const handleAddPayment = async () => {
    if (!newPayment.amount) return

    try {
      await api.payments.add(reservation.id, {
        amount: Number(newPayment.amount),
        method: newPayment.method,
      })

      await loadReservation()
      setShowAddPayment(false)
      setNewPayment({ amount: "", method: "cash" })
    } catch (err) {
      console.error("Erreur ajout paiement :", err)
    }
  }

  // -----------------------------
  // Génération d'un ticket image
  // -----------------------------
  const chooseImageForPack = (packName?: string) => {
    if (!packName) return "/simple.jpg"
    const name = packName.toLowerCase()
    if (name.includes("vip")) return "/vip.jpg"
    if (name.includes("famille") || name.includes("family")) return "/famille.jpg"
    if (name.includes("couple")) return "/couple.jpg"
    return "/simple.jpg"
  }

  const handleGenerateTicket = async () => {
    if (!reservation) return
    setTicketGenerating(true)
    try {
      // Call backend to generate ticket (includes QR image and PDF)
      const resp: any = await api.tickets.generate(reservation.id)
      const ticket = resp.ticket || resp

      const ticketNumber = ticket.ticket_number || ticket.ticketNumber || null
      const qrImagePath = ticket.qr_image_url || ticket.qrImageUrl || null
      const pdfUrl = ticket.pdf_url || ticket.pdfUrl || null

      setTicketCode(ticketNumber)
      if (pdfUrl) setTicketPdfUrl(pdfUrl.startsWith("http") ? pdfUrl : `http://localhost:3001${pdfUrl}`)

      // Build full QR URL if needed
      let qrSrc = null
      if (qrImagePath) {
        qrSrc = qrImagePath.startsWith("http") ? qrImagePath : `http://localhost:3001${qrImagePath}`
      }

      // Load template and qr image
      const templateSrc = chooseImageForPack(reservation.pack_name)
      const imgTemplate = new Image()
      imgTemplate.crossOrigin = "anonymous"
      imgTemplate.src = templateSrc

      const imgQr = new Image()
      imgQr.crossOrigin = "anonymous"
      if (qrSrc) imgQr.src = qrSrc

      await Promise.all([
        new Promise<void>((res, rej) => { imgTemplate.onload = () => res(); imgTemplate.onerror = rej }),
        new Promise<void>((res, rej) => { if (!qrSrc) return res(); imgQr.onload = () => res(); imgQr.onerror = rej }),
      ])

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Impossible d'obtenir le contexte canvas")

      const width = imgTemplate.naturalWidth || imgTemplate.width || 1200
      const height = imgTemplate.naturalHeight || imgTemplate.height || 400
      canvas.width = width
      canvas.height = height

      // Draw template
      ctx.drawImage(imgTemplate, 0, 0, width, height)

      // Draw QR on right side (adjust size)
      if (qrSrc) {
        const qrSize = Math.floor(Math.min(width, height) * 0.22)
        const qrX = width - qrSize - Math.floor(width * 0.04)
        const qrY = Math.floor(height * 0.06)
        ctx.fillStyle = "rgba(255,255,255,0.0)"
        ctx.drawImage(imgQr, qrX, qrY, qrSize, qrSize)
      }

      // Draw code (ticket number) in bottom-right rounded box
      const boxWidth = Math.floor(width * 0.36)
      const boxHeight = Math.floor(height * 0.18)
      const boxX = width - boxWidth - Math.floor(width * 0.04)
      const boxY = height - boxHeight - Math.floor(height * 0.06)

      ctx.fillStyle = "rgba(0,0,0,0.55)"
      const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.arcTo(x + w, y, x + w, y + h, r)
        ctx.arcTo(x + w, y + h, x, y + h, r)
        ctx.arcTo(x, y + h, x, y, r)
        ctx.arcTo(x, y, x + w, y, r)
        ctx.closePath()
        ctx.fill()
      }
      drawRoundedRect(boxX, boxY, boxWidth, boxHeight, Math.floor(boxHeight * 0.15))

      ctx.fillStyle = "#ffffff"
      const fontSize = Math.floor(boxHeight * 0.35)
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(ticketNumber || "", boxX + boxWidth / 2, boxY + boxHeight / 2 - (fontSize * 0.08))

      ctx.font = `${Math.floor(boxHeight * 0.18)}px sans-serif`
      ctx.fillText(`#${reservation.id.slice(0, 8)}`, boxX + boxWidth / 2, boxY + boxHeight / 2 + (fontSize * 0.6))

      const dataUrl = canvas.toDataURL("image/png")
      setTicketDataUrl(dataUrl)
      setShowQRCode(true)

      // Refresh reservation status
      await loadReservation()
    } catch (err) {
      console.error("Erreur génération ticket:", err)
    } finally {
      setTicketGenerating(false)
    }
  }

  // --------------------------------------------------------------
  // 📄 GÉNÉRER PDF À PARTIR DU SCREENSHOT
  // --------------------------------------------------------------
  const generatePDF = async () => {
    const element = document.getElementById("advancement-pdf")
    if (!element) {
      console.error("Élément PDF introuvable")
      return
    }

    try {
      // Importer html2canvas dynamiquement
      const html2canvas = (await import("html2canvas")).default
      const { jsPDF } = await import("jspdf")

      // Créer le canvas à partir de l'élément
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 800,
        windowHeight: element.scrollHeight,
      })

      // Créer le PDF
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`bon_avancement_${reservation.id}.pdf`)
    } catch (error) {
      console.error("Erreur génération PDF:", error)
      alert("Erreur lors de la génération du PDF")
    }
  }

  // --------------------------------------------------------------
  // 🚀 UI PAGE PRINCIPALE
  // --------------------------------------------------------------

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-secondary rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold">Détails de la réservation</h1>
            <p className="text-muted-foreground">ID : {reservation.id}</p>
          </div>
        </div>

        {/* CONTENU */}
        {loadingData ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT SIDE */}
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
                <h2 className="text-xl font-semibold mb-4">Participants</h2>

                <div className="space-y-3">
                  {reservation.participants.map((p) => (
                    <div key={p.id} className="p-3 bg-secondary rounded-md">
                      <p className="font-medium">{p.name}</p>
                      {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                      {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                    </div>
                  ))}
                </div>
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

                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Montant</th>
                      <th className="text-left">Méthode</th>
                      <th className="text-left">Date</th>
                      <th className="text-left">Admin</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reservation.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.amount.toLocaleString()} XAF</td>
                        <td>{p.method}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td>{p.creator?.name || "Admin"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ACTION LOGS */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Historique des actions</h2>

                <div className="space-y-3">
                  {reservation.actions.map((a) => (
                    <div key={a.id} className="p-3 bg-secondary rounded-md text-sm">
                      <p className="font-medium">{mapActionDescription(a)}</p>                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT SUMMARY */}
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Résumé paiement</h2>

                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Total payé</p>
                    <p className="text-2xl font-bold text-green-600">{totalPayé.toLocaleString()} XAF</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-sm">Montant restant</p>
                    <p className="text-2xl font-bold text-orange-600">{montantRestant.toLocaleString()} XAF</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {montantRestant > 0 && (
                    <button
                      onClick={() => setShowAdvancementPDF(true)}
                      className="w-full flex items-center justify-center bg-orange-600 text-white px-4 py-2 rounded-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Bon d'avancement
                    </button>
                  )}

                  {montantRestant === 0 && (
                    <button
                      onClick={() => handleGenerateTicket()}
                      className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md"
                    >
                      Générer ticket
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* AJOUT PAIEMENT */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="bg-card border rounded-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un paiement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm">Montant</label>
              <input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                className="w-full px-3 py-2 bg-input border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm">Méthode</label>
              <select
                value={newPayment.method}
                onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                className="w-full px-3 py-2 bg-input border rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="momo">Mobile Money</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <button onClick={() => setShowAddPayment(false)} className="px-4 py-2 bg-secondary rounded-md">
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

      {/* QR CODE */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="bg-card border rounded-lg max-w-sm">
          <DialogHeader>
            <DialogTitle>Ticket généré</DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center">
            {ticketGenerating ? (
              <p>Génération du ticket…</p>
            ) : (
              <>
                {ticketDataUrl ? (
                  <>
                    <img src={ticketDataUrl} alt="Ticket" className="mx-auto w-full rounded-md shadow-md" />
                    <p className="font-semibold mt-3">Code : {ticketCode}</p>
                    <p className="text-sm text-muted-foreground">{reservation.payeur_name}</p>

                    <a
                      href={ticketDataUrl}
                      download={`ticket_${ticketCode || reservation.id}.png`}
                      className="mt-4 inline-block w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-center"
                    >
                      <Download className="w-4 h-4 inline mr-2" /> Télécharger
                    </a>
                    {ticketPdfUrl && (
                      <a
                        href={ticketPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block w-full bg-secondary text-gray-900 rounded-md px-4 py-2 text-center"
                      >
                        Ouvrir PDF serveur
                      </a>
                    )}
                  </>
                ) : (
                  <p>Impossible de générer le ticket.</p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------- */}
      {/* BON D'AVANCEMENT – DESIGN EXACT DE L'IMAGE              */}
      {/* -------------------------------------------------------- */}
      <Dialog open={showAdvancementPDF} onOpenChange={setShowAdvancementPDF}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto bg-white">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Bon d'avancement</DialogTitle>
              <DialogDescription>Document retraçant les paiements</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>

          {/* BON STRUCTURÉ - EXACTEMENT COMME L'IMAGE */}
          <div 
            id="advancement-pdf" 
            className="bg-white text-black"
            style={{ 
              width: "700px", 
              padding: "40px",
              fontFamily: "system-ui, -apple-system, sans-serif"
            }}
          >
            {/* HEADER */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "20px",
              marginBottom: "30px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img
                  src={`${typeof window !== "undefined" ? window.location.origin : ""}/logo.png`}
                  style={{ width: "64px", height: "64px", objectFit: "contain" }}
                  alt="Logo"
                />
                <div>
                  <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 4px 0" }}>
                    Movie in the Park
                  </h1>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "0" }}>
                    Bon d'avancement
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
                  Date d'émission
                </p>
                <p style={{ fontSize: "14px", fontWeight: "600", margin: "0" }}>
                  {new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            {/* INFORMATIONS DU PAYEUR */}
            <div style={{ marginBottom: "30px" }}>
              <h2 style={{ 
                fontSize: "14px", 
                fontWeight: "600", 
                textTransform: "uppercase",
                color: "#374151",
                marginBottom: "16px",
                letterSpacing: "0.05em"
              }}>
                Informations du payeur
              </h2>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "16px",
                fontSize: "14px"
              }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
                    Nom complet
                  </p>
                  <p style={{ fontWeight: "500", margin: "0" }}>
                    {reservation.payeur_name}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
                    Téléphone
                  </p>
                  <p style={{ fontWeight: "500", margin: "0" }}>
                    {reservation.payeur_phone}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
                    Email
                  </p>
                  <p style={{ fontWeight: "500", margin: "0" }}>
                    {reservation.payeur_email}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
                    Pack
                  </p>
                  <p style={{ fontWeight: "500", margin: "0" }}>
                    {reservation.pack_name}
                  </p>
                </div>
              </div>
            </div>

            {/* DÉTAILS DU PAIEMENT */}
            <div style={{ 
              border: "1px solid #e5e7eb", 
              borderRadius: "8px", 
              padding: "24px",
              marginBottom: "30px"
            }}>
              <h2 style={{ 
                fontSize: "14px", 
                fontWeight: "600",
                color: "#374151",
                marginBottom: "16px"
              }}>
                Détails du paiement
              </h2>

              <div style={{ fontSize: "14px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: "12px" 
                }}>
                  <span style={{ color: "#6b7280" }}>Prix total</span>
                  <span style={{ fontWeight: "600" }}>
                    {reservation.total_price.toLocaleString()} XAF
                  </span>
                </div>

                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: "12px" 
                }}>
                  <span style={{ color: "#6b7280" }}>Montant payé</span>
                  <span style={{ fontWeight: "600", color: "#16a34a" }}>
                    {reservation.total_paid.toLocaleString()} XAF
                  </span>
                </div>

                <div style={{ 
                  borderTop: "1px solid #e5e7eb", 
                  paddingTop: "12px",
                  display: "flex", 
                  justifyContent: "space-between"
                }}>
                  <span style={{ fontWeight: "700" }}>Montant restant</span>
                  <span style={{ fontWeight: "700", fontSize: "18px", color: "#ea580c" }}>
                    {reservation.remaining_amount.toLocaleString()} XAF
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ 
              textAlign: "center", 
              fontSize: "11px", 
              color: "#6b7280",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px"
            }}>
              <p style={{ margin: "0 0 4px 0" }}>
                Document généré automatiquement — Movie in the Park
              </p>
              <p style={{ margin: "0" }}>
                Réservation #{reservation.id}
              </p>
            </div>
          </div>

          {/* BUTTONS */}
          <DialogFooter className="bg-gray-50 p-4">
            <button
              onClick={() => setShowAdvancementPDF(false)}
              className="px-4 py-2 bg-secondary text-gray-900 rounded-md"
            >
              Fermer
            </button>

            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger PDF
            </button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}