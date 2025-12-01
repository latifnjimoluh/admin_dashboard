"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ArrowLeft, Plus, Download, Trash2, Printer, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface Payment {
  id: string
  montant: number
  mode: "MoMo" | "Cash"
  date: string
  admin: string
}

interface Participant {
  id?: string
  nom: string
  tel?: string
  email?: string
  role: "Payeur" | "Participant"
}

interface ReservationData {
  id: string
  nom: string
  prenom: string
  telephone: string
  email: string
  pack: "Simple" | "VIP" | "Couple" | "Famille" | "Stand Entreprise"
  prixTotal: number
  statut: "en_attente" | "partiel" | "payé" | "ticket_généré"
  participants: Participant[]
  paiements: Payment[]
  historique: string[]
  dateReservation: string
}

const packPrices = {
  Simple: 15000,
  VIP: 25000,
  Couple: 50000,
  Famille: 75000,
  "Stand Entreprise": 100000,
}

const mockReservationData: ReservationData = {
  id: "1",
  nom: "Dupont",
  prenom: "Jean",
  telephone: "237 6 70 123 456",
  email: "jean.dupont@email.com",
  pack: "Couple",
  prixTotal: 50000,
  statut: "partiel",
  participants: [
    { id: "p1", nom: "Jean Dupont", tel: "237 6 70 123 456", email: "jean.dupont@email.com", role: "Payeur" },
    { id: "p2", nom: "Marie Dupont", tel: "237 6 70 654 321", email: "marie.dupont@email.com", role: "Participant" },
  ],
  paiements: [{ id: "py1", montant: 25000, mode: "MoMo", date: "2024-11-27", admin: "Admin Asso" }],
  historique: ["Jean Asso a créé la réservation", "Jean Asso a ajouté 25000 XAF"],
  dateReservation: "2024-11-28",
}

