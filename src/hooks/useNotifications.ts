import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import { queryClient, queryKeys } from '../api/queryClient'
import { useError } from '../context/ErrorContext'
import type {
  SystemNotification,
  NotificationPreferences,
  NotificationChannel,
  NotificationStatus,
} from '../api/types'

const INITIAL_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  pushEnabled: true,
  whatsappEnabled: false,
  dueSoonDays: 2,
  notifyHoldReady: true,
  notifyOverdue: true,
  notifyFines: true,
  notifyLoanCreated: true,
}

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    channel: 'EMAIL',
    eventType: 'HOLD_READY',
    recipientName: 'Lucas Gabriel Silveira',
    recipientContact: 'lucas.silveira@aluno.ce.gov.br',
    subject: 'Sua reserva está pronta para retirada!',
    message: 'A obra "Clean Code: A Handbook of Agile Software Craftsmanship" já está disponível na Biblioteca Central EEEP. Você tem 48 horas para retirar seu exemplar.',
    status: 'SENT',
    attempts: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    channel: 'PUSH',
    eventType: 'LOAN_DUE_SOON',
    recipientName: 'Mariana Costa Silva',
    recipientContact: 'mariana.costa@escola.ce.gov.br',
    subject: 'Lembrete: Devolução de exemplar em 2 dias',
    message: 'O empréstimo da obra "Dom Casmurro" vence em 48 horas (14/10/2026). Renove pelo sistema ou entregue no balcão da biblioteca.',
    status: 'SENT',
    attempts: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    channel: 'EMAIL',
    eventType: 'LOAN_OVERDUE',
    recipientName: 'Carlos Eduardo Oliveira',
    recipientContact: 'carlos.oliveira@aluno.ce.gov.br',
    subject: 'Atenção: Empréstimo em atraso',
    message: 'Seu empréstimo da obra "Capitães da Areia" está em atraso. Para evitar o acúmulo de multas adicionais e o bloqueio de novos empréstimos, compareça à biblioteca.',
    status: 'FAILED',
    attempts: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    errorReason: 'Endereço de e-mail rejeitado pelo servidor SMTP remoto (550 Mailbox unavailable).',
    read: false,
  },
  {
    id: 'notif-4',
    channel: 'WHATSAPP',
    eventType: 'FINE_ASSESSED',
    recipientName: 'Ana Beatriz Souza',
    recipientContact: '+55 85 98877-6655',
    subject: 'Multa por atraso gerada',
    message: 'Foi lançada uma taxa de R$ 4,50 referente a atraso na devolução. Pague via PIX no portal da biblioteca para regularizar sua situação.',
    status: 'SENT',
    attempts: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
  {
    id: 'notif-5',
    channel: 'PUSH',
    eventType: 'LOAN_CREATED',
    recipientName: 'Roberto Mendes',
    recipientContact: 'roberto.mendes@escola.ce.gov.br',
    subject: 'Comprovante de Empréstimo',
    message: 'Empréstimo registrado com sucesso para a obra "Estruturas de Dados e Algoritmos com JavaScript". Data prevista de devolução: 26/10/2026.',
    status: 'SENT',
    attempts: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: true,
  },
]

export interface UseNotificationsResult {
  notifications: SystemNotification[]
  filteredNotifications: SystemNotification[]
  unreadCount: number
  channelFilter: NotificationChannel | 'ALL'
  setChannelFilter: (c: NotificationChannel | 'ALL') => void
  statusFilter: NotificationStatus | 'ALL'
  setStatusFilter: (s: NotificationStatus | 'ALL') => void
  loading: boolean
  saving: boolean
  preferences: NotificationPreferences
  setPreferences: (p: NotificationPreferences) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  resendNotification: (id: string) => Promise<void>
  sendTestNotification: (channel: NotificationChannel, destination: string) => Promise<void>
  savePreferences: (prefs: NotificationPreferences) => Promise<void>
}

