import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, setCurrentLibraryId } from '../api/client'
import { queryKeys } from '../api/queryClient'
import { useInstitution } from './InstitutionContext'
import type { Library } from '../api/types'

interface LibraryContextValue {
  libraries: Library[]
  selectedLibrary: Library | null
  setSelectedLibrary: (library: Library | null) => void
  loading: boolean
}

const LibraryContext = createContext<LibraryContextValue | null>(null)
const SELECTED_LIBRARY_KEY = 'biblioteca_selected_library'

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { selectedInstitution, userRole } = useInstitution()
  const institutionId = selectedInstitution?.id

  const { data: libraries = [], isLoading } = useQuery({
    queryKey: [...queryKeys.libraries, institutionId ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get<Library[]>('/libraries')
      return data
    },
    enabled: !!institutionId,
  })

  const [selectedLibrary, setSelectedLibraryState] = useState<Library | null>(null)

  function setSelectedLibrary(lib: Library | null) {
    setSelectedLibraryState(lib)
    if (lib) {
      localStorage.setItem(SELECTED_LIBRARY_KEY, lib.id)
      setCurrentLibraryId(lib.id)
    } else {
      localStorage.removeItem(SELECTED_LIBRARY_KEY)
      setCurrentLibraryId(null)
    }
  }

  // Sincroniza a filial selecionada quando as filiais da instituição carregam
  useEffect(() => {
    if (!institutionId || libraries.length === 0) {
      setSelectedLibrary(null)
      return
    }

    const savedId = localStorage.getItem(SELECTED_LIBRARY_KEY)
    if (savedId) {
      const match = libraries.find((l) => l.id === savedId)
      if (match) {
        setSelectedLibraryState(match)
        setCurrentLibraryId(match.id)
        return
      }
    }

    // Se for operador de instituição e não tiver filial salva, seleciona a central ou a primeira
    if (userRole !== 'GLOBAL_ADMIN') {
      const centralOrFirst = libraries.find((l) => l.isCentral) ?? libraries[0]
      setSelectedLibrary(centralOrFirst)
    } else {
      // Global admin pode começar sem filial fixa (visão global)
      setSelectedLibrary(null)
    }
  }, [institutionId, libraries, userRole])

  return (
    <LibraryContext.Provider
      value={{
        libraries,
        selectedLibrary,
        setSelectedLibrary,
        loading: isLoading,
      }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary deve ser usado dentro de LibraryProvider')
  return ctx
}
