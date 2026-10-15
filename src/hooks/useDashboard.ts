import { useEffect, useState } from 'react'
import { SseClient } from '../api/sse'
import { useError } from '../context/ErrorContext'
import { useInstitution } from '../context/InstitutionContext'
import type { Dashboard } from '../api/types'

export function useDashboard() {
  const { notifyError } = useError()
  const { selectedInstitution } = useInstitution()
  const [stats, setStats] = useState<Dashboard | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!selectedInstitution?.id) return

    const client = new SseClient({
      url: '/api/dashboard/stream',
      onMessage: (message) => {
        if (message.event === 'counters') {
          try {
            setStats(JSON.parse(message.data) as Dashboard)
            setFailed(false)
          } catch {
          }
        }
      },
      onError: (error) => {
        setFailed(true)
        notifyError(error)
      },
    })
    client.connect()
    return () => client.close()
  }, [notifyError, selectedInstitution?.id])

  return { stats, failed }
}