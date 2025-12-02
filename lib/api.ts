"use client"

const BASE_URL = "http://localhost:3001/api"

// ---------------- TOKEN MANAGEMENT ----------------
function getAccessToken() {
  return localStorage.getItem("admin_token")
}

function getRefreshToken() {
  return localStorage.getItem("admin_refresh_token")
}

function saveTokens(access: string, refresh: string) {
  localStorage.setItem("admin_token", access)
  localStorage.setItem("admin_refresh_token", refresh)
}

function logout() {
  localStorage.removeItem("admin_token")
  localStorage.removeItem("admin_refresh_token")
  localStorage.removeItem("admin_role")
  window.location.href = "/admin/login"
}

// ---------------- REQUEST WRAPPER ----------------
async function request(method: string, url: string, body?: any) {
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
    throw new Error(json?.message || "Une erreur s’est produite")
  }

  return json.data || json
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

// ---------------- API GROUPS ----------------

export const api = {
  // ---------- AUTH ----------
  auth: {
    login: (email: string, password: string) =>
      request("POST", "/auth/login", { email, password }),

    refresh: () => request("POST", "/auth/refresh"),

    logout: () => {
      logout()
    },
  },

  // ---------- PACKS ----------
  packs: {
    getAll: () => request("GET", "/packs"),
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
    add: (reservation_id: string, data: any) =>
      request("POST", `/reservations/${reservation_id}/payments`, data),
    delete: (reservation_id: string, payment_id: string) =>
      request("DELETE", `/payments/${reservation_id}/${payment_id}`),
  },

  // ---------- TICKETS ----------
  tickets: {
    getAll: () => request("GET", "/tickets"),
    generate: (reservationId: string) =>
      request("POST", `/tickets/${reservationId}/generate`),
    getOne: (id: string) => request("GET", `/tickets/${id}`),
  },

  // ---------- SCAN ----------
  scan: {
    decode: (qr_payload: string) =>
      request("POST", "/tickets/decode", { qr_payload }),

    validate: (data: any) =>
      request("POST", "/tickets/validate", data),

    jwtValidate: (qr_payload: string) =>
      request("POST", "/scan/validate", { qr_payload }),

    stats: () => request("GET", "/scan/stats"),
  },
}
