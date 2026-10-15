import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Item,
  ItemFormData,
  ItemStatusType,
  PageResponse,
} from '../api/types'

export interface UseItemsResult {
  items: Item[]
  totalElements: number
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  search: string
  setSearch: (value: string) => void
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  closeDialog: () => void
  editing: string | null
  form: ItemFormData
  setForm: (value: ItemFormData) => void
  errors: Record<string, string>
  openNew: (prefill?: Partial<ItemFormData>) => void
  openEdit: (item: Item) => void
  save: () => Promise<void>
  remove: (item: Item) => Promise<void>
  transfer: (item: Item, toLibraryId: string, transferNote?: string) => Promise<void>
  receiveTransfer: (item: Item) => Promise<void>
  withdraw: (item: Item, reason?: string) => Promise<void>
  refresh: () => void
  statusOptions: { value: ItemStatusType; label: string }[]
}

export function useItems(institutionId?: string, workId?: string, libraryId?: string): UseItemsResult {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<ItemFormData>({
    workId: '',
    libraryId: '',
    barcode: '',
    callNumber: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const buildUrl = (path: string) => path

  function updateForm(value: ItemFormData) {
    setForm(value)
    setErrors({})
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.items, institutionId ?? 'all', workId ?? 'all', libraryId ?? 'all', search, page, pageSize],
    queryFn: async () => {
      const params: Record<string, any> = { page, size: pageSize }
      if (workId) params.workId = workId
      if (libraryId) params.libraryId = libraryId
      if (search.trim()) params.term = search.trim()
      const res = await api.get<PageResponse<Item> | Item[]>(buildUrl('/items'), { params })
      return res.data
    },
    enabled: !!institutionId,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const saveMutation = useMutation({
    mutationFn: async (args: { payload: ItemFormData; editing: string | null }) => {
      if (args.editing === null) {
        return (await api.post(buildUrl('/items'), args.payload)).data
      }
      return (await api.put(`${buildUrl('/items')}/${args.editing}`, args.payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const removeMutation = useMutation({
    mutationFn: (item: Item) => api.delete(`${buildUrl('/items')}/${item.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
  })

  const transferMutation = useMutation({
    mutationFn: ({ item, toLibraryId, transferNote }: { item: Item; toLibraryId: string; transferNote?: string }) =>
      api.post(`${buildUrl('/items')}/${item.id}/transfer`, { targetLibraryId: toLibraryId, transferNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const receiveMutation = useMutation({
    mutationFn: (item: Item) =>
      api.post(`${buildUrl('/items')}/${item.id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
    },
    onError: notifyError,
  })

  const withdrawMutation = useMutation({
    mutationFn: ({ item, reason }: { item: Item; reason?: string }) =>
      api.post(`${buildUrl('/items')}/${item.id}/withdraw`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items })
    },
    onError: notifyError
  })

  function openNew(prefill: Partial<ItemFormData> = {}) {
    setEditing(null)
    setForm({ workId: '', libraryId: '', barcode: '', callNumber: '', ...prefill })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(item: Item) {
    setEditing(item.id)
    setForm({
      workId: item.workId,
      libraryId: item.libraryId,
      barcode: item.barcode,
      callNumber: item.callNumber ?? '',
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function save() {
    const validationErrors: Record<string, string> = {}
    if (!form.workId.trim()) validationErrors.workId = 'Informe a obra'
    if (!form.libraryId.trim()) validationErrors.libraryId = 'Informe a biblioteca'
    if (!form.barcode.trim()) validationErrors.barcode = 'Informe o código de barras'
    else if (form.barcode.length > 40) validationErrors.barcode = 'Máximo de 40 caracteres'
    if (form.callNumber && form.callNumber.length > 60) validationErrors.callNumber = 'Máximo de 60 caracteres'

    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    try {
      await saveMutation.mutateAsync({ payload: form, editing })
      setErrors({})
      setDialogOpen(false)
    } catch {
      // error handled by mutation
    }
  }

  async function remove(item: Item) {
    await confirm({
      title: 'Excluir exemplar',
      message: `Tem certeza que deseja excluir o exemplar ${item.barcode}?`,
      confirmLabel: 'Excluir',
      color: 'error',
      onConfirm: async () => {
        await removeMutation.mutateAsync(item)
      },
    })
  }

  async function transfer(item: Item, toLibraryId: string, transferNote?: string) {
    await transferMutation.mutateAsync({ item, toLibraryId, transferNote })
  }

  async function receiveTransfer(item: Item) {
    await confirm({
      title: 'Receber transferência',
      message: `Confirmar recebimento do exemplar ${item.barcode}?`,
      confirmLabel: 'Receber',
      color: 'primary',
      onConfirm: async () => {
        await receiveMutation.mutateAsync(item)
      },
    })
  }

  async function withdraw(item: Item, reason?: string) {
    await withdrawMutation.mutateAsync({ item, reason })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.items })
  }

  const statusOptions: { value: ItemStatusType; label: string }[] = [
    { value: 'AVAILABLE', label: 'Disponível' },
    { value: 'ON_LOAN', label: 'Emprestado' },
    { value: 'ON_HOLD', label: 'Reservado' },
    { value: 'IN_TRANSIT', label: 'Em trânsito' },
    { value: 'LOST', label: 'Perdido' },
    { value: 'WITHDRAWN', label: 'Retirado do acervo' },
    { value: 'IN_REPAIR', label: 'Em reparo' },
  ]

  const itemsData = listQuery.data
  const items: Item[] = Array.isArray(itemsData) ? (itemsData as Item[]) : ((itemsData?.content as Item[]) ?? [])
  const totalElements = Array.isArray(itemsData) ? itemsData.length : (itemsData?.totalElements ?? 0)

  return {
    items,
    totalElements,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch: handleSearchChange,
    loading: listQuery.isLoading,
    saving: saveMutation.isPending || removeMutation.isPending || transferMutation.isPending || withdrawMutation.isPending,
    dialogOpen,
    closeDialog: () => setDialogOpen(false),
    editing,
    form,
    setForm: updateForm,
    errors,
    openNew,
    openEdit,
    save,
    remove,
    transfer,
    receiveTransfer,
    withdraw,
    refresh,
    statusOptions,
  }
}