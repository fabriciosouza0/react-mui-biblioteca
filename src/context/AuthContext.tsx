import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { api, clearSession, getToken, getUser, setSession, type UserSession } from '../api/client'

interface AuthContextValue {
  user: UserSession | null
  login: (login: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = getUser()

  async function login(login: string, senha: string) {
    const { data } = await api.post('/auth/login', { login, senha })
    setSession(data.accessToken, {
      nome: data.nome,
      login: data.login,
      role: data.role,
      institutionId: data.institutionId,
    })
    window.location.href = '/'
  }

  function logout() {
    api.post('/auth/logout').catch(() => undefined)
    clearSession()
    window.location.href = '/login'
  }

  const value = useMemo(() => ({ user, login, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