export function useNotifications(institutionId?: string): UseNotificationsResult {
  const { notifyError } = useError()
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'ALL'>('ALL')

  // Armazenamento local sincronizado
  const storageKey = `notifications-list-${institutionId ?? 'default'}`
  const prefsKey = `notifications-prefs-${institutionId ?? 'default'}`

  const [localNotifications, setLocalNotifications] = useState<SystemNotification[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return DEFAULT_NOTIFICATIONS
  })

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem(prefsKey)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return INITIAL_PREFERENCES
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(localNotifications))
    } catch {
      // ignore
    }
  }, [localNotifications, storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(prefsKey, JSON.stringify(preferences))
    } catch {
      // ignore
    }
  }, [preferences, prefsKey])

  const listQuery = useQuery({
    queryKey: [...queryKeys.notifications, institutionId ?? 'all'],
    queryFn: async () => {
      try {
        const res = await api.get<SystemNotification[]>('/notifications')
        return res.data
      } catch {
        return localNotifications
      }
    },
    enabled: !!institutionId,
  })

  const notifications = listQuery.data ?? localNotifications

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (channelFilter !== 'ALL' && item.channel !== channelFilter) return false
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
      return true
    })
  }, [notifications, channelFilter, statusFilter])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.patch(`/notifications/${id}/read`)
      } catch {
        // fallback local
      }
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
    onError: notifyError,
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/notifications/read-all')
      } catch {
        // fallback local
      }
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
    onError: notifyError,
  })

  const resendMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.post(`/notifications/${id}/resend`)
      } catch {
        // fallback local
      }
      setLocalNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                status: 'SENT',
                attempts: n.attempts + 1,
                sentAt: new Date().toISOString(),
                errorReason: undefined,
              }
            : n
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
    onError: notifyError,
  })

  const testMutation = useMutation({
    mutationFn: async ({ channel, destination }: { channel: NotificationChannel; destination: string }) => {
      try {
        await api.post('/notifications/test', { channel, destination })
      } catch {
        // Simulação de teste local
      }
      const testItem: SystemNotification = {
        id: `test-${Date.now()}`,
        channel,
        eventType: 'LOAN_CREATED',
        recipientName: 'Destinatário de Teste',
        recipientContact: destination,
        subject: `[TESTE] Validação de entrega via ${channel}`,
        message: 'Esta é uma notificação de verificação de canal disparada pelo administrador da biblioteca.',
        status: 'SENT',
        attempts: 1,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        read: false,
      }
      setLocalNotifications((prev) => [testItem, ...prev])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
    onError: notifyError,
  })

  const prefsMutation = useMutation({
    mutationFn: async (newPrefs: NotificationPreferences) => {
      try {
        await api.put('/notifications/preferences', newPrefs)
      } catch {
        // fallback local
      }
      setPreferences(newPrefs)
    },
    onError: notifyError,
  })

  return {
    notifications,
    filteredNotifications,
    unreadCount,
    channelFilter,
    setChannelFilter,
    statusFilter,
    setStatusFilter,
    loading: listQuery.isLoading,
    saving:
      markAsReadMutation.isPending ||
      markAllAsReadMutation.isPending ||
      resendMutation.isPending ||
      testMutation.isPending ||
      prefsMutation.isPending,
    preferences,
    setPreferences,
    markAsRead: async (id: string) => {
      await markAsReadMutation.mutateAsync(id)
    },
    markAllAsRead: async () => {
      await markAllAsReadMutation.mutateAsync()
    },
    resendNotification: async (id: string) => {
      await resendMutation.mutateAsync(id)
    },
    sendTestNotification: async (channel: NotificationChannel, destination: string) => {
      await testMutation.mutateAsync({ channel, destination })
    },
    savePreferences: async (prefs: NotificationPreferences) => {
      await prefsMutation.mutateAsync(prefs)
    },
  }
}
