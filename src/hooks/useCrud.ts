import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import { useConfirm } from '../context/ConfirmContext'
import type { FieldErrors } from '../utils/validation'

export interface UseCrudOptions<T, TRequest> {
  basePath: string
  entityName: string
  emptyForm: TRequest
  idOf: (item: T) => string | number
  labelOf: (item: T) => string
  searchParam?: string
  toForm?: (item: T) => TRequest
  toPayload?: (form: TRequest, editing: string | number | null) => unknown
  buildNew?: () => TRequest
  removerMessage?: (item: T) => string
  validate?: (form: TRequest) => FieldErrors<TRequest>
}

export interface UseCrudResult<T, TRequest> {
  itens: T[]
  busca: string
  setBusca: (value: string) => void
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  closeDialog: () => void
  editing: string | number | null
  form: TRequest
  setForm: (value: TRequest) => void
  errors: FieldErrors<TRequest>
  abrirNovo: () => void
  abrirEdicao: (item: T) => void
  salvar: () => Promise<void>
  remover: (item: T) => Promise<void>
}

export function useCrud<T, TRequest>(options: UseCrudOptions<T, TRequest>): UseCrudResult<T, TRequest> {
  const {
    basePath,
    entityName,
    emptyForm,
    idOf,
    labelOf,
    searchParam,
    toForm,
    toPayload,
    buildNew,
    removerMessage,
    validate,
  } = options
  const { notifyError } = useError()
  const { confirm } = useConfirm()
  const [busca, setBusca] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<string | number | null>(null)
  const [form, setForm] = useState<TRequest>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors<TRequest>>({})

  function atualizarForm(value: TRequest) {
    setForm(value)
    setErrors({})
  }

  const listQuery = useQuery({
    queryKey: [basePath, busca],
    queryFn: async () => {
      const params = busca.trim() && searchParam ? { params: { [searchParam]: busca.trim() } } : undefined
      return (await api.get<T[]>(basePath, params)).data
    },
  })

  useEffect(() => {
    if (listQuery.error) notifyError(listQuery.error)
  }, [listQuery.error, notifyError])

  const salvarMutation = useMutation({
    mutationFn: async (args: { payload: unknown; editing: string | number | null }) =>
      args.editing === null
        ? (await api.post(basePath, args.payload)).data
        : (await api.put(`${basePath}/${args.editing}`, args.payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [basePath] }),
    onError: notifyError,
  })

  const removerMutation = useMutation({
    mutationFn: (item: T) => api.delete(`${basePath}/${idOf(item)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [basePath] }),
  })

  function abrirNovo() {
    setEditing(null)
    setForm(buildNew ? buildNew() : { ...emptyForm })
    setErrors({})
    setDialogOpen(true)
  }

  function abrirEdicao(item: T) {
    setEditing(idOf(item))
    setForm(toForm ? toForm(item) : { ...emptyForm })
    setErrors({})
    setDialogOpen(true)
  }

  async function salvar() {
    const validationErrors = validate ? validate(form) : {}
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    try {
      const payload = toPayload ? toPayload(form, editing) : form
      await salvarMutation.mutateAsync({ payload, editing })
      setErrors({})
      setDialogOpen(false)
    } catch {
      // erro já exibido via onError da mutação
    }
  }

  async function remover(item: T) {
    await confirm({
      title: `Excluir ${entityName}`,
      message: removerMessage
        ? removerMessage(item)
        : `Tem certeza que deseja excluir ${entityName} "${labelOf(item)}"?`,
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        await removerMutation.mutateAsync(item)
      },
    })
  }

  return {
    itens: listQuery.data ?? [],
    busca,
    setBusca,
    loading: listQuery.isLoading,
    saving: salvarMutation.isPending || removerMutation.isPending,
    dialogOpen,
    closeDialog: () => setDialogOpen(false),
    editing,
    form,
    setForm: atualizarForm,
    errors,
    abrirNovo,
    abrirEdicao,
    salvar,
    remover,
  }
}