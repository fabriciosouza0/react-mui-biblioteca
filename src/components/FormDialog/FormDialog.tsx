import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, type TextFieldProps } from '@mui/material'
import type { ReactNode } from 'react'
import { stripDigits } from '../../utils/validation'

interface FormDialogProps {
  open: boolean
  onClose: () => void
  title: string
  saving?: boolean
  submitLabel?: string
  savingLabel?: string
  onSubmit: () => void
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
}

type FieldProps = TextFieldProps & { children?: ReactNode; lettersOnly?: boolean; maxLength?: number }

export default function FormDialog({
  open,
  onClose,
  title,
  saving = false,
  submitLabel = 'Salvar',
  savingLabel = 'Salvando...',
  onSubmit,
  children,
  maxWidth = 'sm',
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>{children}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

FormDialog.Field = function Field({ lettersOnly, onChange, ...props }: FieldProps) {
  return (
    <TextField
      {...props}
      onChange={
        lettersOnly
          ? (e) => {
              e.target.value = stripDigits(e.target.value)
              onChange?.(e)
            }
          : onChange
      }
    />
  )
}

FormDialog.Select = function Select(props: FieldProps) {
  return <TextField select {...props} />
}
