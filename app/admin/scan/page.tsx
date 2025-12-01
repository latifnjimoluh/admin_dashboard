"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Participant {
  id: number
  nom: string
  scanned: boolean
}

interface ScannedTicket {
  id_ticket: string
  pack: string
  participants: Participant[]
  places_max: number
  places_used: number
}

export default function ScanPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [scannedTicket, setScannedTicket] = useState<ScannedTicket | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
    } else {
      setIsAuthenticated(true)
      setIsLoading(false)
    }
  }, [router])

  const mockTicketData: ScannedTicket = {
    id_ticket: "ABC12345",
    pack: "Famille",
    participants: [
      { id: 1, nom: "John Doe", scanned: false },
      { id: 2, nom: "Marie Doe", scanned: true },
      { id: 3, nom: "Junior Doe", scanned: false },
    ],
    places_max: 5,
    places_used: 1,
  }

  const handleScanQR = () => {
    setErrorMessage("")
    setSuccessMessage("")
    setScannedTicket(mockTicketData)
    setSelectedParticipant(null)
  }

  const handleValidateParticipant = (participantId: number) => {
    if (!scannedTicket) return

    const participant = scannedTicket.participants.find((p) => p.id === participantId)
    if (!participant) return

    if (participant.scanned) {
      setErrorMessage("Ce participant a déjà été scanné")
      return
    }

    if (scannedTicket.places_used >= scannedTicket.places_max) {
      setErrorMessage("Tous les participants ont été validés")
      return
    }

    const updatedParticipants = scannedTicket.participants.map((p) =>
      p.id === participantId ? { ...p, scanned: true } : p,
    )

    const newPlacesUsed = scannedTicket.places_used + 1
    const isComplete = newPlacesUsed === scannedTicket.places_max

    setScannedTicket({
      ...scannedTicket,
      participants: updatedParticipants,
      places_used: newPlacesUsed,
    })

    setSuccessMessage(`${participant.nom} a été validé(e)`)
    setSelectedParticipant(null)

    if (isComplete) {
      setTimeout(() => setScannedTicket(null), 2000)
    }
  }

  if (isLoading || !isAuthenticated) return null

  const getStatusBadge = (isComplete: boolean, placesUsed: number, placesMax: number) => {
    if (isComplete) return { label: "COMPLET", color: "bg-green-600 text-white" }
    if (placesUsed > 0) return { label: "PARTIELLEMENT UTILISÉ", color: "bg-orange-600 text-white" }
    return { label: "VALIDÉ", color: "bg-blue-600 text-white" }
  }

  const isComplete = scannedTicket ? scannedTicket.places_used === scannedTicket.places_max : false
  const status = scannedTicket ? getStatusBadge(isComplete, scannedTicket.places_used, scannedTicket.places_max) : null

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contrôle d'entrée</h1>
          <p className="text-muted-foreground">Scannez les QR codes des tickets pour valider les entrées</p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Main Content */}
        {!scannedTicket ? (
          <div className="bg-card border border-border rounded-lg p-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium text-center">Cliquez pour scanner un QR code</p>
              <button
                onClick={handleScanQR}
                className="mt-4 px-6 py-3 bg-primary hover:bg-accent text-primary-foreground rounded-lg font-medium transition-colors"
              >
                Scanner un QR code
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ticket Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket ID</p>
                  <p className="text-lg font-mono font-bold text-foreground">{scannedTicket.id_ticket}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${status?.color}`}>{status?.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Pack</p>
                  <p className="text-foreground font-medium">{scannedTicket.pack}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Places utilisées</p>
                  <p className="text-foreground font-medium">
                    {scannedTicket.places_used} / {scannedTicket.places_max}
                  </p>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Participants</h2>
              <div className="space-y-3">
                {scannedTicket.participants.map((participant) => (
                  <div
                    key={participant.id}
                    onClick={() => !participant.scanned && setSelectedParticipant(participant.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedParticipant === participant.id
                        ? "border-primary bg-primary/5"
                        : participant.scanned
                          ? "border-border bg-secondary"
                          : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">{participant.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {participant.scanned ? "Entrée validée" : "Non encore scanné"}
                        </p>
                      </div>
                      <div>
                        {participant.scanned ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    </div>

                    {selectedParticipant === participant.id && (
                      <button
                        onClick={() => handleValidateParticipant(participant.id)}
                        className="mt-4 w-full px-4 py-2 bg-primary hover:bg-accent text-primary-foreground rounded-md font-medium transition-colors text-sm"
                      >
                        Valider entrée de {participant.nom}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setScannedTicket(null)
                setSelectedParticipant(null)
                setErrorMessage("")
                setSuccessMessage("")
              }}
              className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors"
            >
              Retour au scan
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
