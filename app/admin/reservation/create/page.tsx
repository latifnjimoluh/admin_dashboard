"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

type PackType = "Simple" | "VIP" | "Couple" | "Famille" | "Stand Entreprise"

interface Participant {
  nom: string
  telephone?: string
  email?: string
}

const PACK_PRICES: Record<PackType, number> = {
  Simple: 15000,
  VIP: 30000,
  Couple: 50000,
  Famille: 75000,
  "Stand Entreprise": 100000,
}

const PACK_PARTICIPANT_COUNTS: Record<PackType, { min: number; max: number }> = {
  Simple: { min: 1, max: 1 },
  VIP: { min: 1, max: 1 },
  Couple: { min: 2, max: 2 },
  Famille: { min: 3, max: 5 },
  "Stand Entreprise": { min: 1, max: 3 },
}

export default function CreateReservationPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [payerName, setPayerName] = useState("")
  const [payerPhone, setPayerPhone] = useState("")
  const [payerEmail, setPayerEmail] = useState("")
  const [selectedPack, setSelectedPack] = useState<PackType>("Simple")
  const [participants, setParticipants] = useState<Participant[]>([{ nom: "" }])
  const [newParticipant, setNewParticipant] = useState({ nom: "", telephone: "", email: "" })

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
    const limits = PACK_PARTICIPANT_COUNTS[selectedPack]
    // Initialize participants for the selected pack
    if (selectedPack === "Simple" || selectedPack === "VIP") {
      setParticipants([{ nom: payerName }])
    } else if (selectedPack === "Couple") {
      setParticipants([{ nom: payerName }, { nom: "" }])
    } else if (selectedPack === "Famille") {
      setParticipants([{ nom: payerName }, { nom: "" }, { nom: "" }])
    }
  }, [selectedPack, payerName])

  const handleAddParticipant = () => {
    const limits = PACK_PARTICIPANT_COUNTS[selectedPack]
    if (participants.length < limits.max) {
      setParticipants([...participants, { nom: "" }])
    }
  }

  const handleRemoveParticipant = (index: number) => {
    if (index > 0) {
      setParticipants(participants.filter((_, i) => i !== index))
    }
  }

  const handleUpdateParticipant = (index: number, updates: Partial<Participant>) => {
    const updated = [...participants]
    updated[index] = { ...updated[index], ...updates }
    setParticipants(updated)
  }

  const handleCreateReservation = () => {
    // Validation
    if (!payerName || !payerPhone) {
      alert("Veuillez remplir le nom et téléphone du payeur")
      return
    }

    if (participants.some((p, i) => i > 0 && !p.nom)) {
      alert("Veuillez remplir les noms de tous les participants")
      return
    }

    // Create mock reservation
    const newReservation = {
      id: String(Math.floor(Math.random() * 10000)),
      nom: payerName.split(" ")[payerName.split(" ").length - 1],
      prenom: payerName.split(" ")[0],
      telephone: payerPhone,
      email: payerEmail,
      pack: selectedPack,
      prixTotal: PACK_PRICES[selectedPack],
      statut: "en_attente" as const,
      participants: participants.map((p, i) => ({
        nom: p.nom,
        role: i === 0 ? ("Payeur" as const) : ("Participant" as const),
      })),
      paiements: [],
      historique: ["Réservation créée"],
      dateReservation: new Date().toISOString().split("T")[0],
    }

    // Store in mock data (in a real app, send to backend)
    console.log("[v0] New reservation created:", newReservation)

    // Redirect to reservation details
    router.push(`/admin/reservation/${newReservation.id}`)
  }

  if (isLoading || !isAuthenticated) return null

  const limits = PACK_PARTICIPANT_COUNTS[selectedPack]
  const totalPrice = PACK_PRICES[selectedPack]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-secondary rounded-md transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Créer une réservation</h1>
            <p className="text-muted-foreground">Formulaire de création de réservation</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Infos du payeur */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Informations du payeur</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="237 6 70 123 456"
                    className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="jean@example.com"
                    className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Sélection du pack */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Sélection du pack</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(PACK_PRICES).map(([packName, price]) => (
                  <button
                    key={packName}
                    onClick={() => setSelectedPack(packName as PackType)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPack === packName
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-foreground">{packName}</p>
                    <p className="text-sm text-muted-foreground">{price.toLocaleString()} XAF</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Participants */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Participants</h2>
                {participants.length < limits.max && (
                  <button
                    onClick={handleAddParticipant}
                    className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {participants.length} / {limits.max} participants
              </p>

              <div className="space-y-4">
                {participants.map((participant, index) => (
                  <div key={index} className="bg-secondary p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{index === 0 ? "Payeur" : `Participant ${index}`}</p>
                      {index > 0 && (
                        <button
                          onClick={() => handleRemoveParticipant(index)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={participant.nom}
                      onChange={(e) => handleUpdateParticipant(index, { nom: e.target.value })}
                      placeholder="Nom complet"
                      disabled={index === 0}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                    />

                    {(selectedPack === "Famille" || selectedPack === "Stand Entreprise") && index > 0 && (
                      <>
                        <input
                          type="tel"
                          value={participant.telephone || ""}
                          onChange={(e) => handleUpdateParticipant(index, { telephone: e.target.value })}
                          placeholder="Téléphone (optionnel)"
                          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                        />

                        <input
                          type="email"
                          value={participant.email || ""}
                          onChange={(e) => handleUpdateParticipant(index, { email: e.target.value })}
                          placeholder="Email (optionnel)"
                          className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-card border border-border rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Résumé</h2>
              <div className="space-y-4">
                <div className="bg-secondary p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pack:</span>
                    <span className="font-medium text-foreground">{selectedPack}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Participants:</span>
                    <span className="font-medium text-foreground">{participants.length}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-foreground font-semibold">Prix total:</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()} XAF</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCreateReservation}
                    className="w-full px-4 py-3 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium"
                  >
                    Créer réservation
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-colors font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
