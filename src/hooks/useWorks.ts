import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Work,
  WorkFormData,
} from '../api/types'
import type { FieldErrors } from '../utils/validation'
import { requiredMessage, maxLenMessage, MAX } from '../utils/validation'
import { parseAuthors } from '../components/AuthorsFieldArray'

export interface UseWorksResult {
  works: Work[]
  search: string
  setSearch: (value: string) => void
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  closeDialog: () => void
  editing: string | null
  form: WorkFormData
  setForm: (value: WorkFormData) => void
  errors: FieldErrors<WorkFormData>
  openNew: () => void
  openEdit: (work: Work) => void
  save: () => Promise<void>
  remove: (work: Work) => Promise<void>
  enrichFromIsbn: (isbn13: string) => Promise<void>
  refresh: () => void
  depsDialogOpen: boolean
  depsWorkId: string | null
  depsWorkTitle: string
  openDepsDialog: (work: Work) => void
  closeDepsDialog: () => void
  deleteAfterDeps: () => Promise<void>
}

const emptyForm: WorkFormData = {
  institutionId: '',
  isbn13: '',
  title: '',
  authors: '[]',
  publisher: '',
  publishedYear: '',
  edition: '',
  cdu: '',
  coverUrl: '',
  description: '',
}

export function useWorks(institutionId?: string, enabled: boolean = true): UseWorksResult {
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<WorkFormData>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors<WorkFormData>>({})
  const [depsDialogOpen, setDepsDialogOpen] = useState(false)
  const [depsWork, setDepsWork] = useState<Work | null>(null)

  const buildUrl = (path: string) => path

  function updateForm(value: WorkFormData) {
    setForm(value)
    setErrors({})
  }

  const listQuery = useQuery({
    queryKey: [...queryKeys.works, institutionId ?? 'all', search],
    queryFn: async () => {
      const params = search.trim()
        ? { params: { term: search.trim() } }
        : undefined
      return (await api.get<Work[]>(buildUrl('/works'), params)).data
    },
    enabled: !!institutionId && enabled,
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const saveMutation = useMutation({
    mutationFn: async (args: { payload: WorkFormData; editing: string | null }) => {
      if (args.editing === null) {
        return (await api.post(buildUrl('/works'), args.payload)).data
      }
      return (await api.put(`${buildUrl('/works')}/${args.editing}`, args.payload)).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.works })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: notifyError,
  })

  const removeMutation = useMutation({
    mutationFn: (work: Work) => api.delete(`${buildUrl('/works')}/${work.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.works })
      if (institutionId) queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
    },
    onError: () => {},
  })

  const enrichMutation = useMutation({
    mutationFn: (isbn13: string) => api.post(buildUrl(`/works/enrich/${isbn13}`)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.works })
    },
    onError: notifyError,
  })

  function openNew() {
    setEditing(null)
    setForm({ ...emptyForm, institutionId: institutionId ?? '' })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(work: Work) {
    setEditing(work.id)
    setForm({
      institutionId: work.institutionId,
      isbn13: work.isbn13 ?? '',
      title: work.title,
      authors: work.authors,
      publisher: work.publisher ?? '',
      publishedYear: work.publishedYear ?? '',
      edition: work.edition ?? '',
      cdu: work.cdu ?? '',
      coverUrl: work.coverUrl ?? '',
      description: work.description ?? '',
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function save() {
    const validationErrors: FieldErrors<WorkFormData> = {}
    if (!form.institutionId.trim()) validationErrors.institutionId = requiredMessage('a instituição')
    if (!form.title.trim()) validationErrors.title = requiredMessage('o título')
    else if (form.title.length > MAX.TITULO) validationErrors.title = maxLenMessage(MAX.TITULO)
    const authorsList = parseAuthors(form.authors)
    if (authorsList.length === 0 || !authorsList.some((a) => a.name.trim().length > 0)) {
      validationErrors.authors = 'Informe ao menos um autor para a obra'
    }
    if (form.isbn13 && form.isbn13.length > 20) validationErrors.isbn13 = 'ISBN muito longo'
    if (form.publisher && form.publisher.length > 120) validationErrors.publisher = maxLenMessage(120)
    if (form.edition && form.edition.length > 30) validationErrors.edition = maxLenMessage(30)
    if (form.cdu && form.cdu.length > 30) validationErrors.cdu = maxLenMessage(30)
    if (form.coverUrl && form.coverUrl.length > 500) validationErrors.coverUrl = maxLenMessage(500)

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

  async function enrichFromIsbn(isbn13: string) {
    if (!isbn13.trim()) {
      notifyError(new Error('Informe o ISBN'))
      return
    }
    try {
      await enrichMutation.mutateAsync(isbn13.trim())
    } catch {
      // error handled by mutation
    }
  }

  async function remove(work: Work) {
    await confirm({
      title: 'Excluir obra',
      message: `Tem certeza que deseja excluir "${work.title}"?`,
      confirmLabel: 'Excluir',
      color: 'error',
      onConfirm: async () => {
        try {
          await removeMutation.mutateAsync(work)
        } catch (err: unknown) {
          if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as { response?: { status?: number } }
            if (axiosErr.response?.status === 409) {
              openDepsDialog(work)
              return
            }
          }
          notifyError(err)
        }
      },
    })
  }

  function openDepsDialog(work: Work) {
    setDepsWork(work)
    setDepsDialogOpen(true)
  }

  function closeDepsDialog() {
    setDepsDialogOpen(false)
    setDepsWork(null)
  }

  async function deleteAfterDeps() {
    if (!depsWork) return
    try {
      await removeMutation.mutateAsync(depsWork)
      closeDepsDialog()
    } catch {
      notifyError(new Error('Erro ao excluir obra'))
    }
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.works })
  }

  return {
    works: listQuery.data ?? [],
    search,
    setSearch,
    loading: listQuery.isLoading,
    saving: saveMutation.isPending || removeMutation.isPending || enrichMutation.isPending,
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
    enrichFromIsbn,
    refresh,
    depsDialogOpen,
    depsWorkId: depsWork?.id ?? null,
    depsWorkTitle: depsWork?.title ?? '',
    openDepsDialog,
    closeDepsDialog,
    deleteAfterDeps,
  }
}