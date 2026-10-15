import { Box, Card, CardContent, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'

const PALETTE_COLORS = [
  'primary', 'secondary', 'error', 'warning', 'info', 'success'
] as const
type PaletteColor = typeof PALETTE_COLORS[number]

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  isCurrency = false,
}: { title: string; value: number | string; icon: ReactNode; color?: PaletteColor; isCurrency?: boolean }) {
  const displayValue = isCurrency
    ? value
    : typeof value === 'number'
      ? value.toLocaleString('pt-BR')
      : value

  const safeColor = PALETTE_COLORS.includes(color as PaletteColor) ? color : 'primary'

  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette[safeColor].main, 0.1),
            color: (t) => t.palette[safeColor].main,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {displayValue}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}