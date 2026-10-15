import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  ProfileConfig,
  ProfileConfigFormData,
} from '../api/types'

export interface UseProfileConfigsResult {
  configs: ProfileConfig[]
  search: string
  setSearch: (value: string) => void
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  closeDialog: () => void
  editing: string | null
  form: ProfileConfigFormData
  setForm: (value: ProfileConfigFormData) => void
  errors: Record<string, string>
  openNew: () => void
  openEdit: (config: ProfileConfig) => void
  save: () => Promise<void>
  remove: (config: ProfileConfig) => Promise<void>
  refresh: () => void
  profileOptions: { value: string; label: string }[]
}

export function useProfileConfigs(institutionId?: string) {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileConfigFormData>({
    institutionId: '',
    profile: 'STUDENT',
    maxLoans: 3,
    loanDays: 7,
    maxRenewals: 2,
    holdLimit: 5,
    fineRateCents: 50,
    fineCapCents: 5000,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const buildUrl = (path: string) => path

  function updateForm(value: ProfileConfigFormData) {
    setForm(value)
    setErrors({})
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.profileConfigs, institutionId ?? 'all', search],
    queryFn: async () => {
      const params = search.trim() ? { params: { term: search.trim() } } : undefined
      return (await api.get<ProfileConfig[]>(buildUrl('/profile-configs'), params)).data
    },
    enabled: !!institutionId,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const saveMutation = useMutation({
    mutationFn: async (args: { payload: ProfileConfigFormData; editing: string | null }) => {
      if (args.editing === null) {
        return (await api.post(buildUrl('/profile-configs'), args.payload)).data
      }
      return (await api.put(`${buildUrl('/profile-configs')}/${args.editing}`, args.payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profileConfigs })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const removeMutation = useMutation({
    mutationFn: (config: ProfileConfig) => api.delete(`${buildUrl('/profile-configs')}/${config.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profileConfigs })
    }
  })

  function openNew() {
    setEditing(null)
    setForm({ institutionId: institutionId ?? '', profile: 'STUDENT', maxLoans: 3, loanDays: 7, maxRenewals: 2, holdLimit: 5, fineRateCents: 50, fineCapCents: 5000 })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(config: ProfileConfig) {
    setEditing(config.id)
    setForm({
      institutionId: config.institutionId,
      profile: config.profile,
      maxLoans: config.maxLoans,
      loanDays: config.loanDays,
      maxRenewals: config.maxRenewals,
      holdLimit: config.holdLimit,
      fineRateCents: config.fineRateCents,
      fineCapCents: config.fineCapCents,
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function save() {
    const validationErrors: Record<string, string> = {}
    if (!form.institutionId.trim()) validationErrors.institutionId = 'Informe a instituição'
    if (!form.profile) validationErrors.profile = 'Informe o perfil'
    if (form.maxLoans < 0) validationErrors.maxLoans = 'Não pode ser negativo'
    if (form.loanDays <= 0) validationErrors.loanDays = 'Deve ser pelo menos 1 dia'
    if (form.maxRenewals < 0) validationErrors.maxRenewals = 'Não pode ser negativo'
    if (form.holdLimit < 0) validationErrors.holdLimit = 'Não pode ser negativo'
    if (form.fineRateCents < 0) validationErrors.fineRateCents = 'Não pode ser negativo'
    if (form.fineCapCents < 0) validationErrors.fineCapCents = 'Não pode ser negativo'

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

  async function remove(config: ProfileConfig) {
    await confirm({
      title: 'Excluir configuração de perfil',
      message: `Tem certeza que deseja excluir a configuração do perfil ${config.profile}?`,
      confirmLabel: 'Excluir',
      color: 'error',
      onConfirm: async () => {
        await removeMutation.mutateAsync(config)
      },
    })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.profileConfigs })
  }

  const profileOptions = [
    { value: 'STUDENT', label: 'Aluno' },
    { value: 'TEACHER', label: 'Professor' },
    { value: 'STAFF', label: 'Funcionário' },
    { value: 'EXTERNAL', label: 'Externo' },
  ] as const

  return {
    configs: listQuery.data ?? [],
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
  }
}