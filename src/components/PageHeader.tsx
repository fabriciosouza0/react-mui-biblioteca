import { Box, TextField, Typography } from '@mui/material'
import { Search } from '@mui/icons-material'

interface PageHeaderProps {
  title: string
  subtitle?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  action?: React.ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  action,
}: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {searchValue !== undefined && onSearchChange && (
        <TextField
          placeholder={searchPlaceholder ?? 'Buscar...'}
          size="small"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            },
          }}
        />
      )}
      {action}
    </Box>
  )
}
