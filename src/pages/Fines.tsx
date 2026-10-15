import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import { Cancel, Delete, Payments, Visibility } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import FormDialog from '../components/FormDialog/FormDialog'
import { useFines } from '../hooks/useFines'
import { useInstitution } from '../context/InstitutionContext'
import { FINE_STATUS_LABELS, FINE_TYPE_LABELS } from '../api/types'
import { formatISODate } from '../utils/validation'
import { FormControl, InputLabel, Select } from '@mui/material'

export default function Fines() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    fines,
    totalElements,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    saving,
    paymentOpen,
    paymentForm,
    setPaymentForm,
    paymentErrors,
    openPayment,
    closePayment,
    payFine,
    waiveFine,
    writeOffFine,
    statusOptions,
    formatCents,
  } = useFines(institutionId)

  if (instLoading || !institutionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title="Multas"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por locatário, tipo ou motivo"
        action={
          <>
            <FormControl size="small" sx={{ minWidth: 180, mr: 1 }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        }
      />
      {loading && fines.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Locatário</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Saldo</TableCell>
                <TableCell>Data avaliação</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fines.map((fine) => (
                <TableRow key={fine.id} hover>
                  <TableCell>{fine.id.slice(0, 8)}</TableCell>
                  <TableCell>{fine.patronName ? `${fine.patronName}${fine.patronExternalId ? ` (${fine.patronExternalId})` : ''}` : fine.patronId.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Chip label={FINE_TYPE_LABELS[fine.type] ?? fine.type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{formatCents(fine.amountCents)}</TableCell>
                  <TableCell>{formatCents(fine.balanceCents)}</TableCell>
                  <TableCell>{formatISODate(fine.assessedAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={FINE_STATUS_LABELS[fine.status] ?? fine.status}
                      size="small"
                      color={
                        fine.status === 'PENDING' ? 'warning' :
                        fine.status === 'PARTIAL' ? 'warning' :
                        fine.status === 'PAID' ? 'success' :
                        fine.status === 'WAIVED' ? 'info' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{fine.workTitle ? `${fine.workTitle}${fine.reason ? ` — ${fine.reason}` : ''}` : (fine.reason ?? '-')}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar">
                      <IconButton><Visibility /></IconButton>
                    </Tooltip>
                    {(fine.status === 'PENDING' || fine.status === 'PARTIAL') && (
                      <>
                        <Tooltip title="Pagar">
                          <IconButton color="success" onClick={() => openPayment(fine)}><Payments /></IconButton>
                        </Tooltip>
                        <Tooltip title="Isentar">
                          <IconButton color="info" onClick={() => waiveFine(fine)}><Cancel /></IconButton>
                        </Tooltip>
                      </>
                    )}
                    {(fine.status === 'PENDING' || fine.status === 'PARTIAL' || fine.status === 'PAID') && (
                      <Tooltip title="Baixa contábil">
                        <IconButton color="error" onClick={() => writeOffFine(fine)}><Delete /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Linhas por página:"
          />
        </TableContainer>
      )}

      <FormDialog
        open={paymentOpen}
        onClose={closePayment}
        title="Registrar pagamento"
        saving={saving}
        onSubmit={payFine}
        submitLabel="Confirmar pagamento"
      >
        <TextField
          label="Referência do pagamento (PIX/boleto)"
          fullWidth
          value={paymentForm.paymentRef}
          onChange={(e) => setPaymentForm({ ...paymentForm, paymentRef: e.target.value })}
          error={!!paymentErrors.paymentRef}
          helperText={paymentErrors.paymentRef}
        />
        <TextField
          type="number"
          label="Valor (centavos)"
          fullWidth
          value={paymentForm.amountCents}
          onChange={(e) => setPaymentForm({ ...paymentForm, amountCents: Number(e.target.value) || 0 })}
          inputProps={{ min: 1 }}
          error={!!paymentErrors.amountCents}
          helperText={paymentErrors.amountCents}
        />
        <TextField
          label="ID da multa (oculto)"
          fullWidth
          value={paymentForm.fineId}
          onChange={(e) => setPaymentForm({ ...paymentForm, fineId: e.target.value })}
          hidden
        />
      </FormDialog>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Recalcular saldo de locatário</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="ID do locatário"
            value=""
            onChange={() => {}}
            size="small"
            sx={{ minWidth: 250 }}
          />
          <Button variant="outlined" startIcon={<Autorenew />} onClick={() => {}}>
            Recalcular
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

import { Typography } from '@mui/material'
import { Autorenew } from '@mui/icons-material'