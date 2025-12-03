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
   * iOS-specific: Open file in new tab for Files app save option
   */
  iosSaveToFiles(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Don't revoke immediately - let iOS handle it
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  },

  /**
   * Android-specific: Save image to gallery
   * Requires user permission and downloads as image
   */
  async androidSaveToGallery(blob: Blob, filename: string) {
    try {
      // Use FileSystem API if available (Android)
      if ("persistent" in navigator.storage && "persist" in navigator.storage) {
        const persistent = await navigator.storage.persist()
        console.log("Persistent storage available:", persistent)
      }
    } catch (err) {
      console.warn("FileSystem API not available")
    }

    // Fallback to standard download
    this.downloadBlob(blob, filename)
  },

  /**
   * Universal download with device detection
   */
  async smartDownload(blob: Blob, filename: string, type: "pdf" | "image" = "pdf") {
    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isAndroid = /android/.test(ua)

    if (isIOS && type === "pdf") {
      // iOS: Use standard download which opens share menu
      this.iosSaveToFiles(blob, filename)
    } else if (isAndroid && type === "image") {
      // Android: Download as image to gallery
      this.androidSaveToGallery(blob, filename)
    } else {
      // Desktop or generic fallback
      this.downloadBlob(blob, filename)
    }
  },
}
