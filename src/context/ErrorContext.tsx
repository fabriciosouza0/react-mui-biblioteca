import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Alert, Snackbar } from '@mui/material'
import { errorMessage } from '../api/client'

interface ErrorItem {
  id: number
  message: string
}

interface ErrorContextValue {
  showError: (message: string) => void
  notifyError: (err: unknown) => void
}

const ErrorContext = createContext<ErrorContextValue | null>(null)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ErrorItem | null>(null)
  const queueRef = useRef<ErrorItem[]>([])
  const idRef = useRef(0)

  const showError = useCallback((message: string) => {
    const item = { id: ++idRef.current, message }
    setCurrent((cur) => {
      if (cur) {
        queueRef.current.push(item)
        return cur
      }
      return item
    })
  }, [])

  const notifyError = useCallback(
    (err: unknown) => {
      showError(errorMessage(err))
    },
    [showError]
  )

  function dismiss() {
    const next = queueRef.current.shift()
    setCurrent(next ?? null)
  }

  return (
    <ErrorContext.Provider value={{ showError, notifyError }}>
      {children}
      <Snackbar
        open={!!current}
        autoHideDuration={6000}
        onClose={dismiss}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" variant="filled" onClose={dismiss}>
          {current?.message}
        </Alert>
      </Snackbar>
    </ErrorContext.Provider>
  )
}

export function useError(): ErrorContextValue {
  const ctx = useContext(ErrorContext)
  if (!ctx) throw new Error('useError deve ser usado dentro de ErrorProvider')
  return ctx
}
