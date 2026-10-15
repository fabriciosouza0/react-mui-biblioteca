import { useState } from 'react'
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
  Typography,
} from '@mui/material'
import { Add, Delete, Edit, LocalShipping, Visibility } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import FormDialog from '../components/FormDialog/FormDialog'
import ItemActionDialog, { type ItemActionMode } from '../components/ItemActionDialog'
import { useItems } from '../hooks/useItems'
import { useWorks } from '../hooks/useWorks'
import { useLibraries } from '../hooks/useLibraries'
import { useInstitution } from '../context/InstitutionContext'
import { useLibrary } from '../context/LibraryContext'
import { ITEM_STATUS_LABELS, type Item } from '../api/types'

export default function Items() {
  const { selectedInstitution, loading: instLoading, userRole } = useInstitution()
  const institutionId = selectedInstitution?.id
  const isGlobalAdmin = userRole === 'GLOBAL_ADMIN'
  const { selectedLibrary } = useLibrary()

  const {
    items,
    totalElements,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    loading,
    saving,
    dialogOpen,
    closeDialog,
    editing,
    form,
    setForm,
    errors,
    openNew,
    openEdit,
    save,
    transfer,
    receiveTransfer,
    withdraw,
  } = useItems(institutionId)

  const [actionModal, setActionModal] = useState<{
    open: boolean
    mode: ItemActionMode | null
    item: Item | null
  }>({
    open: false,
    mode: null,
    item: null,
  })

  const { works } = useWorks(institutionId, dialogOpen)
  const { libraries } = useLibraries(institutionId, dialogOpen || actionModal.open)

  const closeActionModal = () => setActionModal({ open: false, mode: null, item: null })

  const handleConfirmTransfer = async (targetLibraryId: string, note?: string) => {
    if (actionModal.item) {
      await transfer(actionModal.item, targetLibraryId, note)
      closeActionModal()
    }
  }

  const handleConfirmWithdraw = async (reason: string) => {
    if (actionModal.item) {
      await withdraw(actionModal.item, reason)
      closeActionModal()
    }
  }

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
        title="Exemplares"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código de barras, obra ou call number"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => openNew()}>
            Novo exemplar
          </Button>
        }
      />
      {loading && items.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código de barras</TableCell>
                <TableCell>Obra</TableCell>
                <TableCell>Call Number</TableCell>
                <TableCell>Filial</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <span style={{ fontFamily: 'monospace' }}>{item.barcode}</span>
                    </TableCell>
                    <TableCell>{item.workTitle ?? item.workId}</TableCell>
                    <TableCell>{item.callNumber ?? '-'}</TableCell>
                    <TableCell>
                      {item.status === 'IN_TRANSIT' ? (
                        <Box>
                          <Typography variant="body2" component="div">
                            {item.libraryName ?? item.libraryId}
                          </Typography>
                          <Typography variant="caption" color="primary.main" component="div" sx={{ fontWeight: 500 }}>
                            Destino: {item.targetLibraryName ?? item.targetLibraryId}
                          </Typography>
                        </Box>
                      ) : (
                        item.libraryName ?? item.libraryId
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={item.status === 'IN_TRANSIT' && item.transferNote ? `Motivo: ${item.transferNote}` : ''}>
                        <Chip
                          label={ITEM_STATUS_LABELS[item.status] ?? item.status}
                          size="small"
                          color={
                            item.status === 'AVAILABLE' ? 'success' :
                            item.status === 'ON_LOAN' ? 'info' :
                            item.status === 'ON_HOLD' ? 'warning' :
                            item.status === 'IN_TRANSIT' ? 'primary' :
                            item.status === 'LOST' ? 'error' :
                            item.status === 'WITHDRAWN' ? 'default' : 'secondary'
                          }
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Visualizar">
                        <IconButton onClick={() => openEdit(item)}><Visibility /></IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => openEdit(item)}><Edit /></IconButton>
                      </Tooltip>
                      {item.status === 'IN_TRANSIT' && (() => {
                        const isDestination = !!(selectedLibrary && item.targetLibraryId && selectedLibrary.id === item.targetLibraryId)
                        const canReceive = isGlobalAdmin || isDestination
                        const tooltipText = canReceive
                          ? 'Receber transferência'
                          : `Apenas a filial de destino (${item.targetLibraryName ?? 'destino'}) pode confirmar o recebimento`

                        return (
                          <Tooltip title={tooltipText}>
                            <span>
                              <IconButton
                                color="success"
                                disabled={!canReceive}
                                onClick={() => receiveTransfer(item)}
                              >
                                <LocalShipping />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )
                      })()}
                      {['AVAILABLE', 'ON_LOAN', 'ON_HOLD', 'IN_REPAIR'].includes(item.status) && (
                        <Tooltip title="Transferir">
                          <IconButton onClick={() => setActionModal({ open: true, mode: 'TRANSFER', item })}>
                            <LocalShipping />
                          </IconButton>
                        </Tooltip>
                      )}
                      {['AVAILABLE', 'LOST', 'IN_REPAIR'].includes(item.status) && (
                        <Tooltip title="Retirar do acervo">
                          <IconButton color="error" onClick={() => setActionModal({ open: true, mode: 'WITHDRAW', item })}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
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
        open={dialogOpen}
        onClose={closeDialog}
        title={editing === null ? 'Novo exemplar' : 'Editar exemplar'}
        saving={saving}
        onSubmit={save}
      >
        <FormDialog.Select
          label="Obra"
          value={form.workId}
          onChange={(e) => setForm({ ...form, workId: e.target.value })}
          error={!!errors.workId}
          helperText={errors.workId}
        >
          {works.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.title} ({w.isbn13 ?? 'sem ISBN'})
            </MenuItem>
          ))}
        </FormDialog.Select>
        <FormDialog.Select
          label="Filial"
          value={form.libraryId}
          onChange={(e) => setForm({ ...form, libraryId: e.target.value })}
          error={!!errors.libraryId}
          helperText={errors.libraryId}
        >
          {libraries.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name} {l.isCentral ? '(Central)' : ''}
            </MenuItem>
          ))}
        </FormDialog.Select>
        <TextField
          label="Código de barras"
          fullWidth
          value={form.barcode}
          onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          error={!!errors.barcode}
          helperText={errors.barcode}
          inputProps={{ style: { fontFamily: 'monospace' } }}
        />
        <TextField
          label="Call Number"
          fullWidth
          value={form.callNumber}
          onChange={(e) => setForm({ ...form, callNumber: e.target.value })}
          error={!!errors.callNumber}
          helperText={errors.callNumber}
        />
      </FormDialog>

      <ItemActionDialog
        open={actionModal.open}
        mode={actionModal.mode}
        item={actionModal.item}
        libraries={libraries}
        loading={saving}
        onClose={closeActionModal}
        onConfirmTransfer={handleConfirmTransfer}
        onConfirmWithdraw={handleConfirmWithdraw}
      />
    </Box>
  )
}