export default function ReservationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const reservationId = params.id as string

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reservation, setReservation] = useState<ReservationData>(mockReservationData)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showAdvancementPDF, setShowAdvancementPDF] = useState(false)
  const [newPayment, setNewPayment] = useState({ montant: "", mode: "MoMo" })

  const [showEditPayer, setShowEditPayer] = useState(false)
  const [showEditPack, setShowEditPack] = useState(false)
  const [showEditParticipant, setShowEditParticipant] = useState(false)
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null)
  const [editPayerForm, setEditPayerForm] = useState(reservation)
  const [editParticipantForm, setEditParticipantForm] = useState<Participant>({ nom: "", role: "Participant" })
  const [selectedPack, setSelectedPack] = useState<keyof typeof packPrices>(reservation.pack)

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  const totalPayé = reservation.paiements.reduce((sum, p) => sum + p.montant, 0)
  const montantRestant = reservation.prixTotal - totalPayé

  const getStatutBadge = (statut: ReservationData["statut"]) => {
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

  const handleEditPayer = () => {
    setReservation({
      ...reservation,
      nom: editPayerForm.nom,
      prenom: editPayerForm.prenom,
      telephone: editPayerForm.telephone,
      email: editPayerForm.email,
      historique: [...reservation.historique, "Infos du payeur modifiées"],
    })
    setShowEditPayer(false)
  }

  const handleEditPack = () => {
    const newPrice = packPrices[selectedPack]
    let newParticipants: Participant[] = [
      { ...reservation.participants[0], nom: `${reservation.prenom} ${reservation.nom}` },
    ]

    if (selectedPack === "Couple" && reservation.participants.length > 1) {
      newParticipants.push(reservation.participants[1])
    } else if (selectedPack === "Famille") {
      newParticipants = reservation.participants.slice(0, 5)
    } else if (selectedPack === "Stand Entreprise") {
      newParticipants = reservation.participants.slice(0, 3)
    }

    setReservation({
      ...reservation,
      pack: selectedPack,
      prixTotal: newPrice,
      participants: newParticipants,
      historique: [...reservation.historique, `Pack changé en ${selectedPack}`],
    })
    setShowEditPack(false)
  }

  const handleEditParticipant = () => {
    const updatedParticipants = reservation.participants.map((p) =>
      p.id === editingParticipantId ? { ...p, ...editParticipantForm } : p,
    )
    setReservation({
      ...reservation,
      participants: updatedParticipants,
      historique: [...reservation.historique, "Un participant a été modifié"],
    })
    setShowEditParticipant(false)
  }

  const handleDeleteParticipant = (participantId: string) => {
    const updatedParticipants = reservation.participants.filter((p) => p.id !== participantId)
    setReservation({
      ...reservation,
      participants: updatedParticipants,
      historique: [...reservation.historique, "Un participant a été supprimé"],
    })
  }

  const handleAddParticipant = () => {
    const maxParticipants = reservation.pack === "Famille" ? 5 : reservation.pack === "Stand Entreprise" ? 3 : 1
    if (reservation.participants.length < maxParticipants) {
      const newParticipant: Participant = {
        id: `p${Date.now()}`,
        nom: "Nouveau participant",
        tel: "",
        email: "",
        role: "Participant",
      }
      setReservation({
        ...reservation,
        participants: [...reservation.participants, newParticipant],
        historique: [...reservation.historique, "Un participant a été ajouté"],
      })
    }
  }

  const handleAddPayment = () => {
    if (!newPayment.montant) return

    const payment: Payment = {
      id: `py${reservation.paiements.length + 1}`,
      montant: Number.parseInt(newPayment.montant),
      mode: newPayment.mode as "MoMo" | "Cash",
      date: new Date().toISOString().split("T")[0],
      admin: "Admin Actuel",
    }

    const updatedPayments = [...reservation.paiements, payment]
    const newTotalPayé = updatedPayments.reduce((sum, p) => sum + p.montant, 0)

    let newStatut = reservation.statut
    if (newTotalPayé > 0 && newTotalPayé < reservation.prixTotal) {
      newStatut = "partiel"
    } else if (newTotalPayé >= reservation.prixTotal) {
      newStatut = "payé"
    }

    setReservation({
      ...reservation,
      paiements: updatedPayments,
      statut: newStatut,
      historique: [...reservation.historique, `Admin Actuel a ajouté ${payment.montant} XAF`],
    })

    setNewPayment({ montant: "", mode: "MoMo" })
    setShowAddPayment(false)
  }

  const handleDeletePayment = (paymentId: string) => {
    const updatedPayments = reservation.paiements.filter((p) => p.id !== paymentId)
    const newTotalPayé = updatedPayments.reduce((sum, p) => sum + p.montant, 0)

    let newStatut = reservation.statut
    if (newTotalPayé === 0) {
      newStatut = "en_attente"
    } else if (newTotalPayé < reservation.prixTotal) {
      newStatut = "partiel"
    } else {
      newStatut = "payé"
    }

    setReservation({
      ...reservation,
      paiements: updatedPayments,
      statut: newStatut,
      historique: [...reservation.historique, "Un paiement a été supprimé"],
    })
  }

  const handleGenerateTicket = () => {
    if (montantRestant === 0) {
      setReservation({
        ...reservation,
        statut: "ticket_généré",
        historique: [...reservation.historique, "Admin Actuel a généré le ticket"],
      })
      setShowQRCode(true)
    }
  }

  if (isLoading || !isAuthenticated) return null

  const badge = getStatutBadge(reservation.statut)
  const maxParticipants = reservation.pack === "Famille" ? 5 : reservation.pack === "Stand Entreprise" ? 3 : 1
  const canAddParticipant = reservation.participants.length < maxParticipants

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-secondary rounded-md transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Détails de la réservation</h1>
            <p className="text-muted-foreground">ID: {reservation.id}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Informations du Payeur */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Informations du payeur</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="text-foreground font-medium">
                    {reservation.prenom} {reservation.nom}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="text-foreground font-medium">{reservation.telephone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">{reservation.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pack</p>
                  <p className="text-foreground font-medium">{reservation.pack}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prix Total</p>
                  <p className="text-foreground font-medium">{reservation.prixTotal.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Statut</p>
                  <span className={`badge ${badge.className}`}>{badge.label}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Modifier la réservation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setShowEditPayer(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier infos du payeur
                </button>
                <button
                  onClick={() => setShowEditPack(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Changer le pack
                </button>
              </div>
            </div>

            {/* Section 2: Liste des Participants */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Participants</h2>
                {canAddParticipant && (
                  <button
                    onClick={handleAddParticipant}
                    className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {reservation.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{participant.nom}</p>
                      {participant.tel && <p className="text-xs text-muted-foreground">{participant.tel}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary">{participant.role}</Badge>
                      <button
                        onClick={() => {
                          setEditingParticipantId(participant.id || "")
                          setEditParticipantForm(participant)
                          setShowEditParticipant(true)
                        }}
                        className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      {participant.role === "Participant" && (
                        <button
                          onClick={() => handleDeleteParticipant(participant.id || "")}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Tableau des Paiements */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Paiements</h2>
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Montant</th>
                      <th className="text-left">Mode</th>
                      <th className="text-left">Date</th>
                      <th className="text-left">Admin</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservation.paiements.map((payment) => (
                      <tr key={payment.id}>
                        <td className="font-medium">{payment.montant.toLocaleString()} XAF</td>
                        <td>{payment.mode}</td>
                        <td className="text-muted-foreground">{payment.date}</td>
                        <td className="text-muted-foreground">{payment.admin}</td>
                        <td className="text-right">
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 6: Historique */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Historique des actions</h2>
              <div className="space-y-2">
                {reservation.historique.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-secondary rounded-md">
                    <div className="w-1 h-1 mt-2 rounded-full bg-primary flex-shrink-0"></div>
                    <p className="text-sm text-foreground">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Résumé paiement</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total payé</p>
                  <p className="text-2xl font-bold text-green-600">{totalPayé.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant restant</p>
                  <p className="text-2xl font-bold text-orange-600">{montantRestant.toLocaleString()} XAF</p>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Statut actuel</p>
                  <span className={`badge ${badge.className} mt-2`}>{badge.label}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {montantRestant > 0 && (
                  <button
                    onClick={() => setShowAdvancementPDF(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Bon d'avancement
                  </button>
                )}

                {montantRestant === 0 && (
                  <button
                    onClick={handleGenerateTicket}
                    className="w-full px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
                  >
                    Générer ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showEditPayer} onOpenChange={setShowEditPayer}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Modifier infos du payeur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Prénom</label>
              <input
                type="text"
                value={editPayerForm.prenom}
                onChange={(e) => setEditPayerForm({ ...editPayerForm, prenom: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nom</label>
              <input
                type="text"
                value={editPayerForm.nom}
                onChange={(e) => setEditPayerForm({ ...editPayerForm, nom: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
              <input
                type="tel"
                value={editPayerForm.telephone}
                onChange={(e) => setEditPayerForm({ ...editPayerForm, telephone: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={editPayerForm.email}
                onChange={(e) => setEditPayerForm({ ...editPayerForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowEditPayer(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleEditPayer}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Modifier
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditPack} onOpenChange={setShowEditPack}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Changer le pack</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Sélectionner le pack</label>
              <div className="space-y-2">
                {Object.entries(packPrices).map(([packName, price]) => (
                  <label
                    key={packName}
                    className="flex items-center gap-3 p-3 border border-border rounded-md hover:bg-secondary cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="pack"
                      value={packName}
                      checked={selectedPack === packName}
                      onChange={(e) => setSelectedPack(e.target.value as keyof typeof packPrices)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1 text-foreground">
                      {packName} - {price.toLocaleString()} XAF
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowEditPack(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleEditPack}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Changer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditParticipant} onOpenChange={setShowEditParticipant}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Modifier participant</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nom</label>
              <input
                type="text"
                value={editParticipantForm.nom}
                onChange={(e) => setEditParticipantForm({ ...editParticipantForm, nom: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
              <input
                type="tel"
                value={editParticipantForm.tel}
                onChange={(e) => setEditParticipantForm({ ...editParticipantForm, tel: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <input
                type="email"
                value={editParticipantForm.email}
                onChange={(e) => setEditParticipantForm({ ...editParticipantForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowEditParticipant(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleEditParticipant}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Modifier
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ajouter un paiement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Montant (XAF)</label>
              <input
                type="number"
                value={newPayment.montant}
                onChange={(e) => setNewPayment({ ...newPayment, montant: e.target.value })}
                placeholder="Ex: 25000"
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Mode de paiement</label>
              <select
                value={newPayment.mode}
                onChange={(e) => setNewPayment({ ...newPayment, mode: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              >
                <option value="MoMo">Mobile Money (MoMo)</option>
                <option value="Cash">Espèces (Cash)</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowAddPayment(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleAddPayment}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdvancementPDF} onOpenChange={setShowAdvancementPDF}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto bg-white border border-gray-300">
          <div id="advancement-pdf" className="p-8 bg-white space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="text-center flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Movie in the Park</h1>
                <p className="text-sm text-gray-600">Bon d'avancement</p>
              </div>
            </div>

            {/* Payer Info */}
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase">Informations du payeur</h2>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <p className="text-gray-600">Nom</p>
                    <p className="font-medium text-gray-900">
                      {reservation.prenom} {reservation.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Téléphone</p>
                    <p className="font-medium text-gray-900">{reservation.telephone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{reservation.email}</p>
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pack choisi:</span>
                  <span className="font-medium text-gray-900">{reservation.pack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix total:</span>
                  <span className="font-medium text-gray-900">{reservation.prixTotal.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total payé:</span>
                  <span className="font-medium text-green-700">{totalPayé.toLocaleString()} XAF</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base">
                  <span>Montant restant:</span>
                  <span className="text-orange-700">{montantRestant.toLocaleString()} XAF</span>
                </div>
              </div>

              {/* Date */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date de génération:</span>
                <span className="font-medium text-gray-900">{new Date().toLocaleDateString("fr-FR")}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4 text-center text-xs text-gray-600">
              <p>Document simulé – Movie in the Park</p>
              <p>Réservation #{reservation.id}</p>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 p-4">
            <button
              onClick={() => setShowAdvancementPDF(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium text-sm"
            >
              Fermer
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Télécharger PDF
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="bg-card border border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ticket généré</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="30" height="30" fill="black" />
                <rect x="60" y="10" width="30" height="30" fill="black" />
                <rect x="10" y="60" width="30" height="30" fill="black" />
                <rect x="20" y="20" width="10" height="10" fill="white" />
                <rect x="70" y="20" width="10" height="10" fill="white" />
                <rect x="20" y="70" width="10" height="10" fill="white" />
                <rect x="50" y="50" width="30" height="30" fill="black" />
                <text x="50" y="95" textAnchor="middle" fontSize="8" fill="black">
                  TICKET-{reservation.id}
                </text>
              </svg>
            </div>

            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground mb-2">Numéro de ticket</p>
              <p className="text-lg font-semibold text-foreground">TICKET-{reservation.id}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {reservation.prenom} {reservation.nom}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Télécharger Ticket
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
