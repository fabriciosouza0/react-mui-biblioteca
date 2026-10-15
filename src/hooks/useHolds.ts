import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Hold,
  HoldFormData,
  HoldStatusType,
  Patron,
  Work,
  Library,
  PageResponse,
} from '../api/types'

export interface UseHoldsResult {
  holds: Hold[]
  totalElements: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  search: string
  setSearch: (value: string) => void
  statusFilter: HoldStatusType | 'ALL'
  setStatusFilter: (value: HoldStatusType | 'ALL') => void
  loading: boolean
  saving: boolean
  placeHoldOpen: boolean
  setPlaceHoldOpen: (value: boolean) => void
  placeHoldForm: HoldFormData
  setPlaceHoldForm: (value: HoldFormData) => void
  placeHoldErrors: Record<string, string>
  placeHoldPatrons: Patron[]
  placeHoldWorks: Work[]
  placeHoldLibraries: Library[]
  openPlaceHold: () => void
  closePlaceHold: () => void
  placeHold: () => Promise<void>
  cancelHold: (hold: Hold) => Promise<void>
  fulfillHold: (hold: Hold) => Promise<void>
  expireHolds: () => Promise<void>
  refresh: () => void
  statusOptions: { value: HoldStatusType | 'ALL'; label: string }[]
}

const emptyPlaceHoldForm: HoldFormData = {
  patronId: '',
  workId: '',
  libraryId: '',
}

export function useHolds(institutionId?: string): UseHoldsResult {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<HoldStatusType | 'ALL'>('ALL')
  const [placeHoldOpen, setPlaceHoldOpen] = useState(false)
  const [placeHoldForm, setPlaceHoldForm] = useState<HoldFormData>(emptyPlaceHoldForm)
  const [placeHoldErrors, setPlaceHoldErrors] = useState<Record<string, string>>({})

  const buildUrl = (path: string) => path

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleStatusFilterChange = (value: HoldStatusType | 'ALL') => {
    setStatusFilter(value)
    setPage(0)
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.holds, institutionId ?? 'all', search, statusFilter, page, pageSize],
    queryFn: async () => {
      const params: Record<string, any> = { page, size: pageSize }
      if (search.trim()) params.term = search.trim()
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await api.get<PageResponse<Hold> | Hold[]>(buildUrl('/holds'), { params })
      return res.data
    },
    enabled: !!institutionId,
  })

  const patronsQuery = useQuery({
    queryKey: [...queryKeys.patrons, institutionId ?? 'all'],
    queryFn: async () => (await api.get<Patron[]>(buildUrl('/patrons'))).data,
    enabled: !!institutionId && placeHoldOpen,
    staleTime: 60_000,
  })

  const worksQuery = useQuery({
    queryKey: [...queryKeys.works, institutionId ?? 'all'],
    queryFn: async () => (await api.get<Work[]>(buildUrl('/works'))).data,
    enabled: !!institutionId && placeHoldOpen,
    staleTime: 60_000,
  })

  const librariesQuery = useQuery({
    queryKey: [...queryKeys.libraries, institutionId ?? 'all'],
    queryFn: async () => (await api.get<Library[]>(buildUrl('/libraries'))).data,
    enabled: !!institutionId && placeHoldOpen,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const placeHoldMutation = useMutation({
    mutationFn: (payload: HoldFormData) => api.post(buildUrl('/holds'), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holds })
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const cancelMutation = useMutation({
    mutationFn: (holdId: string) => api.delete(`${buildUrl('/holds')}/${holdId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holds })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const fulfillMutation = useMutation({
    mutationFn: (holdId: string) => api.post(`${buildUrl('/holds')}/${holdId}/fulfill`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holds })
      queryClient.invalidateQueries({ queryKey: queryKeys.loans })
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const expireMutation = useMutation({
    mutationFn: () => api.post(buildUrl('/holds/expire')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holds })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  function openPlaceHold() {
    setPlaceHoldForm({ patronId: '', workId: '', libraryId: '' })
    setPlaceHoldErrors({})
    setPlaceHoldOpen(true)
  }

  function closePlaceHold() {
    setPlaceHoldOpen(false)
  }

  async function placeHold() {
    const validationErrors: Record<string, string> = {}
    if (!placeHoldForm.patronId) validationErrors.patronId = 'Informe o locatário'
    if (!placeHoldForm.workId) validationErrors.workId = 'Informe a obra'
    if (!placeHoldForm.libraryId) validationErrors.libraryId = 'Informe a filial de retirada'

    setPlaceHoldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      await placeHoldMutation.mutateAsync(placeHoldForm)
      setPlaceHoldErrors({})
      setPlaceHoldOpen(false)
    } catch {
      // error handled by mutation
    }
  }

  async function cancelHold(hold: Hold) {
    await confirm({
      title: 'Cancelar reserva',
      message: `Deseja cancelar a reserva #${hold.id.slice(0, 8)}?`,
      confirmLabel: 'Cancelar',
      color: 'error',
      onConfirm: async () => {
        await cancelMutation.mutateAsync(hold.id)
      },
    })
  }

  async function fulfillHold(hold: Hold) {
    await confirm({
      title: 'Cumprir reserva',
      message: `Confirmar retirada do exemplar pelo locatário?`,
      confirmLabel: 'Cumprir',
      color: 'primary',
      onConfirm: async () => {
        await fulfillMutation.mutateAsync(hold.id)
      },
    })
  }

  async function expireHolds() {
    await confirm({
      title: 'Expirar reservas vencidas',
      message: 'Executar rotina de expiração de reservas com tempo esgotado?',
      confirmLabel: 'Executar',
      color: 'primary',
      onConfirm: async () => {
        await expireMutation.mutateAsync()
      },
    })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.holds })
  }

  const statusOptions: { value: HoldStatusType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'WAITING', label: 'Na fila' },
    { value: 'READY', label: 'Pronto para retirada' },
    { value: 'FULFILLED', label: 'Retirado' },
    { value: 'EXPIRED', label: 'Expirado' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ]

  const holdsData = listQuery.data
  const holds: Hold[] = Array.isArray(holdsData) ? (holdsData as Hold[]) : ((holdsData?.content as Hold[]) ?? [])
  const totalElements = Array.isArray(holdsData) ? holdsData.length : (holdsData?.totalElements ?? 0)

  return {
    holds,
    totalElements,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch: handleSearchChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    loading: listQuery.isLoading,
    saving: placeHoldMutation.isPending || cancelMutation.isPending || fulfillMutation.isPending || expireMutation.isPending,
    placeHoldOpen,
    setPlaceHoldOpen,
    placeHoldForm,
    setPlaceHoldForm,
    placeHoldErrors,
    placeHoldPatrons: patronsQuery.data ?? [],
    placeHoldWorks: worksQuery.data ?? [],
    placeHoldLibraries: librariesQuery.data ?? [],
    openPlaceHold,
    closePlaceHold,
    placeHold,
    cancelHold,
    fulfillHold,
    expireHolds,
    refresh,
    statusOptions,
  }
}