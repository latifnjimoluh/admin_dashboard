"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { CheckCircle, XCircle, AlertCircle, Loader2, RotateCcw, Smartphone, Upload } from "lucide-react"
import { api } from "@/lib/api"
import { getCameraConstraints } from "@/lib/device-utils"
import QrScanner from "qr-scanner"

interface Participant {
  id: string
  name: string
  phone: string
  email?: string
  ticket_id?: string
  entrance_validated: boolean
}

interface Ticket {
  id: string
  reservation_id: string
  ticket_number: string
  qr_payload: string
  qr_image_url: string
  pdf_url: string
  status: string
  generated_by: string
  generated_at: string
}

interface Reservation {
  id: string
  payeur_name: string
  payeur_phone: string
  payeur_email: string
  pack_id: string
  pack_name_snapshot: string
  unit_price: number
  quantity: number
  total_price: number
  total_paid: number
  remaining_amount: number
  status: string
  participants: Participant[]
}

interface ScannedData {
  ticket: Ticket
  reservation: Reservation
}

type PageState = "initial" | "camera" | "import" | "ticket" | "validate-participant"

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pageState, setPageState] = useState<PageState>("initial")
  const [scannedData, setScannedData] = useState<ScannedData | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [importValue, setImportValue] = useState("")
  const [isImporting, setIsImporting] = useState(false)

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
    if (!videoRef.current || !cameraActive || pageState !== "camera") return

    const initScanner = async () => {
      try {
        const constraints = {
          video: getCameraConstraints(),
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        videoRef.current!.srcObject = stream

        qrScannerRef.current = new QrScanner(videoRef.current!, handleQrDetected, {
          onDecodeError: () => {
            // Silent fail - continue scanning
          },
          maxScansPerSecond: 5,
        })

        await qrScannerRef.current.start()
      } catch (err) {
        console.error("[v0] Camera initialization error:", err)
        setErrorMessage("Impossible d'accéder à la caméra. Vérifiez les permissions.")
      }
    }

    initScanner()

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [cameraActive, pageState])

  const getUserFriendlyErrorMessage = (err: any): string => {
    if (err?.message?.includes("Invalid QR payload")) {
      return "Code QR invalide - Vérifiez le format du code"
    }
    if (err?.message?.includes("Route not found") || err?.status === 404) {
      return "Ticket introuvable - Ce ticket n'existe pas dans le système"
    }
    if (err?.data?.message?.includes("invalid") || err?.message?.includes("invalid")) {
      return "Ticket invalide - Le ticket n'est pas valide"
    }
    if (err?.message?.includes("already")) {
      return "Ticket déjà scanné - Cet entrée a déjà été validée"
    }
    if (err?.status === 400) {
      return "Erreur du code QR - Format non reconnu"
    }
    return err?.message || "Erreur lors du scan du QR code"
  }

  const handleQrDetected = async (data: QrScanner.ScanResult) => {
    if (isScanning) return
    setIsScanning(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      console.log("[v0] QR detected, sending to API:", data.data)
      const response = await api.scan.decode(data.data)

      console.log("[v0] Decode response:", response)

      if (response.data) {
        setScannedData(response.data)
        setPageState("ticket")
        setCameraActive(false)

        if (qrScannerRef.current) {
          await qrScannerRef.current.stop()
        }
      }
    } catch (err: any) {
      console.error("[v0] Error decoding QR:", err)
      setErrorMessage(getUserFriendlyErrorMessage(err))
    } finally {
      setIsScanning(false)
    }
  }

  const handleImportTicket = async () => {
    if (!importValue.trim()) {
      setErrorMessage("Veuillez entrer un numéro de ticket")
      return
    }

    setIsImporting(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      console.log("[v0] Importing ticket:", importValue)
      const response = await api.scan.search(importValue.trim())

      console.log("[v0] Import response:", response)

      if (response.data) {
        setScannedData(response.data)
        setPageState("ticket")
        setImportValue("")
      }
    } catch (err: any) {
      console.error("[v0] Error importing ticket:", err)
      setErrorMessage(getUserFriendlyErrorMessage(err))
    } finally {
      setIsImporting(false)
    }
  }

  const handleValidateParticipant = async (participantId: string, participantName: string) => {
    if (!scannedData) return

    try {
      setErrorMessage("")
      setSuccessMessage("")

      const response = await api.scan.validate({
        ticket_number: scannedData.ticket.ticket_number,
        participant_id: participantId as any,
      })

      console.log("[v0] Validation response:", response)

      setSuccessMessage(`${participantName} a été validé(e) ✓`)
      setSelectedParticipantId(null)

      if (scannedData.reservation) {
        const updatedParticipants = scannedData.reservation.participants.map((p) =>
          p.id === participantId ? { ...p, entrance_validated: true } : p,
        )
        setScannedData({
          ...scannedData,
          reservation: {
            ...scannedData.reservation,
            participants: updatedParticipants,
          },
        })
      }

      setTimeout(() => {
        resetToCamera()
      }, 2000)
    } catch (err: any) {
      console.error("[v0] Error validating participant:", err)
      setErrorMessage(err.message || "Erreur lors de la validation")
    }
  }

  const resetToCamera = () => {
    setPageState("initial")
    setScannedData(null)
    setSelectedParticipantId(null)
    setErrorMessage("")
    setSuccessMessage("")
    setCameraActive(false)
    setImportValue("")
  }

  const handleStartScanning = () => {
    setErrorMessage("")
    setPageState("camera")
    setCameraActive(true)
  }

  const handleCancelScanning = () => {
    setCameraActive(false)
    setPageState("initial")
    setErrorMessage("")
  }

  const handleShowImport = () => {
    setErrorMessage("")
    setPageState("import")
  }

  if (isLoading || !isAuthenticated) return null

  const validatedCount = scannedData?.reservation.participants.filter((p) => p.entrance_validated).length || 0
  const totalCount = scannedData?.reservation.participants.length || 0

  const ticketStatus =
    validatedCount === totalCount && totalCount > 0 ? "Complet" : validatedCount > 0 ? "PARTIELLEMENT UTILISÉ" : null

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
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

        {pageState === "initial" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Prêt à scanner</h2>
                <p className="text-muted-foreground">Choisissez une méthode pour vérifier les tickets</p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={handleStartScanning}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-5 h-5" />
                  Scanner le code QR
                </button>
                <button
                  onClick={handleShowImport}
                  className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Importer un ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Scanner View */}
        {pageState === "camera" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="relative w-full bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-yellow-400 rounded-lg opacity-50"></div>
              </div>
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <p className="text-foreground font-medium text-center">
                {isScanning ? "Traitement du scan..." : "Pointez la caméra sur le QR code"}
              </p>
              <button
                onClick={handleCancelScanning}
                disabled={isScanning}
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {pageState === "import" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Importer un ticket</h2>
                <p className="text-muted-foreground">Entrez le numéro du ticket ou collez le code QR</p>
              </div>
              <input
                ref={importInputRef}
                type="text"
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleImportTicket()}
                placeholder="Ex: MIP-MIOGK08P-COVWOW"
                className="w-full max-w-xs px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isImporting}
                autoFocus
              />
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={handleImportTicket}
                  disabled={isImporting || !importValue.trim()}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Importer
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelScanning}
                  className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-semibold transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Details View */}
        {pageState === "ticket" && scannedData && (
          <div className="space-y-6">
            {/* Ticket Info Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket</p>
                  <p className="text-lg font-mono font-bold text-foreground">{scannedData.ticket.ticket_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Pack</p>
                  <p className="text-lg font-semibold text-foreground">{scannedData.reservation.pack_name_snapshot}</p>
                </div>
              </div>

              {ticketStatus && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Statut: {ticketStatus}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Commanditaire</p>
                  <p className="text-foreground font-medium">{scannedData.reservation.payeur_name}</p>
                  <p className="text-xs text-muted-foreground">{scannedData.reservation.payeur_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participants validés</p>
                  <p className="text-foreground font-bold text-lg">
                    {validatedCount} / {totalCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Participants</h2>
              <div className="space-y-3">
                {scannedData.reservation.participants.map((participant) => (
                  <div
                    key={participant.id}
                    onClick={() => !participant.entrance_validated && setSelectedParticipantId(participant.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedParticipantId === participant.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : participant.entrance_validated
                          ? "border-green-300 bg-green-50"
                          : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-foreground font-medium">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">{participant.phone}</p>
                        {participant.email && <p className="text-xs text-muted-foreground">{participant.email}</p>}
                      </div>
                      {participant.entrance_validated ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Validate Button */}
                    {selectedParticipantId === participant.id && !participant.entrance_validated && (
                      <button
                        onClick={() => handleValidateParticipant(participant.id, participant.name)}
                        className="mt-4 w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium transition-colors text-sm"
                      >
                        Valider l'entrée
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={resetToCamera}
              className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retour au scan
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
