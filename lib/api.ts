"use client"

const BASE_URL = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3001/api"

// ---------------- TYPES ----------------
interface ApiResponse<T = any> {
  status: number
  message: string
  data?: T
}

// ---------------- TOKEN MANAGEMENT ----------------
function getAccessToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("admin_token")
}

function getRefreshToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("admin_refresh_token")
}

function saveTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("admin_token", access)
  localStorage.setItem("admin_refresh_token", refresh)
}

function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem("admin_token")
  localStorage.removeItem("admin_refresh_token")
  localStorage.removeItem("admin_role")
  window.location.href = "/admin/login"
}

// ---------------- REFRESH TOKEN ----------------
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      logout()
      return false
    }

    const json = await res.json()
    saveTokens(json.data.token, refreshToken)
    return true
  } catch {
    logout()
    return false
  }
}

// ---------------- REQUEST WRAPPER ----------------
async function request<T = any>(method: string, url: string, body?: any): Promise<ApiResponse<T>> {
  const token = getAccessToken()

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }

  let res = await fetch(`${BASE_URL}${url}`, options)

  // ----------- TOKEN EXPIRED → REFRESH -----------
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken()

    if (refreshed) {
      const newToken = getAccessToken()
      const retryOptions = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      }
      res = await fetch(`${BASE_URL}${url}`, retryOptions)
    }
  }

  // ----------- PROCESS RESPONSE -----------
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(json?.message || "Une erreur s'est produite") as any
    error.status = res.status
    error.data = json
    throw error
  }

  return {
    status: res.status,
    message: json?.message || "Success",
    data: json.data || json,
  }
}

// ---------------- API CLIENT ----------------
export const api = {
  baseURL: BASE_URL,

  // ---------- AUTH ----------
  auth: {
    login: (email: string, password: string) => request("POST", "/auth/login", { email, password }),
    refresh: () => request("POST", "/auth/refresh"),
    logout: () => logout(),
  },

  // ---------- PACKS ----------
  packs: {
    getAll: (params = "") => request("GET", `/packs${params}`),
    create: (data: any) => request("POST", "/packs", data),
    update: (id: string, data: any) => request("PUT", `/packs/${id}`, data),
    delete: (id: string) => request("DELETE", `/packs/${id}`),
  },

  // ---------- RESERVATIONS ----------
  reservations: {
    getAll: (params = "") => request("GET", `/reservations${params}`),
    getOne: (id: string) => request("GET", `/reservations/${id}`),
    create: (data: any) => request("POST", "/reservations", data),
    update: (id: string, data: any) => request("PUT", `/reservations/${id}`, data),
    cancel: (id: string) => request("POST", `/reservations/${id}/cancel`),
  },

  // ---------- PAYMENTS ----------
  payments: {
    getAll: () => request("GET", "/payments"),
    add: (reservation_id: string, data: any) => request("POST", `/reservations/${reservation_id}/payments`, data),
    delete: (reservation_id: string, payment_id: string) =>
      request("DELETE", `/payments/${reservation_id}/${payment_id}`),
  },

  // ---------- TICKETS ----------
  tickets: {
    getAll: () => request("GET", "/tickets"),
    generate: (reservationId: string) => request("POST", `/tickets/${reservationId}/generate`),
    getOne: (id: string) => request("GET", `/tickets/${id}`),
    getByReservation: (reservationId: string) => request("GET", `/tickets/by-reservation/${reservationId}`),
    checkExists: (reservationId: string) => request("GET", `/tickets/by-reservation/${reservationId}`),
  },

  // ---------- SCAN ----------
  scan: {
    decode: (qr_payload: string) => request("POST", "/tickets/decode", { qr_payload }),
    validate: (data: any) => request("POST", "/tickets/validate", data),
    jwtValidate: (qr_payload: string) => request("POST", "/scan/validate", { qr_payload }),
    stats: () => request("GET", "/scan/stats"),
  },

  // ---------- GENERIC METHODS ----------
  get: <T>(endpoint: string) => request<T>("GET", endpoint),
  post: <T>(endpoint: string, body?: any) => request<T>("POST", endpoint, body),
  put: <T>(endpoint: string, body?: any) => request<T>("PUT", endpoint, body),
  delete: <T>(endpoint: string) => request<T>("DELETE", endpoint),

  // ---------- FETCH BLOB ----------
  getBlob: async (endpointOrUrl: string) => {
    const token = getAccessToken()
    const isAbsolute = /^https?:\/\//i.test(endpointOrUrl)
    const url = isAbsolute ? endpointOrUrl : `${BASE_URL}${endpointOrUrl}`

    const options: RequestInit = {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }

    let res = await fetch(url, options)

    if (res.status === 401 && getRefreshToken()) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        const newToken = getAccessToken()
        const retryOptions = {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
        }
        res = await fetch(url, retryOptions)
      }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => null)
      const error = new Error(text || `Request failed with status ${res.status}`) as any
      error.status = res.status
      error.data = text
      throw error
    }

    const blob = await res.blob()
    const contentDisposition = res.headers.get("content-disposition") || ""
    let filename: string | undefined
    const match = /filename\*=UTF-8''(.+)$/.exec(contentDisposition) || /filename="?([^";]+)"?/.exec(contentDisposition)
    if (match) {
      try {
        filename = decodeURIComponent(match[1])
      } catch {
        filename = match[1]
      }
    }

    const contentType = res.headers.get("content-type") || undefined

    return { blob, filename, contentType }
  },
}

// Export types
export type { ApiResponse }

export default api