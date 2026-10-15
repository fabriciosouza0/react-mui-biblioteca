import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const queryKeys = {
  institutions: ['institutions'] as const,
  libraries: ['libraries'] as const,
  profileConfigs: ['profileConfigs'] as const,
  patrons: ['patrons'] as const,
  works: ['works'] as const,
  items: ['items'] as const,
  loans: ['loans'] as const,
  holds: ['holds'] as const,
  fines: ['fines'] as const,
  dashboard: ['dashboard'] as const,
  reports: ['reports'] as const,
  notifications: ['notifications'] as const,
  observability: ['observability'] as const,
} as const