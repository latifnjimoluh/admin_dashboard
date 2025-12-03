"use client"

import { useEffect, useRef } from "react"
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode"

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onError?: (err: any) => void
  elementId?: string
  fps?: number
  qrbox?: number
  facingMode?: "user" | "environment"
}

export default function QRScanner({
  onScan,
  onError,
  elementId = "qr-reader",
  fps = 10,
  qrbox = 250,
  facingMode = "environment",
}: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // safety: only run in browser
    if (typeof window === "undefined") return

    const config = {
      fps,
      qrbox: { width: qrbox, height: qrbox },
      rememberLastUsedCamera: true,
      // use camera directly (preferred)
      qrRegion: undefined,
      aspectRatio: 1.777778,
      experimentalFeatures: { useBarCodeDetectorIfSupported: false },
    }

    const scanner = new Html5QrcodeScanner(
      elementId,
      config,
      /* verbose */ false
    )

    // store ref so we can clear later
    scannerRef.current = scanner

    const success = (decodedText: string) => {
      try {
        // stop scanning immediately to avoid duplicates
        scanner.clear().catch(() => {})
      } catch {
        // ignore
      }
      onScan(decodedText)
    }

    const failure = (err: any) => {
      if (onError) onError(err)
      // do not stop scanner on each error
    }

    // render scanner
    try {
      scanner.render(success, failure)
    } catch (err) {
      if (onError) onError(err)
    }

    return () => {
      // cleanup
      try {
        scanner.clear().catch(() => {})
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
  }, [elementId, fps, qrbox, onScan, onError, facingMode])

  return <div id={elementId} className="w-full" />
}
