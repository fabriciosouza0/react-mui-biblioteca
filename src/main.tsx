import { useMemo, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App'
import { getTheme } from './theme'
import { queryClient } from './api/queryClient'
import { ThemeModeProvider, useThemeMode } from './context/ThemeModeContext'
import { AuthProvider } from './context/AuthContext'
import { InstitutionProvider } from './context/InstitutionContext'
import { LibraryProvider } from './context/LibraryContext'
import { ErrorProvider } from './context/ErrorContext'
import { LoadingProvider } from './context/LoadingContext'
import { ConfirmProvider } from './context/ConfirmContext'

function AppWithTheme() {
  const { resolvedMode } = useThemeMode()
  const theme = useMemo(() => getTheme(resolvedMode), [resolvedMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <ErrorProvider>
            <ConfirmProvider>
              <BrowserRouter>
                <AuthProvider>
                  <InstitutionProvider>
                    <LibraryProvider>
                      <App />
                    </LibraryProvider>
                  </InstitutionProvider>
                </AuthProvider>
              </BrowserRouter>
            </ConfirmProvider>
          </ErrorProvider>
        </LoadingProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeModeProvider>
      <AppWithTheme />
    </ThemeModeProvider>
  </StrictMode>,
)
