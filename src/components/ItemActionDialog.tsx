import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import type { Item, Library } from '../api/types'

export type ItemActionMode = 'TRANSFER' | 'WITHDRAW'

interface ItemActionDialogProps {
  open: boolean
  mode: ItemActionMode | null
  item: Item | null
  libraries: Library[]
  loading?: boolean
  onClose: () => void
  onConfirmTransfer: (targetLibraryId: string, note?: string) => Promise<void>
  onConfirmWithdraw: (reason: string) => Promise<void>
}

export default function ItemActionDialog({
  open,
  mode,
  item,
  libraries,
  loading = false,
  onClose,
  onConfirmTransfer,
  onConfirmWithdraw,
}: ItemActionDialogProps) {
  const [targetLibraryId, setTargetLibraryId] = useState('')
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setTargetLibraryId('')
      setNote('')
      setReason('')
      setError('')
    }
  }, [open, item, mode])

  if (!item || !mode) return null

  const isTransfer = mode === 'TRANSFER'
  const availableLibraries = libraries.filter((lib) => lib.id !== item.libraryId)

  const handleSubmit = async () => {
    if (isTransfer) {
      if (!targetLibraryId) {
        setError('Selecione a filial de destino')
        return
      }
      setError('')
      await onConfirmTransfer(targetLibraryId, note.trim() || undefined)
    } else {
      if (!reason.trim()) {
        setError('Informe o motivo da retirada')
        return
      }
      setError('')
      await onConfirmWithdraw(reason.trim())
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isTransfer ? 'Transferir exemplar entre filiais' : 'Retirar exemplar do acervo'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2.5, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Obra:</strong> {item.workTitle ?? item.workId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Exemplar:</strong> <span style={{ fontFamily: 'monospace' }}>{item.barcode}</span>
            {item.callNumber && ` (Call Number: ${item.callNumber})`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Filial atual:</strong> {item.libraryName ?? item.libraryId}
          </Typography>
        </Box>

        {isTransfer ? (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              select
              label="Filial de destino"
              value={targetLibraryId}
              onChange={(e) => {
                setTargetLibraryId(e.target.value)
                if (error) setError('')
              }}
              error={!!error}
              helperText={error}
              fullWidth
              autoFocus
            >
              {availableLibraries.length === 0 ? (
                <MenuItem disabled value="">
                  Nenhuma outra filial disponível
                </MenuItem>
              ) : (
                availableLibraries.map((lib) => (
                  <MenuItem key={lib.id} value={lib.id}>
                    {lib.name} {lib.isCentral ? '(Central)' : ''}
                  </MenuItem>
                ))
              )}
            </TextField>
            <TextField
              label="Justificativa da transferência (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={3}
              placeholder="Ex.: Remanejamento para unidade Centro, atendimento à reserva..."
              fullWidth
            />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Motivo da retirada"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              error={!!error}
              helperText={error || 'Informe uma justificativa para retirar este exemplar do acervo.'}
              multiline
              rows={3}
              placeholder="Ex.: Exemplar danificado, extraviado, desgaste físico irreversível..."
              fullWidth
              autoFocus
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={isTransfer ? 'primary' : 'error'}
          onClick={handleSubmit}
          disabled={loading || (isTransfer && availableLibraries.length === 0)}
        >
          {loading
            ? (isTransfer ? 'Transferindo...' : 'Retirando...')
            : (isTransfer ? 'Transferir' : 'Retirar do acervo')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
