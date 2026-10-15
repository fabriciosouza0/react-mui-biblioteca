import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { LinearProgress } from '@mui/material'
import { api } from '../api/client'

const LoadingContext = createContext<boolean>(false)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false)
  const countRef = useRef(0)

  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      countRef.current += 1
      setPending(true)
      return config
    })
    const resId = api.interceptors.response.use(
      (response) => {
        countRef.current = Math.max(0, countRef.current - 1)
        if (countRef.current === 0) setPending(false)
        return response
      },
      (error) => {
        countRef.current = Math.max(0, countRef.current - 1)
        if (countRef.current === 0) setPending(false)
        return Promise.reject(error)
      }
    )
    return () => {
      api.interceptors.request.eject(reqId)
      api.interceptors.response.eject(resId)
    }
  }, [])

  return (
    <LoadingContext.Provider value={pending}>
      {children}
      {pending && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: (t) => t.zIndex.tooltip + 1,
          }}
        />
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading(): boolean {
  return useContext(LoadingContext)
}
