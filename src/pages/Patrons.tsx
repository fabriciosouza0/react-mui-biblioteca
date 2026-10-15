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
  TableRow,
  Tooltip,
} from '@mui/material'
import { Add, Delete, Edit, Visibility } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import FormDialog from '../components/FormDialog/FormDialog'
import MaskedTextField from '../components/MaskedTextField'
import { usePatrons } from '../hooks/usePatrons'
import { useInstitution } from '../context/InstitutionContext'
import { MASK_CPF, MASK_TELEFONE } from '../utils/masks'
import { MAX } from '../utils/validation'
import {
  PATRON_STATUS_LABELS,
  PROFILE_LABELS,
} from '../api/types'

export default function Patrons() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    patrons,
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
    remove,
    profileOptions,
  } = usePatrons(institutionId)

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
        title="Locatários"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou CPF"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openNew}>
            Novo locatário
          </Button>
        }
      />
      {loading && patrons.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CPF</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Saldo multas</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patrons.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.externalId}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.phone ?? '-'}</TableCell>
                  <TableCell>
                    <Chip label={PROFILE_LABELS[p.profile] ?? p.profile} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={PATRON_STATUS_LABELS[p.status] ?? p.status}
                      size="small"
                      color={p.status === 'ACTIVE' ? 'success' : p.status === 'BLOCKED' ? 'error' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.fineBalance / 100)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar">
                      <IconButton onClick={() => openEdit(p)}><Visibility /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(p)}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => remove(p)}><Delete /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <FormDialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editing === null ? 'Novo locatário' : 'Editar locatário'}
        saving={saving}
        onSubmit={save}
      >
        <MaskedTextField
          label="CPF"
          mask={MASK_CPF}
          disabled={editing !== null}
          value={form.externalId}
          onChange={(v) => setForm({ ...form, externalId: v })}
          error={!!errors.externalId}
          helperText={errors.externalId}
        />
        <FormDialog.Field
          label="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          lettersOnly
          maxLength={MAX.NOME}
          error={!!errors.name}
          helperText={errors.name}
        />
        <MaskedTextField
          label="Telefone"
          mask={MASK_TELEFONE}
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          error={!!errors.phone}
          helperText={errors.phone}
        />
        <FormDialog.Select
          label="Perfil"
          value={form.profile}
          onChange={(e) => setForm({ ...form, profile: e.target.value as any })}
          error={!!errors.profile}
          helperText={errors.profile}
        >
          {profileOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </FormDialog.Select>
      </FormDialog>
    </Box>
  )
}