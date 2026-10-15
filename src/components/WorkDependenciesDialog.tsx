import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { Delete } from '@mui/icons-material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { useError } from '../context/ErrorContext'
import { queryClient, queryKeys } from '../api/queryClient'
import { ITEM_STATUS_LABELS, type WorkDependenciesResponse } from '../api/types'

interface WorkDependenciesDialogProps {
  open: boolean
  workId: string | null
  workTitle: string
  institutionId: string
  onClose: () => void
  onDeleted: () => void
}

export default function WorkDependenciesDialog({
  open,
  workId,
  workTitle,
  institutionId,
  onClose,
  onDeleted,
}: WorkDependenciesDialogProps) {
  const { notifyError } = useError()
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const { data: deps, isLoading } = useQuery({
    queryKey: ['workDependencies', workId],
    queryFn: async () => {
      const { data } = await api.get<WorkDependenciesResponse>(
        `/works/${workId}/dependencies`
      )
      return data
    },
    enabled: open && !!workId,
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      setDeletingItemId(itemId)
      await api.delete(`/items/${itemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workDependencies', workId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.works })
      queryClient.invalidateQueries({ queryKey: ['dashboard', institutionId] })
      setDeletingItemId(null)
    },
    onError: (err) => {
      notifyError(err)
      setDeletingItemId(null)
    },
  })

  const hasDependencies = deps && (deps.items.length > 0 || deps.holds.length > 0)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Dependências da obra
      </DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !deps || (!hasDependencies) ? (
          <Alert severity="success">
            Nenhuma dependência encontrada. Você pode excluir esta obra.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              A obra <strong>"{workTitle}"</strong> possui vinculações que impedem sua exclusão.
              Remova os itens abaixo para poder excluir a obra.
            </Typography>

            {deps.items.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Exemplares ({deps.items.length})
                </Typography>
                <List dense disablePadding sx={{ mb: 2 }}>
                  {deps.items.map((item) => (
                    <ListItem
                      key={item.id}
                      disableGutters
                      secondaryAction={
                        <IconButton
                          edge="end"
                          color="error"
                          size="small"
                          disabled={deletingItemId === item.id}
                          onClick={() => deleteItemMutation.mutate(item.id)}
                        >
                          {deletingItemId === item.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <Delete fontSize="small" />
                          )}
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{item.barcode}</span>
                            <Chip
                              size="small"
                              label={ITEM_STATUS_LABELS[item.status as keyof typeof ITEM_STATUS_LABELS] ?? item.status}
                              color={item.status === 'AVAILABLE' ? 'success' : item.status === 'ON_LOAN' ? 'warning' : 'default'}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={`${item.libraryName}${item.callNumber ? ` · CD ${item.callNumber}` : ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {deps.holds.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                  Reservas ({deps.holds.length})
                </Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  As reservas precisam ser canceladas manualmente pela tela de reservas.
                </Alert>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        {deps && !hasDependencies && (
          <Button
            variant="contained"
            color="error"
            onClick={onDeleted}
          >
            Excluir obra
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
