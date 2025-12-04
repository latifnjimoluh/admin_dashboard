// Mobile download utilities for iOS and Android

export const downloadUtils = {
  /**
   * Download file with proper headers for mobile devices
   * Uses Blob URL for client-side force download
   */
  async downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"

    document.body.appendChild(link)
    link.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  },

  /**
   * iOS-specific: Save to Files app
   * Uses standard download mechanism that triggers share menu
   */
  iosSaveToFiles(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename

    // Force download vs opening
    a.setAttribute("download", filename)

    document.body.appendChild(a)
    a.click()

    // Revoke after a delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  },

  /**
   * Android-specific: Save image to gallery
   * For images, Android browsers will prompt to save to gallery
   */
  async androidSaveToGallery(blob: Blob, filename: string) {
    // For images on Android, use standard download
    // Android will prompt user to save to gallery
    this.downloadBlob(blob, filename)
  },

  /**
   * Universal download with device detection
   * Improved device detection and proper blob handling
   */
  async smartDownload(blob: Blob, filename: string, type: "pdf" | "image" = "pdf") {
    if (!blob || !(blob instanceof Blob)) {
      console.error("[v0] Invalid blob provided to smartDownload")
      throw new Error("Invalid blob provided")
    }

    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua) && !/windows phone/.test(ua)
    const isAndroid = /android/.test(ua)

    if (isIOS) {
      // iOS: Use Files app save option
      this.iosSaveToFiles(blob, filename)
    } else if (isAndroid && type === "image") {
      // Android: Download image (will prompt to save to gallery)
      this.androidSaveToGallery(blob, filename)
    } else {
      // Desktop or generic fallback
      this.downloadBlob(blob, filename)
    }
  },
}
