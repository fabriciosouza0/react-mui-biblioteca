import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Patron,
  PatronFormData,
} from '../api/types'

export interface UsePatronsResult {
  patrons: Patron[]
  search: string
  setSearch: (value: string) => void
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  closeDialog: () => void
  editing: string | null
  form: PatronFormData
  setForm: (value: PatronFormData) => void
  errors: Record<string, string>
  openNew: () => void
  openEdit: (patron: Patron) => void
  save: () => Promise<void>
  remove: (patron: Patron) => Promise<void>
  refresh: () => void
  profileOptions: { value: string; label: string }[]
  statusOptions: { value: string; label: string }[]
}

export function usePatrons(institutionId?: string) {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<PatronFormData>({
    institutionId: '',
    externalId: '',
    name: '',
    phone: '',
    profile: 'STUDENT',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const buildUrl = (path: string) => path

  function updateForm(value: PatronFormData) {
    setForm(value)
    setErrors({})
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.patrons, institutionId ?? 'all', search],
    queryFn: async () => {
      const params = search.trim()
        ? { params: { term: search.trim() } }
        : undefined
      return (await api.get<Patron[]>(buildUrl('/patrons'), params)).data
    },
    enabled: !!institutionId,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const saveMutation = useMutation({
    mutationFn: async (args: { payload: PatronFormData; editing: string | null }) => {
      if (args.editing === null) {
        return (await api.post(buildUrl('/patrons'), args.payload)).data
      }
      return (await api.put(`${buildUrl('/patrons')}/${args.editing}`, args.payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patrons })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const removeMutation = useMutation({
    mutationFn: (patron: Patron) => api.delete(`${buildUrl('/patrons')}/${patron.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patrons })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
  })

  function openNew() {
    setEditing(null)
    setForm({ institutionId: institutionId ?? '', externalId: '', name: '', phone: '', profile: 'STUDENT' })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(patron: Patron) {
    setEditing(patron.id)
    setForm({
      institutionId: patron.institutionId,
      externalId: patron.externalId,
      name: patron.name,
      phone: patron.phone ?? '',
      profile: patron.profile,
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function save() {
    const validationErrors: Record<string, string> = {}
    if (!form.institutionId.trim()) validationErrors.institutionId = 'Informe a instituição'
    if (!form.externalId.trim()) validationErrors.externalId = 'Informe o CPF'
    else if (!/^\d{11}$/.test(form.externalId.replace(/\D/g, ''))) validationErrors.externalId = 'CPF deve ter 11 dígitos'
    if (!form.name.trim()) validationErrors.name = 'Informe o nome'
    else if (form.name.length > 45) validationErrors.name = 'Máximo de 45 caracteres'
    if (form.phone && form.phone.length > 20) validationErrors.phone = 'Máximo de 20 caracteres'
    if (!form.profile) validationErrors.profile = 'Informe o perfil'

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

  async function remove(patron: Patron) {
    await confirm({
      title: 'Excluir locatário',
      message: `Tem certeza que deseja excluir "${patron.name}" (${patron.externalId})?`,
      confirmLabel: 'Excluir',
      color: 'error',
      onConfirm: async () => {
        await removeMutation.mutateAsync(patron)
      },
    })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.patrons })
  }

  const profileOptions = [
    { value: 'STUDENT', label: 'Aluno' },
    { value: 'TEACHER', label: 'Professor' },
    { value: 'STAFF', label: 'Funcionário' },
    { value: 'EXTERNAL', label: 'Externo' },
  ] as const

  const statusOptions = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'BLOCKED', label: 'Bloqueado' },
    { value: 'SUSPENDED', label: 'Suspenso' },
  ] as const

  return {
    patrons: listQuery.data ?? [],
    search,
    setSearch,
    loading: listQuery.isLoading,
    saving: saveMutation.isPending || removeMutation.isPending,
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
    refresh,
    profileOptions,
    statusOptions,
  }
}

export function useProfileOptions() {
  return [
    { value: 'STUDENT', label: 'Aluno' },
    { value: 'TEACHER', label: 'Professor' },
    { value: 'STAFF', label: 'Funcionário' },
    { value: 'EXTERNAL', label: 'Externo' },
  ] as const
}

export function useStatusOptions() {
  return [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'BLOCKED', label: 'Bloqueado' },
    { value: 'SUSPENDED', label: 'Suspenso' },
  ] as const
}