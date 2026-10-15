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
import { Add, AssignmentReturn, Autorenew, Visibility } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import FormDialog from '../components/FormDialog/FormDialog'
import { useLoans } from '../hooks/useLoans'
import { useInstitution } from '../context/InstitutionContext'
import { LOAN_STATUS_LABELS } from '../api/types'
import { formatISODate } from '../utils/validation'

export default function Loans() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    loans,
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
    checkoutOpen,
    checkoutForm,
    setCheckoutForm,
    checkoutErrors,
    checkoutPatrons,
    checkoutItems,
    checkoutLibraries,
    openCheckout,
    closeCheckout,
    checkout,
    returnLoan,
    renewLoan,
    statusOptions,
  } = useLoans(institutionId)

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
        title="Empréstimos"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por locatário, exemplar ou obra"
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
            <Button variant="contained" startIcon={<Add />} onClick={openCheckout}>
              Novo empréstimo
            </Button>
          </>
        }
      />
      {loading && loans.length === 0 ? (
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
                <TableCell>Exemplar</TableCell>
                <TableCell>Filial</TableCell>
                <TableCell>Checkout</TableCell>
                <TableCell>Devolução prevista</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.map((loan) => (
                <TableRow key={loan.id} hover>
                  <TableCell>{loan.id.slice(0, 8)}</TableCell>
                  <TableCell>{loan.patronName ? `${loan.patronName} (${loan.patronExternalId})` : loan.patronId}</TableCell>
                  <TableCell>
                    <span>{loan.workTitle ? `${loan.workTitle} (${loan.itemBarcode})` : `${loan.itemId.slice(0, 12)}...`}</span>
                  </TableCell>
                  <TableCell>{loan.libraryName ?? loan.libraryId.slice(0, 8)}</TableCell>
                  <TableCell>{formatISODate(loan.checkedOutAt)}</TableCell>
                  <TableCell>{formatISODate(loan.dueAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={LOAN_STATUS_LABELS[loan.status] ?? loan.status}
                      size="small"
                      color={
                        loan.status === 'ACTIVE' ? 'info' :
                        loan.status === 'OVERDUE' ? 'error' :
                        loan.status === 'RETURNED' ? 'success' : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar">
                      <IconButton onClick={() => {}}><Visibility /></IconButton>
                    </Tooltip>
                    {loan.status === 'ACTIVE' || loan.status === 'OVERDUE' ? (
                      <>
                        <Tooltip title="Devolver (OK)">
                          <IconButton color="success" onClick={() => returnLoan(loan, 'OK')}>
                            <AssignmentReturn />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Devolver (Danificado)">
                          <IconButton color="warning" onClick={() => returnLoan(loan, 'DAMAGED')}>
                            <AssignmentReturn />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Devolver (Perdido)">
                          <IconButton color="error" onClick={() => returnLoan(loan, 'LOST')}>
                            <AssignmentReturn />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Renovar">
                          <IconButton onClick={() => renewLoan(loan)}><Autorenew /></IconButton>
                        </Tooltip>
                      </>
                    ) : null}
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
        open={checkoutOpen}
        onClose={closeCheckout}
        title="Novo empréstimo (Checkout)"
        saving={saving}
        onSubmit={checkout}
        submitLabel="Emprestar"
      >
        <FormDialog.Select
          label="Locatário"
          value={checkoutForm.patronId}
          onChange={(e) => setCheckoutForm({ ...checkoutForm, patronId: e.target.value })}
          error={!!checkoutErrors.patronId}
          helperText={checkoutErrors.patronId}
        >
          {checkoutPatrons.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} ({p.externalId}) - {p.profile}
            </MenuItem>
          ))}
        </FormDialog.Select>
        <FormDialog.Select
          label="Exemplar (disponível)"
          value={checkoutForm.itemId}
          onChange={(e) => setCheckoutForm({ ...checkoutForm, itemId: e.target.value })}
          error={!!checkoutErrors.itemId}
          helperText={checkoutErrors.itemId}
        >
          {checkoutItems.map((i) => (
            <MenuItem key={i.id} value={i.id}>
              {i.barcode} - {i.callNumber ?? 'sem call number'}
            </MenuItem>
          ))}
        </FormDialog.Select>
        <FormDialog.Select
          label="Filial de retirada"
          value={checkoutForm.libraryId}
          onChange={(e) => setCheckoutForm({ ...checkoutForm, libraryId: e.target.value })}
          error={!!checkoutErrors.libraryId}
          helperText={checkoutErrors.libraryId}
        >
          {checkoutLibraries.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name} {l.isCentral ? '(Central)' : ''}
            </MenuItem>
          ))}
        </FormDialog.Select>
      </FormDialog>
    </Box>
  )
}

import { FormControl, InputLabel, Select } from '@mui/material'