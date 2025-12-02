"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

interface Pack {
  id: string
  name: string
  price: number
  description: string
  capacity: number
}

interface Participant {
  name: string
  email?: string
  phone?: string
}

export default function CreateReservationPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [packs, setPacks] = useState<Pack[]>([])
  const [payerName, setPayerName] = useState("")
  const [payerPhone, setPayerPhone] = useState("")
  const [payerEmail, setPayerEmail] = useState("")
  const [selectedPackId, setSelectedPackId] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [capacityMax, setCapacityMax] = useState<number>(1)
  const [participants, setParticipants] = useState<Participant[]>([{ name: "" }])

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      loadPacks()
    }
  }, [router])

  // Quand le pack sélectionné change, récupérer la quantité par défaut depuis le pack (capacity)
  useEffect(() => {
    const selected = packs.find((p) => p.id === selectedPackId)
    if (selected) {
      setCapacityMax(selected.capacity ?? 1)
      // ne pas forcer la quantité réservée ici ; la quantité réelle envoyée sera le nombre de participants
    }
  }, [selectedPackId, packs])

  useEffect(() => {
    // Synchroniser le premier participant avec le payeur
    setParticipants((prev) => [{ name: payerName, email: payerEmail, phone: payerPhone }, ...prev.slice(1)])
  }, [payerName, payerEmail, payerPhone])

  // Quand la quantité change: ne pas pré-remplir les nouveaux slots,
  // mais tronquer la liste si la quantité diminue.
  useEffect(() => {
    setParticipants((prev) => {
      const arr = [...prev]
      if (arr.length === 0) arr.push({ name: payerName })
      if (arr.length > capacityMax) return arr.slice(0, capacityMax)
      return arr
    })
  }, [capacityMax, payerName])

  const loadPacks = async () => {
    try {
      const response = await api.packs.getAll("?is_active=true")

      if (response.status === 200) {
        const packsList = Array.isArray(response.data) ? response.data : response.data?.packs || []
        setPacks(packsList)
        if (packsList.length > 0) {
          setSelectedPackId(packsList[0].id)
        }
      }
    } catch (err) {
      console.error("Error loading packs:", err)
      setError("Erreur lors du chargement des packs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddParticipant = () => {
    setParticipants((prev) => {
      if (prev.length >= capacityMax) return prev
      return [...prev, { name: "" }]
    })
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

  const handleCreateReservation = async () => {
    // Validation
    const reservedSeats = Math.max(1, participants.length)

    if (!payerName || !payerPhone) {
      setError("Veuillez remplir le nom et téléphone du payeur")
      return
    }

    if (!selectedPackId) {
      setError("Veuillez sélectionner un pack")
      return
    }

    if (reservedSeats > capacityMax) {
      setError("Le nombre de participants dépasse la capacité du pack")
      return
    }

    if (reservedSeats > 1 && participants.slice(0, reservedSeats).some((p, i) => i > 0 && !p.name)) {
      setError("Veuillez remplir les noms de tous les participants")
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const reservationData = {
        payeur_name: payerName,
        payeur_phone: payerPhone,
        payeur_email: payerEmail || undefined,
        pack_id: selectedPackId,
        // envoyer le nombre réel de places réservées
        quantity: reservedSeats,
        participants: participants
          .slice(0, reservedSeats)
          .map((p) => ({
            name: p.name,
            email: p.email,
            phone: p.phone,
          })),
      }

      const result = await api.reservations.create(reservationData)

      if (result.status === 201 && result.data?.reservation?.id) {
        router.push(`/admin/reservation/${result.data.reservation.id}`)
      } else {
        setError(result.message || "Erreur lors de la création de la réservation")
      }
    } catch (err: any) {
      console.error("Error creating reservation:", err)
      setError(err.message || "Erreur lors de la création de la réservation")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AdminLayout>
    )
  }

  const selectedPack = packs.find((p) => p.id === selectedPackId)
  // Le prix est fixe pour le pack, il ne change pas selon le nombre de participants
  const totalPrice = selectedPack ? selectedPack.price : 0
  // Nombre de places réservées = nombre d'entrées participants (au moins 1: le payeur)
  const reservedSeats = Math.max(1, participants.length)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Retour"
            title="Retour"
            className="p-2 hover:bg-secondary rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Créer une réservation</h1>
            <p className="text-muted-foreground">Formulaire de création de réservation</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

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
                    placeholder="nom complet"
                    className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="237672475691"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    placeholder="latifnjimoluh@gmail.com"
                    className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Sélection du pack */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Sélection du pack</h2>
              {packs.length === 0 ? (
                <p className="text-muted-foreground">Aucun pack disponible</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {packs.map((pack) => (
                      <button
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedPackId === pack.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold text-foreground">{pack.name}</p>
                        <p className="text-sm text-muted-foreground">{pack.price.toLocaleString()} XAF</p>
                        {pack.description && <p className="text-xs text-muted-foreground mt-1">{pack.description}</p>}
                      </button>
                    ))}
                  </div>

                  {selectedPack && (
                    <div className="bg-secondary p-4 rounded-lg">
                      <label className="block text-sm font-medium text-foreground mb-2">Capacité (max)</label>
                      <input
                        type="number"
                        min={1}
                        value={capacityMax}
                        readOnly
                        disabled
                        aria-label="Capacité maximale du pack"
                        className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground disabled:opacity-70"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Participants - affichée quand un pack est sélectionné */}
            {selectedPack && (
              <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Participants</h2>
                  <button
                    onClick={handleAddParticipant}
                    disabled={participants.length >= capacityMax}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                      participants.length >= capacityMax
                        ? "opacity-50 cursor-not-allowed bg-secondary text-muted-foreground"
                        : "bg-primary hover:bg-accent text-primary-foreground"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-4">{participants.length}/{capacityMax} participants</p>

                <div className="space-y-4">
                  {participants.map((participant, index) => (
                    <div key={index} className="bg-secondary p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">
                          {index === 0 ? "Payeur" : `Participant ${index}`}
                        </p>
                        {index > 0 && (
                          <button
                            onClick={() => handleRemoveParticipant(index)}
                            aria-label={`Retirer participant ${index}`}
                            title={`Retirer participant ${index}`}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={participant.name}
                        onChange={(e) => handleUpdateParticipant(index, { name: e.target.value })}
                        placeholder="nom complet"
                        disabled={index === 0}
                        className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                      />

                      <input
                        type="email"
                        value={participant.email || ""}
                        onChange={(e) => handleUpdateParticipant(index, { email: e.target.value })}
                        placeholder="latifnjimoluh@gmail.com"
                        className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                      />

                      <input
                        type="tel"
                        value={participant.phone || ""}
                        onChange={(e) => handleUpdateParticipant(index, { phone: e.target.value.replace(/\D/g, "").slice(0, 12) })}
                        placeholder="237672475691"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={12}
                        className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {/* Price Summary */}
            <div className="bg-card border border-border rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Résumé</h2>
              <div className="space-y-4">
                {/* Infos Payeur */}
                <div className="bg-secondary/50 p-4 rounded-lg space-y-2 border border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Payeur</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{payerName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{payerPhone || "—"}</p>
                    {payerEmail && <p className="text-xs text-muted-foreground">{payerEmail}</p>}
                  </div>
                </div>

                {/* Infos Pack */}
                <div className="bg-secondary p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pack:</span>
                    <span className="font-medium text-foreground">{selectedPack?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Places réservées:</span>
                    <span className="font-medium text-foreground">{reservedSeats}/{capacityMax}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="text-foreground font-semibold">Prix (par pack):</span>
                    <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()} XAF</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCreateReservation}
                    disabled={isSaving || !selectedPack}
                    className="w-full px-4 py-3 bg-primary hover:bg-accent text-primary-foreground rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Création..." : "Créer réservation"}
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