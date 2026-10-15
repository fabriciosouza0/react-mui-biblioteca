import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Library,
  LibraryFormData,
} from '../api/types'
import type { FieldErrors } from '../utils/validation'
import { requiredMessage, maxLenMessage } from '../utils/validation'

export interface UseLibrariesResult {
  libraries: Library[]
  search: string
  setSearch: (value: string) => void
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  closeDialog: () => void
  editing: string | null
  form: LibraryFormData
  setForm: (value: LibraryFormData) => void
  errors: FieldErrors<LibraryFormData>
  openNew: () => void
  openEdit: (library: Library) => void
  save: () => Promise<void>
  remove: (library: Library) => Promise<void>
  refresh: () => void
}

const emptyForm: LibraryFormData = {
  institutionId: '',
  name: '',
  isCentral: false,
}

export function useLibraries(institutionId?: string, enabled: boolean = true): UseLibrariesResult {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<LibraryFormData>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors<LibraryFormData>>({})

  const buildUrl = (path: string) => path

  function updateForm(value: LibraryFormData) {
    setForm(value)
    setErrors({})
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.libraries, institutionId ?? 'all', search],
    queryFn: async () => {
      const params = search.trim() ? { params: { term: search.trim() } } : undefined
      return (await api.get<Library[]>(buildUrl('/libraries'), params)).data
    },
    enabled: !!institutionId && enabled,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const saveMutation = useMutation({
    mutationFn: async (args: { payload: LibraryFormData; editing: string | null }) => {
      if (args.editing === null) {
        return (await api.post(buildUrl('/libraries'), args.payload)).data
      }
      return (await api.put(`${buildUrl('/libraries')}/${args.editing}`, args.payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraries })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const removeMutation = useMutation({
    mutationFn: (library: Library) => api.delete(`${buildUrl('/libraries')}/${library.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraries })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
  })

  function openNew() {
    setEditing(null)
    setForm({ ...emptyForm, institutionId: institutionId ?? '' })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(library: Library) {
    setEditing(library.id)
    setForm({
      institutionId: library.institutionId,
      name: library.name,
      isCentral: library.isCentral,
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function save() {
    const validationErrors: FieldErrors<LibraryFormData> = {}
    if (!form.institutionId.trim()) validationErrors.institutionId = requiredMessage('a instituição')
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

  async function remove(library: Library) {
    await confirm({
      title: 'Excluir filial',
      message: `Tem certeza que deseja excluir "${library.name}"?`,
      confirmLabel: 'Excluir',
      color: 'error',
      onConfirm: async () => {
        await removeMutation.mutateAsync(library)
      },
    })
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.libraries })
  }

  return {
    libraries: listQuery.data ?? [],
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