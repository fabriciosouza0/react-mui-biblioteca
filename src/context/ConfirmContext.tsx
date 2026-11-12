import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { useError } from './ErrorContext'

export interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  color?: 'primary' | 'error'
  onConfirm?: () => Promise<void>
}

export interface PromptOptions {
  title: string
  message?: ReactNode
  inputLabel?: string
  placeholder?: string
  defaultValue?: string
  required?: boolean
  confirmLabel?: string
  cancelLabel?: string
  color?: 'primary' | 'error'
  multiline?: boolean
  rows?: number
  onConfirm?: (value: string) => Promise<void>
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
}

type DialogRequest =
  | ({ type: 'confirm' } & ConfirmOptions & { id: number; resolve: (value: boolean) => void })
  | ({ type: 'prompt' } & PromptOptions & { id: number; resolve: (value: string | null) => void })

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { notifyError } = useError()
  const [current, setCurrent] = useState<DialogRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const queueRef = useRef<DialogRequest[]>([])
  const idRef = useRef(0)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const request: DialogRequest = { ...options, type: 'confirm', id: ++idRef.current, resolve }
      setCurrent((cur) => {
        if (cur) {
          queueRef.current.push(request)
          return cur
        }
        return request
      })
    })
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      const request: DialogRequest = { ...options, type: 'prompt', id: ++idRef.current, resolve }
      setCurrent((cur) => {
        if (cur) {
          queueRef.current.push(request)
          return cur
        }
        setInputValue(options.defaultValue ?? '')
        return request
      })
    })
  }, [])

  function close() {
    setLoading(false)
    setInputValue('')
    const next = queueRef.current.shift()
    if (next && next.type === 'prompt') {
      setInputValue(next.defaultValue ?? '')
    }
    setCurrent(next ?? null)
  }

  async function handleConfirm() {
    if (!current) return
    if (current.type === 'confirm') {
      if (!current.onConfirm) {
        current.resolve(true)
        close()
        return
      }
      setLoading(true)
      try {
        await current.onConfirm()
        current.resolve(true)
        close()
      } catch (err) {
        notifyError(err)
        setLoading(false)
      }
    } else {
      const val = inputValue.trim()
      if (current.onConfirm) {
        setLoading(true)
        try {
          await current.onConfirm(val)
          current.resolve(val)
          close()
        } catch (err) {
          notifyError(err)
          setLoading(false)
        }
      } else {
        current.resolve(val)
        close()
      }
    }
  }

  function handleCancel() {
    if (!current) return
    if (current.type === 'confirm') {
      current.resolve(false)
    } else {
      current.resolve(null)
    }
    close()
  }

  const isPrompt = current?.type === 'prompt'
  const isRequired = isPrompt && current.required
  const canSubmit = !isRequired || inputValue.trim().length > 0

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      <Dialog
        open={!!current}
        onClose={loading ? undefined : handleCancel}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{current?.title}</DialogTitle>
        <DialogContent>
          {current?.message}
          {isPrompt && (
            <TextField
              autoFocus
              margin="dense"
              fullWidth
              size="small"
              label={current.inputLabel ?? 'Valor'}
              placeholder={current.placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              multiline={current.multiline}
              rows={current.rows ?? (current.multiline ? 3 : 1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !current.multiline && canSubmit && !loading) {
                  e.preventDefault()
                  handleConfirm()
                }
              }}
              sx={{ mt: current.message ? 2 : 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={loading}>
            {current?.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button
            variant="contained"
            color={current?.color ?? 'error'}
            onClick={handleConfirm}
            disabled={loading || !canSubmit}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {current?.confirmLabel ?? 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider')
  return ctx
}

