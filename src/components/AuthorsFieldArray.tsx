import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Chip,
  FormHelperText,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, DeleteOutline, Person } from '@mui/icons-material'

export type AuthorRole = 'author' | 'co_author' | 'editor' | 'translator' | 'illustrator'

export interface AuthorItem {
  id: string
  name: string
  role: AuthorRole
}

export const AUTHOR_ROLE_OPTIONS: { value: AuthorRole; label: string }[] = [
  { value: 'author', label: 'Autor(a) Principal' },
  { value: 'co_author', label: 'Coautor(a)' },
  { value: 'editor', label: 'Organizador(a) / Editor(a)' },
  { value: 'translator', label: 'Tradutor(a)' },
  { value: 'illustrator', label: 'Ilustrador(a)' },
]

export const AUTHOR_ROLE_LABELS: Record<string, string> = {
  author: 'Autor(a)',
  co_author: 'Coautor(a)',
  editor: 'Organizador(a)',
  translator: 'Tradutor(a)',
  illustrator: 'Ilustrador(a)',
}

let nextId = 0
function genId() {
  nextId += 1
  return `author-${Date.now()}-${nextId}`
}

export function parseAuthors(raw: string | undefined): AuthorItem[] {
  if (!raw || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === 'string') {
          return { id: genId(), name: item, role: 'author' }
        }
        if (typeof item === 'object' && item !== null) {
          return {
            id: genId(),
            name: item.name ?? '',
            role: (item.role as AuthorRole) ?? 'author',
          }
        }
        return { id: genId(), name: String(item), role: 'author' }
      })
    }
    if (typeof parsed === 'object' && parsed !== null && parsed.name) {
      return [{ id: genId(), name: parsed.name, role: (parsed.role as AuthorRole) ?? 'author' }]
    }
  } catch {
    // Caso o valor seja string simples ou separado por vírgula
    if (raw.includes(',')) {
      return raw
        .split(',')
        .map((name) => ({
          id: genId(),
          name: name.trim(),
          role: 'author' as AuthorRole,
        }))
        .filter((a) => a.name.length > 0)
    }
    return [{ id: genId(), name: raw.trim(), role: 'author' }]
  }
  return []
}

export function serializeAuthors(authors: AuthorItem[]): string {
  const filtered = authors
    .filter((a) => a.name.trim().length > 0)
    .map((a) => ({
      name: a.name.trim(),
      role: a.role || 'author',
    }))
  return JSON.stringify(filtered)
}

interface AuthorsFieldArrayProps {
  value: string
  onChange: (serializedJson: string) => void
  error?: string
  disabled?: boolean
}

export default function AuthorsFieldArray({
  value,
  onChange,
  error,
  disabled = false,
}: AuthorsFieldArrayProps) {
  const [items, setItems] = useState<AuthorItem[]>(() => {
    const parsed = parseAuthors(value)
    return parsed.length > 0 ? parsed : [{ id: genId(), name: '', role: 'author' }]
  })

  // Sincroniza quando o valor externo muda (ex: reset do formulário ou carregar obra para edição)
  useEffect(() => {
    const parsed = parseAuthors(value)
    const currentSerialized = serializeAuthors(items)
    const incomingSerialized = serializeAuthors(parsed)

    if (currentSerialized !== incomingSerialized) {
      setItems(parsed.length > 0 ? parsed : [{ id: genId(), name: '', role: 'author' }])
    }
  }, [value])

  const notifyChange = (newItems: AuthorItem[]) => {
    setItems(newItems)
    onChange(serializeAuthors(newItems))
  }

  const handleAdd = () => {
    const newItems: AuthorItem[] = [
      ...items,
      {
        id: genId(),
        name: '',
        role: items.length === 0 ? 'author' : 'co_author',
      },
    ]
    notifyChange(newItems)
  }

  const handleChange = (index: number, field: 'name' | 'role', val: string) => {
    const newItems = items.map((item, i) => {
      if (i !== index) return item
      return { ...item, [field]: val }
    })
    notifyChange(newItems)
  }

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    if (newItems.length === 0) {
      // Mantém sempre pelo menos 1 linha para entrada se tudo for removido
      notifyChange([{ id: genId(), name: '', role: 'author' }])
    } else {
      notifyChange(newItems)
    }
  }

  const validAuthorsCount = items.filter((i) => i.name.trim().length > 0).length

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Cabeçalho do FieldArray */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Autores da Obra *
          </Typography>
          <Chip
            label={`${validAuthorsCount} ${validAuthorsCount === 1 ? 'autor' : 'autores'}`}
            size="small"
            variant="outlined"
            color={validAuthorsCount > 0 ? 'primary' : 'default'}
          />
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAdd}
          disabled={disabled}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Adicionar Autor
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Informe os autores, coautores ou organizadores responsáveis pela obra.
      </Typography>

      {/* Lista Dinâmica de Campos (FieldArray) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {items.map((item, index) => (
          <Paper
            key={item.id}
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.default',
              borderColor: error && !item.name.trim() ? 'error.light' : 'divider',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <Chip
              label={`#${index + 1}`}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                minWidth: 32,
                height: 24,
                bgcolor: index === 0 ? 'primary.light' : 'action.selected',
                color: index === 0 ? 'primary.contrastText' : 'text.secondary',
              }}
            />

            <TextField
              size="small"
              label={index === 0 ? 'Nome do autor(a) principal' : 'Nome do coautor(a)'}
              placeholder="Ex: Machado de Assis"
              value={item.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              disabled={disabled}
              fullWidth
              sx={{ flex: { sm: 2 } }}
              required
            />

            <TextField
              select
              size="small"
              label="Função"
              value={item.role}
              onChange={(e) => handleChange(index, 'role', e.target.value)}
              disabled={disabled}
              sx={{ minWidth: 160, flex: { sm: 1.2 } }}
            >
              {AUTHOR_ROLE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <Tooltip title={items.length > 1 ? 'Remover autor' : 'Limpar campo'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  aria-label={`Remover autor ${index + 1}`}
                  sx={{ ml: 'auto' }}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Paper>
        ))}
      </Box>

      {error && (
        <FormHelperText error sx={{ mt: 1, fontWeight: 500 }}>
          {error}
        </FormHelperText>
      )}
    </Box>
  )
}
