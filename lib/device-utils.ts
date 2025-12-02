/**
 * Utilitaire pour détecter le type d'appareil et obtenir les contraintes de caméra appropriées
 */

export function isMobileDevice(): boolean {
  // Détection du user agent pour mobile
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  return mobileRegex.test(userAgent.toLowerCase())
}

export function getFacingMode(): "user" | "environment" {
  // Caméra arrière sur mobile, frontale sur desktop
  return isMobileDevice() ? "environment" : "user"
}

export function getCameraConstraints() {
  return {
    facingMode: getFacingMode(),
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }
}
