"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Camera, CheckCircle, XCircle, AlertCircle } from "lucide-react"
// import QRScanner from "@/components/qr/QRScanner"
import { api } from "@/lib/api"
import { isMobileDevice, getFacingMode } from "@/lib/device-utils"
import QRScanner from "@/components/qr/QRScanner"


interface Participant {
  id: number
  nom: string
  scanned: boolean
}

interface ScannedTicket {
  ticket_number: string
  pack: string
  participants: Participant[]
  places_max: number
  places_used: number
}

export default function ScanPage() {
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [scannedTicket, setScannedTicket] = useState<ScannedTicket | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null)

  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  /* =====================================
          AUTH CHECK & DEVICE DETECTION
  ====================================== */
  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    setIsMobile(isMobileDevice())
    const cameraType = getFacingMode()
    console.log("[v0] Device mobile:", isMobileDevice(), "| Caméra:", cameraType)

    setIsAuthenticated(true)
    setIsLoading(false)
  }, [router])

  /* =====================================
          HANDLE QR SCAN
  ====================================== */
const handleScan = async (qr: string) => {
  setErrorMessage("")
  setSuccessMessage("")

  console.log("[SCAN RAW]", qr)

  try {
    const res = await api.scan.jwtValidate(qr)
    const ticket = res.data

    console.log("=== TICKET DECODÉ ===")
    console.log(ticket)

    const formatted: ScannedTicket = {
      ticket_number: ticket.ticket_number,
      pack: ticket.reservation.pack_name,
      participants: ticket.participants.map((p: any) => ({
        id: p.id,
        nom: `${p.firstname} ${p.lastname}`,
        scanned: p.scanned,
      })),
      places_max: ticket.reservation.places_max,
      places_used: ticket.participants.filter((p: any) => p.scanned).length,
    }

    setScannedTicket(formatted)
    setCameraActive(false)
  } catch (err: any) {
    console.log("=== ERREUR SCAN ===")
    console.log(err?.data || err)

    setErrorMessage(err?.data?.message || "QR code invalide")
    setCameraActive(true)
  }
}


  /* =====================================
          VALIDATE PARTICIPANT
  ====================================== */
const handleValidateParticipant = async (participantId: number) => {
  if (!scannedTicket) return;

  try {
    await api.scan.validate({
      ticket_number: scannedTicket.ticket_number,
      participant_id: participantId, // ← FIX OBLIGATOIRE
    });

    const updated = scannedTicket.participants.map((p) =>
      p.id === participantId ? { ...p, scanned: true } : p,
    );

    setScannedTicket({
      ...scannedTicket,
      participants: updated,
      places_used: scannedTicket.places_used + 1,
    });

    setSuccessMessage("Entrée validée");
    setSelectedParticipant(null);
  } catch (err: any) {
    setErrorMessage(err?.data?.message || "Erreur de validation");
  }
};


  if (isLoading || !isAuthenticated) return null

  const isComplete = scannedTicket && scannedTicket.places_used >= scannedTicket.places_max

  const getStatusBadge = () => {
    if (!scannedTicket) return { label: "", color: "" }
    if (isComplete) return { label: "COMPLET", color: "bg-green-600 text-white" }
    if (scannedTicket.places_used > 0) return { label: "PARTIEL", color: "bg-orange-600 text-white" }
    return { label: "VALIDE", color: "bg-blue-600 text-white" }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contrôle d'entrée</h1>
            <p className="text-muted-foreground">Scannez un ticket pour valider l'entrée</p>
          </div>
          <div className="text-xs bg-muted px-3 py-1 rounded-full">
            📷 {isMobile ? "Caméra arrière" : "Caméra frontale"}
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-300 rounded-lg flex gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {cameraActive && (
          <div className="bg-black rounded-lg p-2">
            <QRScanner onScan={handleScan} />
          </div>
        )}

        {!cameraActive && !scannedTicket && (
          <div className="bg-card border border-border p-10 rounded-xl text-center">
            <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
            <button
              className="px-6 py-3 bg-primary text-white rounded-lg"
              onClick={() => {
                setScannedTicket(null)
                setCameraActive(true)
              }}
            >
              Scanner un QR code
            </button>
          </div>
        )}

        {scannedTicket && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Numéro du ticket</p>
                  <p className="font-bold text-xl">{scannedTicket.ticket_number}</p>
                </div>

                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge().color}`}>
                  {getStatusBadge().label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-muted-foreground text-sm">Pack</p>
                  <p className="font-medium">{scannedTicket.pack}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Entrées</p>
                  <p className="font-medium">
                    {scannedTicket.places_used} / {scannedTicket.places_max}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-3">Participants</h2>

              {scannedTicket.participants.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 mb-3 rounded-lg border ${
                    p.scanned ? "bg-green-50 border-green-300" : "cursor-pointer hover:border-primary"
                  }`}
                  onClick={() => !p.scanned && setSelectedParticipant(p.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{p.nom}</p>
                      <p className="text-sm text-muted-foreground">{p.scanned ? "Entrée validée" : "Non scanné"}</p>
                    </div>
                    {p.scanned ? (
                      <CheckCircle className="text-green-600 w-6 h-6" />
                    ) : (
                      <XCircle className="text-red-600 w-6 h-6" />
                    )}
                  </div>

                  {selectedParticipant === p.id && (
                    <button
                      className="mt-3 w-full py-2 bg-primary text-white rounded-md"
                      onClick={() => handleValidateParticipant(p.id)}
                    >
                      Valider {p.nom}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className="w-full py-3 rounded-lg bg-secondary hover:bg-secondary/80"
              onClick={() => {
                setScannedTicket(null)
                setCameraActive(true)
                setSelectedParticipant(null)
                setErrorMessage("")
                setSuccessMessage("")
              }}
            >
              Scanner un autre ticket
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
