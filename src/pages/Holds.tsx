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
  Tooltip,
} from '@mui/material'
import { Add, Cancel, CheckCircle, Timer, Visibility } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import FormDialog from '../components/FormDialog/FormDialog'
import { useHolds } from '../hooks/useHolds'
import { useInstitution } from '../context/InstitutionContext'
import { HOLD_STATUS_LABELS } from '../api/types'
import { formatISODate } from '../utils/validation'
import { FormControl, InputLabel, Select } from '@mui/material'

export default function Holds() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    holds,
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
    placeHoldOpen,
    placeHoldForm,
    setPlaceHoldForm,
    placeHoldErrors,
    placeHoldPatrons,
    placeHoldWorks,
    placeHoldLibraries,
    openPlaceHold,
    closePlaceHold,
    placeHold,
    cancelHold,
    fulfillHold,
    expireHolds,
    statusOptions,
  } = useHolds(institutionId)

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
        title="Reservas"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por locatário, obra ou filial"
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
            <Button variant="contained" startIcon={<Add />} onClick={openPlaceHold}>
              Nova reserva
            </Button>
          </>
        }
      />
      {loading && holds.length === 0 ? (
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
                <TableCell>Obra</TableCell>
                <TableCell>Filial retirada</TableCell>
                <TableCell>Posição</TableCell>
                <TableCell>Data reserva</TableCell>
                <TableCell>Expira em</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holds.map((hold) => (
                <TableRow key={hold.id} hover>
                  <TableCell>{hold.id.slice(0, 8)}</TableCell>
                  <TableCell>{hold.patronName ? `${hold.patronName}${hold.patronExternalId ? ` (${hold.patronExternalId})` : ''}` : hold.patronId.slice(0, 8)}</TableCell>
                  <TableCell>{hold.workTitle ? `${hold.workTitle}${hold.workIsbn13 ? ` (${hold.workIsbn13})` : ''}` : hold.workId.slice(0, 8)}</TableCell>
                  <TableCell>{hold.libraryName ?? hold.libraryId.slice(0, 8)}</TableCell>
                  <TableCell>{hold.position}</TableCell>
                  <TableCell>{formatISODate(hold.placedAt)}</TableCell>
                  <TableCell>{hold.expiresAt ? formatISODate(hold.expiresAt) : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={HOLD_STATUS_LABELS[hold.status] ?? hold.status}
                      size="small"
                      color={
                        hold.status === 'WAITING' ? 'default' :
                        hold.status === 'READY' ? 'success' :
                        hold.status === 'FULFILLED' ? 'info' :
                        hold.status === 'EXPIRED' ? 'warning' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar">
                      <IconButton><Visibility /></IconButton>
                    </Tooltip>
                    {hold.status === 'WAITING' && (
                      <Tooltip title="Cancelar">
                        <IconButton color="error" onClick={() => cancelHold(hold)}><Cancel /></IconButton>
                      </Tooltip>
                    )}
                    {hold.status === 'READY' && (
                      <Tooltip title="Cumprir (retirada)">
                        <IconButton color="success" onClick={() => fulfillHold(hold)}><CheckCircle /></IconButton>
                      </Tooltip>
                    )}
                    {hold.status === 'WAITING' && hold.expiresAt && new Date(hold.expiresAt) < new Date() && (
                      <Tooltip title="Expirado">
                        <IconButton color="warning"><Timer /></IconButton>
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
        open={placeHoldOpen}
        onClose={closePlaceHold}
        title="Nova reserva"
        saving={saving}
        onSubmit={placeHold}
      >
        <FormDialog.Select
          label="Locatário"
          value={placeHoldForm.patronId}
          onChange={(e) => setPlaceHoldForm({ ...placeHoldForm, patronId: e.target.value })}
          error={!!placeHoldErrors.patronId}
          helperText={placeHoldErrors.patronId}
        >
          {placeHoldPatrons.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} ({p.externalId}) - {p.profile}
            </MenuItem>
          ))}
        </FormDialog.Select>
        <FormDialog.Select
          label="Obra"
          value={placeHoldForm.workId}
          onChange={(e) => setPlaceHoldForm({ ...placeHoldForm, workId: e.target.value })}
          error={!!placeHoldErrors.workId}
          helperText={placeHoldErrors.workId}
        >
          {placeHoldWorks.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.title} ({w.isbn13 ?? 'sem ISBN'})
            </MenuItem>
          ))}
        </FormDialog.Select>
        <FormDialog.Select
          label="Filial de retirada"
          value={placeHoldForm.libraryId}
          onChange={(e) => setPlaceHoldForm({ ...placeHoldForm, libraryId: e.target.value })}
          error={!!placeHoldErrors.libraryId}
          helperText={placeHoldErrors.libraryId}
        >
          {placeHoldLibraries.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name} {l.isCentral ? '(Central)' : ''}
            </MenuItem>
          ))}
        </FormDialog.Select>
      </FormDialog>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Rotinas de reservas</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Timer />} onClick={expireHolds}>
            Expirar reservas vencidas
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

import { Typography } from '@mui/material'