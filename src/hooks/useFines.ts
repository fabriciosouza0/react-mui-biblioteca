import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Fine,
  FineStatusType,
  FinePaymentData,
  PageResponse,
} from '../api/types'

export interface UseFinesResult {
  fines: Fine[]
  totalElements: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  search: string
  setSearch: (value: string) => void
  statusFilter: FineStatusType | 'ALL'
  setStatusFilter: (value: FineStatusType | 'ALL') => void
  loading: boolean
  saving: boolean
  paymentOpen: boolean
  setPaymentOpen: (value: boolean) => void
  paymentForm: FinePaymentData
  setPaymentForm: (value: FinePaymentData) => void
  paymentErrors: Record<string, string>
  openPayment: (fine: Fine) => void
  closePayment: () => void
  payFine: () => Promise<void>
  waiveFine: (fine: Fine) => Promise<void>
  writeOffFine: (fine: Fine) => Promise<void>
  recalculateBalance: (patronId: string) => Promise<void>
  refresh: () => void
  statusOptions: { value: FineStatusType | 'ALL'; label: string }[]
  formatCents: (cents: number) => string
}

export function useFines(institutionId?: string): UseFinesResult {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<FineStatusType | 'ALL'>('ALL')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState<FinePaymentData>({
    fineId: '',
    paymentRef: '',
    amountCents: 0,
  })
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})

  const buildUrl = (path: string) => path

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleStatusFilterChange = (value: FineStatusType | 'ALL') => {
    setStatusFilter(value)
    setPage(0)
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.fines, institutionId ?? 'all', search, statusFilter, page, pageSize],
    queryFn: async () => {
      const params: Record<string, any> = { page, size: pageSize }
      if (search.trim()) params.term = search.trim()
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await api.get<PageResponse<Fine> | Fine[]>(buildUrl('/fines'), { params })
      return res.data
    },
    enabled: !!institutionId,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const payMutation = useMutation({
    mutationFn: ({ fineId, paymentRef, amountCents }: FinePaymentData) =>
      api.post(`${buildUrl('/fines')}/${fineId}/pay`, { paymentRef, amountCents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fines })
      queryClient.invalidateQueries({ queryKey: queryKeys.patrons })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const waiveMutation = useMutation({
    mutationFn: ({ fineId, reason }: { fineId: string; reason: string }) =>
      api.post(`${buildUrl('/fines')}/${fineId}/waive`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fines })
      queryClient.invalidateQueries({ queryKey: queryKeys.patrons })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const writeOffMutation = useMutation({
    mutationFn: ({ fineId, reason }: { fineId: string; reason: string }) =>
      api.post(`${buildUrl('/fines')}/${fineId}/write-off`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fines })
      queryClient.invalidateQueries({ queryKey: queryKeys.patrons })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const recalcMutation = useMutation({
    mutationFn: (patronId: string) => api.post(`${buildUrl('/patrons')}/${patronId}/recalculate-fines`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fines })
      queryClient.invalidateQueries({ queryKey: queryKeys.patrons })
    },
    onError: notifyError,
  })

  function openPayment(fine: Fine) {
    setPaymentForm({
      fineId: fine.id,
      paymentRef: '',
      amountCents: fine.balanceCents,
    })
    setPaymentErrors({})
    setPaymentOpen(true)
  }

  function closePayment() {
    setPaymentOpen(false)
  }

  async function payFine() {
    const validationErrors: Record<string, string> = {}
    if (!paymentForm.paymentRef.trim()) validationErrors.paymentRef = 'Informe a referência do pagamento (PIX/boleto)'
    if (!paymentForm.amountCents || paymentForm.amountCents <= 0) validationErrors.amountCents = 'Valor deve ser maior que zero'
    if (paymentForm.amountCents > 0) {
      const finesList: Fine[] = Array.isArray(listQuery.data) ? listQuery.data : (listQuery.data?.content ?? [])
      const fine = finesList.find((f) => f.id === paymentForm.fineId)
      if (fine && paymentForm.amountCents > fine.balanceCents) {
        validationErrors.amountCents = 'Valor excede o saldo da multa'
      }
    }

    setPaymentErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      await payMutation.mutateAsync(paymentForm)
      setPaymentErrors({})
      setPaymentOpen(false)
    } catch {
      // error handled by mutation
    }
  }

  async function waiveFine(fine: Fine) {
    const reason = window.prompt('Motivo da isenção:', '')
    if (!reason) return

    await confirm({
      title: 'Isentar multa',
      message: `Isentar multa de ${formatCents(fine.balanceCents)}? Motivo: ${reason}`,
      confirmLabel: 'Isentar',
      color: 'primary',
      onConfirm: async () => {
        await waiveMutation.mutateAsync({ fineId: fine.id, reason })
      },
    })
  }

  async function writeOffFine(fine: Fine) {
    const reason = window.prompt('Motivo da baixa contábil:', '')
    if (!reason) return

    await confirm({
      title: 'Baixa contábil',
      message: `Dar baixa na multa de ${formatCents(fine.balanceCents)}? Motivo: ${reason}`,
      confirmLabel: 'Baixar',
      color: 'error',
      onConfirm: async () => {
        await writeOffMutation.mutateAsync({ fineId: fine.id, reason })
      },
    })
  }

  async function recalculateBalance(patronId: string) {
    await confirm({
      title: 'Recalcular saldo',
      message: 'Recalcular saldo de multas do locatário?',
      confirmLabel: 'Recalcular',
      color: 'primary',
      onConfirm: async () => {
        await recalcMutation.mutateAsync(patronId)
      },
    })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.fines })
  }

  function formatCents(cents: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
  }

  const statusOptions: { value: FineStatusType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING', label: 'Pendentes' },
    { value: 'PARTIAL', label: 'Parciais' },
    { value: 'PAID', label: 'Pagas' },
    { value: 'WAIVED', label: 'Isentas' },
    { value: 'WRITTEN_OFF', label: 'Baixadas' },
  ]

  const finesData = listQuery.data
  const fines: Fine[] = Array.isArray(finesData) ? (finesData as Fine[]) : ((finesData?.content as Fine[]) ?? [])
  const totalElements = Array.isArray(finesData) ? finesData.length : (finesData?.totalElements ?? 0)

  return {
    fines,
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
    saving: payMutation.isPending || waiveMutation.isPending || writeOffMutation.isPending || recalcMutation.isPending,
    paymentOpen,
    setPaymentOpen,
    paymentForm,
    setPaymentForm,
    paymentErrors,
    openPayment,
    closePayment,
    payFine,
    waiveFine,
    writeOffFine,
    recalculateBalance,
    refresh,
    statusOptions,
    formatCents,
  }
}