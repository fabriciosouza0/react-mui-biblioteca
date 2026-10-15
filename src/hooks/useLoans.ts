import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Loan,
  LoanFormData,
  LoanStatusType,
  Patron,
  Item,
  Library,
  PageResponse,
} from '../api/types'

export interface UseLoansResult {
  loans: Loan[]
  totalElements: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  search: string
  setSearch: (value: string) => void
  statusFilter: LoanStatusType | 'ALL'
  setStatusFilter: (value: LoanStatusType | 'ALL') => void
  loading: boolean
  saving: boolean
  checkoutOpen: boolean
  setCheckoutOpen: (value: boolean) => void
  checkoutForm: LoanFormData
  setCheckoutForm: (value: LoanFormData) => void
  checkoutErrors: Record<string, string>
  checkoutPatrons: Patron[]
  checkoutItems: Item[]
  checkoutLibraries: Library[]
  openCheckout: () => void
  closeCheckout: () => void
  checkout: () => Promise<void>
  returnLoan: (loan: Loan, condition: 'OK' | 'DAMAGED' | 'LOST') => Promise<void>
  renewLoan: (loan: Loan) => Promise<void>
  refresh: () => void
  statusOptions: { value: LoanStatusType | 'ALL'; label: string }[]
}

export function useLoans(institutionId?: string): UseLoansResult {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<LoanStatusType | 'ALL'>('ALL')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState<LoanFormData>({
    patronId: '',
    itemId: '',
    libraryId: '',
  })
  const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({})

  const buildUrl = (path: string) => path

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleStatusFilterChange = (value: LoanStatusType | 'ALL') => {
    setStatusFilter(value)
    setPage(0)
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.loans, institutionId ?? 'all', search, statusFilter, page, pageSize],
    queryFn: async () => {
      const params: Record<string, any> = { page, size: pageSize }
      if (search.trim()) params.term = search.trim()
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await api.get<PageResponse<Loan> | Loan[]>(buildUrl('/loans'), { params })
      return res.data
    },
    enabled: !!institutionId,
  })

  const patronsQuery = useQuery({
    queryKey: [...queryKeys.patrons, institutionId ?? 'all'],
    queryFn: async () => (await api.get<Patron[]>(buildUrl('/patrons'))).data,
    enabled: !!institutionId && checkoutOpen,
    staleTime: 60_000,
  })

  const itemsQuery = useQuery({
    queryKey: [...queryKeys.items, institutionId ?? 'all', 'available'],
    queryFn: async () => {
      const params = { status: 'AVAILABLE', size: 100 }
      const res = await api.get<PageResponse<Item> | Item[]>(buildUrl('/items'), { params })
      return Array.isArray(res.data) ? res.data : (res.data?.content ?? [])
    },
    enabled: !!institutionId && checkoutOpen,
    staleTime: 30_000,
  })

  const librariesQuery = useQuery({
    queryKey: [...queryKeys.libraries, institutionId ?? 'all'],
    queryFn: async () => (await api.get<Library[]>(buildUrl('/libraries'))).data,
    enabled: !!institutionId && checkoutOpen,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const checkoutMutation = useMutation({
    mutationFn: (payload: LoanFormData) => api.post(buildUrl('/loans'), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loans })
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
      queryClient.invalidateQueries({ queryKey: queryKeys.holds })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const returnMutation = useMutation({
    mutationFn: ({ loanId, condition }: { loanId: string; condition: 'OK' | 'DAMAGED' | 'LOST' }) =>
      api.delete(`${buildUrl('/loans')}/${loanId}?condition=${condition}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loans })
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
      queryClient.invalidateQueries({ queryKey: queryKeys.holds })
      queryClient.invalidateQueries({ queryKey: queryKeys.fines })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const renewMutation = useMutation({
    mutationFn: (loanId: string) => api.post(`${buildUrl('/loans')}/${loanId}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loans })
      queryClient.invalidateQueries({ queryKey: queryKeys.fines })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  function openCheckout() {
    setCheckoutForm({ patronId: '', itemId: '', libraryId: '' })
    setCheckoutErrors({})
    setCheckoutOpen(true)
  }

  function closeCheckout() {
    setCheckoutOpen(false)
  }

  async function checkout() {
    const validationErrors: Record<string, string> = {}
    if (!checkoutForm.patronId) validationErrors.patronId = 'Informe o locatário'
    if (!checkoutForm.itemId) validationErrors.itemId = 'Informe o exemplar'
    if (!checkoutForm.libraryId) validationErrors.libraryId = 'Informe a filial'

    setCheckoutErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      await checkoutMutation.mutateAsync(checkoutForm)
      setCheckoutErrors({})
      setCheckoutOpen(false)
    } catch {
      // error handled by mutation
    }
  }

  async function returnLoan(loan: Loan, condition: 'OK' | 'DAMAGED' | 'LOST') {
    const conditionLabels: Record<string, string> = {
      OK: 'em bom estado',
      DAMAGED: 'danificado',
      LOST: 'perdido',
    }

    await confirm({
      title: 'Registrar devolução',
      message: `Confirmar devolução do exemplar (${conditionLabels[condition]})?`,
      confirmLabel: 'Devolver',
      color: 'primary',
      onConfirm: async () => {
        await returnMutation.mutateAsync({ loanId: loan.id, condition })
      },
    })
  }

  async function renewLoan(loan: Loan) {
    await confirm({
      title: 'Renovar empréstimo',
      message: `Deseja renovar o empréstimo do exemplar?`,
      confirmLabel: 'Renovar',
      color: 'primary',
      onConfirm: async () => {
        await renewMutation.mutateAsync(loan.id)
      },
    })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.loans })
  }

  const statusOptions: { value: LoanStatusType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ACTIVE', label: 'Ativos' },
    { value: 'OVERDUE', label: 'Atrasados' },
    { value: 'RETURNED', label: 'Devolvidos' },
    { value: 'LOST_CLAIMED', label: 'Perdidos' },
  ]

  const loansData = listQuery.data
  const loans: Loan[] = Array.isArray(loansData) ? (loansData as Loan[]) : ((loansData?.content as Loan[]) ?? [])
  const totalElements = Array.isArray(loansData) ? loansData.length : (loansData?.totalElements ?? 0)

  return {
    loans,
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
    saving: checkoutMutation.isPending || returnMutation.isPending || renewMutation.isPending,
    checkoutOpen,
    setCheckoutOpen,
    checkoutForm,
    setCheckoutForm,
    checkoutErrors,
    checkoutPatrons: patronsQuery.data ?? [],
    checkoutItems: itemsQuery.data ?? [],
    checkoutLibraries: librariesQuery.data ?? [],
    openCheckout,
    closeCheckout,
    checkout,
    returnLoan,
    renewLoan,
    refresh,
    statusOptions,
  }
}