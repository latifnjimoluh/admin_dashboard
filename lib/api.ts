"use client"

const BASE_URL = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3001/api"

/* ============================
      TYPES
============================ */
export interface ApiResponse<T = any> {
  status: number
  message: string
  data?: T
}

/* ============================
      TOKEN MANAGEMENT
============================ */
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

/* ============================
      REFRESH TOKEN
============================ */
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

/* ============================
      REQUEST (JSON)
============================ */
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

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const retryToken = getAccessToken()
      res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${retryToken}`,
        },
      })
    }
  }

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(json?.message || "Erreur API") as any
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

/* ============================
      REQUEST (FORMDATA)
============================ */
async function requestFormData(method: string, url: string, data: any) {
  const token = getAccessToken()
  const absoluteUrl = `${BASE_URL}${url}`

  const form = new FormData()

  if (data.amount !== undefined && data.amount !== "") {
    form.append("amount", String(data.amount))
  }
  if (data.method !== undefined && data.method !== "") {
    form.append("method", String(data.method))
  }

  if (data.comment) form.append("comment", String(data.comment))
  if (data.proof && data.proof.name) form.append("proof", data.proof)

  const options: RequestInit = {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  }

  let res = await fetch(absoluteUrl, options)

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const retryToken = getAccessToken()
      res = await fetch(absoluteUrl, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${retryToken}` },
      })
    }
  }

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(json?.message || "Erreur API") as any
    error.status = res.status
    error.data = json
    throw error
  }

  return json
}

/* ============================
      BLOB
============================ */
async function getBlob(endpointOrUrl: string) {
  const token = getAccessToken()
  const isAbsolute = /^https?:\/\//i.test(endpointOrUrl)
  const url = isAbsolute ? endpointOrUrl : `${BASE_URL}${endpointOrUrl}`

  const options: RequestInit = {
    method: "GET",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  }

  let res = await fetch(url, options)

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const retryToken = getAccessToken()
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${retryToken}`,
        },
      })
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => null)
    const error = new Error(text || `Erreur ${res.status}`) as any
    error.status = res.status
    error.data = text
    throw error
  }

  const blob = await res.blob()
  const disposition = res.headers.get("content-disposition") || ""

  let filename
  const match = /filename\*=UTF-8''(.+)$/.exec(disposition) || /filename="?([^";]+)"?/.exec(disposition)

  if (match) {
    try {
      filename = decodeURIComponent(match[1])
    } catch {
      filename = match[1]
    }
  }

  return {
    blob,
    filename,
    contentType: res.headers.get("content-type") || undefined,
  }
}

/* ============================
      API CLIENT
============================ */
export const api = {
  baseURL: BASE_URL,

  /* AUTH */
  auth: {
    login: (email: string, password: string) => request("POST", "/auth/login", { email, password }),

    refresh: () => request("POST", "/auth/refresh"),

    logout: () => logout(),
  },

  /* USERS */
  users: {
    list: () => request("GET", "/users"),
    create: (data: any) => request("POST", "/users", data),
    update: (id: string, data: any) => request("PUT", `/users/${id}`, data),
    delete: (id: string) => request("DELETE", `/users/${id}`),

    /* 🔥 RÉCUPÉRER L’UTILISATEUR CONNECTÉ */
    me: () => request("GET", "/users/me"),

    /* 🔥 MODIFIER SON MOT DE PASSE */
    updatePassword: (data: { oldPassword: string; newPassword: string }) => request("PUT", "/users/password", data),
  },

  /* PACKS */
  packs: {
    getAll: (params = "") => request("GET", `/packs${params}`),
    create: (data: any) => request("POST", "/packs", data),
    update: (id: string, data: any) => request("PUT", `/packs/${id}`, data),
    delete: (id: string) => request("DELETE", `/packs/${id}`),
  },

  /* RESERVATIONS */
  reservations: {
    getAll: (params = "") => request("GET", `/reservations${params}`),
    getOne: (id: string) => request("GET", `/reservations/${id}`),
    create: (data: any) => request("POST", "/reservations", data),
    update: (id: string, data: any) => request("PUT", `/reservations/${id}`, data),
    cancel: (id: string) => request("POST", `/reservations/${id}/cancel`),
  },

  /* PAYMENTS */
  payments: {
    getAll: () => request("GET", "/payments"),

    add: (reservation_id: string, data: any) => {
      const isFile =
        data.proof &&
        typeof data.proof === "object" &&
        ("name" in data.proof || "stream" in data.proof) &&
        "size" in data.proof

      if (isFile) {
        return requestFormData("POST", `/reservations/${reservation_id}/payments`, data)
      }

      return request("POST", `/reservations/${reservation_id}/payments`, data)
    },

    delete: (reservation_id: string, payment_id: string) =>
      request("DELETE", `/payments/${reservation_id}/${payment_id}`),
  },

  /* TICKETS */
  tickets: {
    getAll: () => request("GET", "/tickets"),
    generate: (id: string) => request("POST", `/tickets/${id}/generate`),
    getOne: (id: string) => request("GET", `/tickets/${id}`),
    getByReservation: (id: string) => request("GET", `/tickets/by-reservation/${id}`),
    checkExists: (id: string) => request("GET", `/tickets/by-reservation/${id}`),
  },

  /* SCAN */
  scan: {
    decode: (qr: string) => request("POST", "/scan/decode", { qr_payload: qr }),

    search: (ticket_number: string) => request("POST", "/scan/search", { ticket_number }),

    validate: (data: { ticket_number: string; participant_id: number }) => request("POST", "/scan/validate", data),

    jwtValidate: (qr: string) => request("POST", "/scan/validate", { qr_payload: qr }),

    stats: () => request("GET", "/scan/stats"),
  },

  /* GENERIC */
  get: (e: string) => request("GET", e),
  post: (e: string, b?: any) => request("POST", e, b),
  put: (e: string, b?: any) => request("PUT", e, b),
  delete: (e: string) => request("DELETE", e),

  getBlob,
}

export default api
