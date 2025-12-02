"use client"

import { useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface Props {
  onScan: (decoded: string) => void
}

export default function QRScanner({ onScan }: Props) {
  useEffect(() => {
    const elementId = "qr-reader"
    const scanner = new Html5Qrcode(elementId)

    let isMounted = true

    async function start() {
      try {
        // 🔥 1) Lister les caméras pour choisir la meilleure.
        const devices = await Html5Qrcode.getCameras()

        if (!devices || devices.length === 0) {
          console.error("Aucune caméra trouvée")
          return
        }

        // 🔥 2) Choisir la caméra arrière quand elle existe
        let cameraId = devices[0].id
        for (const cam of devices) {
          if (cam.label.toLowerCase().includes("back")) {
            cameraId = cam.id
          }
        }

        await scanner.start(
          { deviceId: cameraId },
          {
            fps: 12,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.777,
            disableFlip: false, // important pour caméra frontale
          },
          (decoded) => {
            if (!isMounted) return

            if (scanner._isScanning) {
              scanner.stop().catch(() => {})
            }

            onScan(decoded)
          },
          () => {}
        )
      } catch (err) {
        console.error("Erreur caméra :", err)
      }
    }

    start()

    return () => {
      isMounted = false
      if (scanner._isScanning) {
        scanner.stop().catch(() => {})
      }
    }
  }, [onScan])

  return <div id="qr-reader" className="w-full h-auto rounded-lg"></div>
}
