"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Eye } from "lucide-react"

interface TicketPreviewProps {
  ticketNumber: string
  qrDataUrl: string
  qrImageUrl?: string
  packName: string
  reservationId: string
  onClose?: () => void
}

export function TicketPreview({
  ticketNumber,
  qrDataUrl,
  qrImageUrl,
  packName,
  reservationId,
  onClose,
}: TicketPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getTemplateImage = (pack: string): string => {
    if (!pack) return "/simple.jpg"
    const name = pack.toLowerCase()
    if (name.includes("vip")) return "/vip.jpg"
    if (name.includes("famille") || name.includes("family")) return "/famille.jpg"
    if (name.includes("couple")) return "/couple.jpg"
    return "/simple.jpg"
  }

  useEffect(() => {
    const generatePreview = async () => {
      if (!canvasRef.current) return

      setIsLoading(true)
      setError(null)

      try {
        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) throw new Error("Could not get canvas context")

        // Load template image
        const templateSrc = getTemplateImage(packName)
        const templateImg = new Image()
        templateImg.crossOrigin = "anonymous"
        templateImg.src = templateSrc

        // Load QR image from data URL
        const qrImg = new Image()
        qrImg.crossOrigin = "anonymous"
        qrImg.src = qrDataUrl

        // Wait for both images to load
        await Promise.all([
          new Promise<void>((resolve, reject) => {
            templateImg.onload = () => resolve()
            templateImg.onerror = () => reject(new Error("Failed to load template image"))
          }),
          new Promise<void>((resolve, reject) => {
            qrImg.onload = () => resolve()
            qrImg.onerror = () => reject(new Error("Failed to load QR code"))
          }),
        ])

        // Setup canvas dimensions based on template
        const width = templateImg.naturalWidth || templateImg.width || 1200
        const height = templateImg.naturalHeight || templateImg.height || 400
        canvasRef.current.width = width
        canvasRef.current.height = height

        // Draw template
        ctx.drawImage(templateImg, 0, 0, width, height)

        // Draw QR code on the right side
        const qrSize = Math.floor(Math.min(width, height) * 0.22)
        const qrX = width - qrSize - Math.floor(width * 0.04)
        const qrY = Math.floor(height * 0.06)
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

        // Draw ticket number box with rounded corners
        const boxWidth = Math.floor(width * 0.36)
        const boxHeight = Math.floor(height * 0.18)
        const boxX = width - boxWidth - Math.floor(width * 0.04)
        const boxY = height - boxHeight - Math.floor(height * 0.06)

        // Draw semi-transparent dark background
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)"
        const radius = Math.floor(boxHeight * 0.15)

        // Rounded rectangle
        ctx.beginPath()
        ctx.moveTo(boxX + radius, boxY)
        ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + boxHeight, radius)
        ctx.arcTo(boxX + boxWidth, boxY + boxHeight, boxX, boxY + boxHeight, radius)
        ctx.arcTo(boxX, boxY + boxHeight, boxX, boxY, radius)
        ctx.arcTo(boxX, boxY, boxX + boxWidth, boxY, radius)
        ctx.closePath()
        ctx.fill()

        // Draw ticket number
        ctx.fillStyle = "#ffffff"
        const fontSize = Math.floor(boxHeight * 0.35)
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(ticketNumber, boxX + boxWidth / 2, boxY + boxHeight / 2 - fontSize * 0.08)

        // Draw reservation ID
        ctx.font = `${Math.floor(boxHeight * 0.18)}px sans-serif`
        ctx.fillText(
          `#${reservationId.slice(0, 8).toUpperCase()}`,
          boxX + boxWidth / 2,
          boxY + boxHeight / 2 + fontSize * 0.6,
        )

        // Generate preview data URL
        const dataUrl = canvasRef.current.toDataURL("image/png")
        setPreviewUrl(dataUrl)
      } catch (err) {
        console.error("[v0] Ticket preview generation error:", err)
        setError(err instanceof Error ? err.message : "Failed to generate ticket preview")
      } finally {
        setIsLoading(false)
      }
    }

    generatePreview()
  }, [ticketNumber, qrDataUrl, packName, reservationId])

  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement("a")
    link.href = previewUrl
    link.download = `ticket_${ticketNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Canvas for rendering (hidden) */}
      <canvas ref={canvasRef} style={{ display: "none" }} className="max-w-full" />

      {/* Preview or loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64 bg-secondary rounded-lg">
          <div className="text-center">
            <div className="animate-spin mb-2">
              <Eye className="w-8 h-8 mx-auto text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Generating preview...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive font-medium">Error: {error}</p>
        </div>
      ) : previewUrl ? (
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden bg-secondary/50">
            <img src={previewUrl || "/placeholder.svg"} alt="Ticket Preview" className="w-full h-auto" />
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PNG Ticket
          </button>
        </div>
      ) : null}
    </div>
  )
}
