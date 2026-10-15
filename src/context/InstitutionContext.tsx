import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setCurrentInstitutionId } from '../api/client'
import type { InstitutionWithRole, AdminRoleType, MeResponse } from '../api/types'

interface InstitutionContextValue {
  institutions: InstitutionWithRole[]
  selectedInstitution: InstitutionWithRole | null
  setSelectedInstitution: (institution: InstitutionWithRole | null) => void
  loading: boolean
  refresh: () => Promise<void>
  userRole: AdminRoleType | null
  userLogin: string | null
  userName: string | null
}

const InstitutionContext = createContext<InstitutionContextValue | null>(null)

const SELECTED_INSTITUTION_KEY = 'biblioteca_selected_institution'

export function InstitutionProvider({ children }: { children: ReactNode }) {
  const [institutions, setInstitutions] = useState<InstitutionWithRole[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<AdminRoleType | null>(null)
  const [userLogin, setUserLogin] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  async function fetchMe() {
    try {
      const { data } = await api.get<MeResponse>('/auth/me')
      setUserRole(data.role)
      setUserLogin(data.login)
      setUserName(data.nome)

      const institutionsWithRole: InstitutionWithRole[] = data.institutions.map(inst => ({
        ...inst,
        role: inst.role,
      }))
      setInstitutions(institutionsWithRole)
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      throw error
    }
  }

  function refresh() {
    return fetchMe()
  }

  useEffect(() => {
    fetchMe().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedInstitution) {
      localStorage.setItem(SELECTED_INSTITUTION_KEY, selectedInstitution.id)
      setCurrentInstitutionId(selectedInstitution.id)
    } else {
      localStorage.removeItem(SELECTED_INSTITUTION_KEY)
      setCurrentInstitutionId(null)
    }
  }, [selectedInstitution])

  useEffect(() => {
    if (institutions.length > 0 && !selectedInstitution) {
      const savedId = localStorage.getItem(SELECTED_INSTITUTION_KEY)
      if (savedId) {
        const saved = institutions.find(i => i.id === savedId)
        if (saved) {
          setSelectedInstitution(saved)
          return
        }
      }
      setSelectedInstitution(institutions[0])
    }
  }, [institutions, selectedInstitution])

  const value = {
    institutions,
    selectedInstitution,
    setSelectedInstitution,
    loading,
    refresh,
    userRole,
    userLogin,
    userName,
  }

  return <InstitutionContext.Provider value={value}>{children}</InstitutionContext.Provider>
}

export function useInstitution(): InstitutionContextValue {
  const ctx = useContext(InstitutionContext)
  if (!ctx) throw new Error('useInstitution deve ser usado dentro de InstitutionProvider')
  return ctx
}