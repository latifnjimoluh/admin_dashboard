const CACHE_PREFIX = "admin_cache_"
const CACHE_EXPIRY_KEY = (key: string) => `${CACHE_PREFIX}${key}_expiry`
const CACHE_DATA_KEY = (key: string) => `${CACHE_PREFIX}${key}_data`

export interface CacheOptions {
  expiryTime?: number // in milliseconds, default 5 minutes
}

export const cacheManager = {
  // Set cache with optional expiry time
  set: (key: string, data: any, options?: CacheOptions) => {
    if (typeof window === "undefined") return

    const expiryTime = options?.expiryTime || 5 * 60 * 1000 // 5 minutes default
    const expiresAt = Date.now() + expiryTime

    try {
      localStorage.setItem(CACHE_DATA_KEY(key), JSON.stringify(data))
      localStorage.setItem(CACHE_EXPIRY_KEY(key), String(expiresAt))
    } catch (e) {
      console.warn(`Failed to cache ${key}:`, e)
    }
  },

  // Get cache if not expired
  get: (key: string): any | null => {
    if (typeof window === "undefined") return null

    try {
      const expiresAt = localStorage.getItem(CACHE_EXPIRY_KEY(key))

      if (!expiresAt) return null

      if (Date.now() > Number.parseInt(expiresAt)) {
        cacheManager.remove(key)
        return null
      }

      const data = localStorage.getItem(CACHE_DATA_KEY(key))
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.warn(`Failed to retrieve cache ${key}:`, e)
      return null
    }
  },

  // Check if cache exists and is valid
  has: (key: string): boolean => {
    return cacheManager.get(key) !== null
  },

  // Remove cache
  remove: (key: string) => {
    if (typeof window === "undefined") return
    localStorage.removeItem(CACHE_DATA_KEY(key))
    localStorage.removeItem(CACHE_EXPIRY_KEY(key))
  },

  // Clear all admin cache
  clear: () => {
    if (typeof window === "undefined") return
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  },
}
