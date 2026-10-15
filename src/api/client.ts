import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { AdminRoleType } from './types'

const TOKEN_KEY = 'biblioteca_token'
const USER_KEY = 'biblioteca_user'
const INSTITUTION_KEY = 'biblioteca_selected_institution'
const LIBRARY_KEY = 'biblioteca_selected_library'

export const api = axios.create({ baseURL: '/api', withCredentials: true })

let currentInstitutionId: string | null = null

export function setCurrentInstitutionId(id: string | null) {
  currentInstitutionId = id
}

export function getCurrentInstitutionId(): string | null {
  return currentInstitutionId ?? localStorage.getItem(INSTITUTION_KEY)
}

let currentLibraryId: string | null = null

export function setCurrentLibraryId(id: string | null) {
  currentLibraryId = id
}

export function getCurrentLibraryId(): string | null {
  return currentLibraryId ?? localStorage.getItem(LIBRARY_KEY)
}

let isRefreshing = false
interface Subscriber {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}
let refreshSubscribers: Subscriber[] = []

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((s) => s.resolve(token))
  refreshSubscribers = []
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((s) => s.reject(err))
  refreshSubscribers = []
}

async function refreshAccessToken(): Promise<string> {
  const { data } = await api.post<{ accessToken: string }>('/auth/refresh')
  setToken(data.accessToken)
  return data.accessToken
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const instId = getCurrentInstitutionId()
  if (instId) {
    config.headers['X-Institution-Id'] = instId
  }
  const libId = getCurrentLibraryId()
  if (libId) {
    config.headers['X-Library-Id'] = libId
  }
  config.headers['Accept-Language'] = navigator.language || 'pt-BR'
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (
      original &&
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshSubscribers.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(token)
            },
            reject,
          })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true
      try {
        const token = await refreshAccessToken()
        onTokenRefreshed(token)
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (refreshError) {
        onRefreshFailed(refreshError)
        clearSession()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export interface UserSession {
  nome: string
  login: string
  role: AdminRoleType
  institutionId: string | null
}

export function getUser(): UserSession | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setSession(
  accessToken: string,
  user: { nome: string; login: string; role: AdminRoleType; institutionId: string | null }
) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function setToken(accessToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LIBRARY_KEY)
  currentLibraryId = null
}

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined
    return data?.message ?? data?.error ?? err.message
  }
  return String(err)
}
