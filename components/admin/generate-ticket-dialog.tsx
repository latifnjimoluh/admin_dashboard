"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { downloadUtils } from "@/lib/mobile-download"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TicketPreview } from "./ticket-preview"
import { AlertCircle, CheckCircle2, Download, ImageIcon } from "lucide-react"

interface GenerateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservationId: string
  packName: string
  onSuccess?: () => void
}

interface TicketResponse {
  ticket: {
    id: string
    ticket_number: string
    qr_data_url: string
    qr_image_url?: string
    pdf_url?: string
    status: string
    generated_at: string
  }
  reservation: {
    id: string
    status: string
  }
}

export function GenerateTicketDialog({
  open,
  onOpenChange,
  reservationId,
  packName,
  onSuccess,
}: GenerateTicketDialogProps) {
  const [step, setStep] = useState<"confirm" | "generating" | "preview" | "error">("confirm")
  const [ticketData, setTicketData] = useState<TicketResponse["ticket"] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloadLoading, setDownloadLoading] = useState<"pdf" | "image" | null>(null)

  const handleGenerate = async () => {
    setStep("generating")
    setError(null)

    try {
      const response = (await api.tickets.generate(reservationId)) as TicketResponse

      if (!response.ticket) {
        throw new Error("Invalid response from server")
      }

      setTicketData(response.ticket)
      setStep("preview")
      onSuccess?.()
    } catch (err) {
      console.error("[v0] Ticket generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate ticket")
      setStep("error")
    }
  }

  const handleDownloadPDF = async () => {
    if (!ticketData) return

    setDownloadLoading("pdf")
    try {
      const { blob, filename } = await api.tickets.downloadPDF(ticketData.id)

      if (!blob || blob.size === 0) {
        throw new Error("PDF file is empty or invalid")
      }

      await downloadUtils.smartDownload(blob, filename || `ticket-${ticketData.ticket_number}.pdf`, "pdf")
    } catch (err) {
      console.error("[v0] PDF download error:", err)
      setError(err instanceof Error ? err.message : "Failed to download PDF")
    } finally {
      setDownloadLoading(null)
    }
  }

  const handleDownloadImage = async () => {
    if (!ticketData) return

    setDownloadLoading("image")
    try {
      const { blob, filename } = await api.tickets.downloadImage(ticketData.id)

      if (!blob || blob.size === 0) {
        throw new Error("Image file is empty or invalid")
      }

      await downloadUtils.smartDownload(blob, filename || `qr-${ticketData.ticket_number}.png`, "image")
    } catch (err) {
      console.error("[v0] Image download error:", err)
      setError(err instanceof Error ? err.message : "Failed to download image")
    } finally {
      setDownloadLoading(null)
    }
  }

  const handleClose = () => {
    setStep("confirm")
    setTicketData(null)
    setError(null)
    setDownloadLoading(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "confirm" && "Generate Ticket"}
            {step === "generating" && "Generating Ticket..."}
            {step === "preview" && "Ticket Generated Successfully"}
            {step === "error" && "Ticket Generation Failed"}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm" && "This will generate a ticket with QR code for this reservation"}
            {step === "generating" && "Please wait while we generate your ticket..."}
            {step === "preview" && "Your ticket is ready. Download or share the PDF."}
            {step === "error" && "Something went wrong. Please try again."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "confirm" && (
            <p className="text-sm text-muted-foreground">
              This action will create a ticket with a unique QR code for this reservation. The ticket will be marked as
              generated in the system.
            </p>
          )}

          {step === "generating" && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
              <span className="ml-3 text-muted-foreground">Generating ticket...</span>
            </div>
          )}

          {step === "preview" && ticketData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Ticket <strong>{ticketData.ticket_number}</strong> generated successfully!
                </p>
              </div>

              <TicketPreview
                ticketNumber={ticketData.ticket_number}
                qrDataUrl={ticketData.qr_data_url}
                qrImageUrl={ticketData.qr_image_url}
                packName={packName}
                reservationId={reservationId}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Download Options:</p>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadLoading === "pdf"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {downloadLoading === "pdf" ? "Downloading..." : "Download PDF"}
                  </button>
                  <p className="text-xs text-muted-foreground">For iPhone: Tap download to save to Files app</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">QR Code:</p>
                  <button
                    onClick={handleDownloadImage}
                    disabled={downloadLoading === "image"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {downloadLoading === "image" ? "Downloading..." : "Save QR Code"}
                  </button>
                  <p className="text-xs text-muted-foreground">For Android: Saves to gallery automatically</p>
                </div>
              </div>
            </div>
          )}

          {step === "error" && error && (
            <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Generation Failed</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate}>Generate Ticket</Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}

          {step === "error" && (
            <>
              <Button variant="outline" onClick={() => setStep("confirm")}>
                Back
              </Button>
              <Button onClick={handleGenerate}>Try Again</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
