import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Institution,
} from '../api/types'
import type { FieldErrors } from '../utils/validation'
import { requiredMessage, maxLenMessage } from '../utils/validation'

export interface UseInstitutionsResult {
  institutions: Institution[]
  search: string
  setSearch: (value: string) => void
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  closeDialog: () => void
  editing: string | null
  form: { code: string; name: string; settings: Record<string, unknown> }
  setForm: (value: { code: string; name: string; settings: Record<string, unknown> }) => void
  errors: FieldErrors<{ code: string; name: string; settings: Record<string, unknown> }>
  openNew: () => void
  openEdit: (institution: Institution) => void
  save: () => Promise<void>
  remove: (institution: Institution) => Promise<void>
  refresh: () => void
}

const emptyForm = {
  code: '',
  name: '',
  settings: {},
}

export function useInstitutions(): UseInstitutionsResult {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<{ code: string; name: string; settings: Record<string, unknown> }>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors<{ code: string; name: string; settings: Record<string, unknown> }>>({})

  function updateForm(value: { code: string; name: string; settings: Record<string, unknown> }) {
    setForm(value)
    setErrors({})
  }

  const listQuery = useQuery({
    queryKey: queryKeys.institutions,
    queryFn: async () => {
      const params = search.trim() ? { params: { term: search.trim() } } : undefined
      return (await api.get<Institution[]>('/institutions', params)).data
    },
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const saveMutation = useMutation({
    mutationFn: async (args: { payload: typeof form; editing: string | null }) => {
      if (args.editing === null) {
        return (await api.post('/institutions', args.payload)).data
      }
      return (await api.put(`/institutions/${args.editing}`, args.payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.institutions })
    },
    onError: notifyError,
  })

  const removeMutation = useMutation({
    mutationFn: (institution: Institution) => api.delete(`/institutions/${institution.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.institutions })
    },
  })

  function openNew() {
    setEditing(null)
    setForm({ ...emptyForm })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(institution: Institution) {
    setEditing(institution.id)
    setForm({
      code: institution.code,
      name: institution.name,
      settings: institution.settings,
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function save() {
    const validationErrors: FieldErrors<typeof form> = {}
    if (!form.code.trim()) validationErrors.code = requiredMessage('o código')
    else if (form.code.length > 20) validationErrors.code = maxLenMessage(20)
    if (!form.name.trim()) validationErrors.name = requiredMessage('o nome')
    else if (form.name.length > 120) validationErrors.name = maxLenMessage(120)

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

  async function remove(institution: Institution) {
    await confirm({
      title: 'Excluir instituição',
      message: `Tem certeza que deseja excluir "${institution.name}"?`,
      confirmLabel: 'Excluir',
      color: 'error',
      onConfirm: async () => {
        await removeMutation.mutateAsync(institution)
      },
    })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.institutions })
  }

  return {
    institutions: listQuery.data ?? [],
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
  }
}