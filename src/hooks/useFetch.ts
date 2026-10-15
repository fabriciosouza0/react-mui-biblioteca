import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useError } from '../context/ErrorContext'

export function useFetch<T>(url: string): T | undefined {
  const { notifyError } = useError()
  const { data, error } = useQuery({
    queryKey: [url],
    queryFn: async () => (await api.get<T>(url)).data,
  })

  useEffect(() => {
    if (error) notifyError(error)
  }, [error, notifyError])

  return data
}
