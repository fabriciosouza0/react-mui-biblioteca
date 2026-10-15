import { createTheme, type Theme } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark'

const shape = { borderRadius: 10 }

const typography = {
  fontFamily: `'Inter', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`,
  h4: { fontWeight: 700 },
  h5: { fontWeight: 700 },
  h6: { fontWeight: 600 },
  button: { textTransform: 'none', fontWeight: 600 },
} as const

function baseTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: {
      mode,
      primary:
        mode === 'light'
          ? { main: '#1E3A5F', light: '#2563EB', dark: '#172554', contrastText: '#FFFFFF' }
          : { main: '#3B82F6', light: '#60A5FA', dark: '#1D4ED8', contrastText: '#FFFFFF' },
      secondary:
        mode === 'light'
          ? { main: '#059669', light: '#10B981', dark: '#047857', contrastText: '#FFFFFF' }
          : { main: '#10B981', light: '#34D399', dark: '#059669', contrastText: '#FFFFFF' },
      background:
        mode === 'light'
          ? { default: '#F8FAFC', paper: '#FFFFFF' }
          : { default: '#0F172A', paper: '#1E293B' },
      text:
        mode === 'light'
          ? { primary: '#1E293B', secondary: '#64748B' }
          : { primary: '#F1F5F9', secondary: '#94A3B8' },
      divider: mode === 'light' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.16)',
    },
    shape,
    typography,
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderRadius: 10,
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 14,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 14 },
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
            boxShadow: 'none',
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16 },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontWeight: 700, fontSize: '1.1rem' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            fontWeight: 600,
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            letterSpacing: '0.02em',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
          root: ({ theme }) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
            paddingTop: 12,
            paddingBottom: 12,
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            '&.MuiToolbar-regular': { minHeight: 64 },
          },
        },
      },
    },
  })
}

export function getTheme(mode: ThemeMode): Theme {
  return baseTheme(mode)
}
