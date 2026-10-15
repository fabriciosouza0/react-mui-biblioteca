import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useError } from './ErrorContext'

export interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  color?: 'primary' | 'error'
  onConfirm?: () => Promise<void>
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

interface ConfirmRequest extends ConfirmOptions {
  id: number
  resolve: (value: boolean) => void
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { notifyError } = useError()
  const [current, setCurrent] = useState<ConfirmRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const queueRef = useRef<ConfirmRequest[]>([])
  const idRef = useRef(0)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const request: ConfirmRequest = { ...options, id: ++idRef.current, resolve }
      setCurrent((cur) => {
        if (cur) {
          queueRef.current.push(request)
          return cur
        }
        return request
      })
    })
  }, [])

  function close() {
    setLoading(false)
    const next = queueRef.current.shift()
    setCurrent(next ?? null)
  }

  async function handleConfirm() {
    if (!current) return
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
  }

  function handleCancel() {
    if (!current) return
    current.resolve(false)
    close()
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={!!current}
        onClose={loading ? undefined : handleCancel}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{current?.title}</DialogTitle>
        <DialogContent>{current?.message}</DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={loading}>
            {current?.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button
            variant="contained"
            color={current?.color ?? 'error'}
            onClick={handleConfirm}
            disabled={loading}
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
