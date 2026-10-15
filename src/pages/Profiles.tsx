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
  TextField,
  Tooltip,
} from '@mui/material'
import { Add, Delete, Edit, Visibility } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import FormDialog from '../components/FormDialog/FormDialog'
import { useProfileConfigs } from '../hooks/useProfileConfigs'
import { useInstitution } from '../context/InstitutionContext'
import { PROFILE_LABELS } from '../api/types'

export default function Profiles() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    configs,
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
  } = useProfileConfigs(institutionId)

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
        title="Configuração de Perfis"
        subtitle="Limites de empréstimo, prazos, multas e reservas por perfil de locatário"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por perfil"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openNew}>
            Nova configuração
          </Button>
        }
      />
      {loading && configs.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell align="right">Máx. empréstimos</TableCell>
                <TableCell align="right">Dias de empréstimo</TableCell>
                <TableCell align="right">Máx. renovações</TableCell>
                <TableCell align="right">Limite reservas</TableCell>
                <TableCell align="right">Taxa multa/dia</TableCell>
                <TableCell align="right">Teto multa</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Chip label={PROFILE_LABELS[c.profile] ?? c.profile} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{c.maxLoans === 999 ? 'Ilimitado' : c.maxLoans}</TableCell>
                  <TableCell align="right">{c.loanDays === 999 ? 'Ilimitado' : c.loanDays}</TableCell>
                  <TableCell align="right">{c.maxRenewals === 999 ? 'Ilimitado' : c.maxRenewals}</TableCell>
                  <TableCell align="right">{c.holdLimit === 999 ? 'Ilimitado' : c.holdLimit}</TableCell>
                  <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.fineRateCents / 100)}</TableCell>
                  <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.fineCapCents / 100)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar">
                      <IconButton onClick={() => openEdit(c)}><Visibility /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(c)}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => remove(c)}><Delete /></IconButton>
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
        title={editing === null ? 'Nova configuração de perfil' : 'Editar configuração de perfil'}
        saving={saving}
        onSubmit={save}
      >
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
        <TextField
          type="number"
          label="Máx. empréstimos simultâneos"
          fullWidth
          value={form.maxLoans}
          onChange={(e) => setForm({ ...form, maxLoans: Number(e.target.value) || 0 })}
          inputProps={{ min: 0 }}
          error={!!errors.maxLoans}
          helperText={errors.maxLoans}
        />
        <TextField
          type="number"
          label="Dias de empréstimo"
          fullWidth
          value={form.loanDays}
          onChange={(e) => setForm({ ...form, loanDays: Number(e.target.value) || 0 })}
          inputProps={{ min: 1 }}
          error={!!errors.loanDays}
          helperText={errors.loanDays}
        />
        <TextField
          type="number"
          label="Máx. renovações"
          fullWidth
          value={form.maxRenewals}
          onChange={(e) => setForm({ ...form, maxRenewals: Number(e.target.value) || 0 })}
          inputProps={{ min: 0 }}
          error={!!errors.maxRenewals}
          helperText={errors.maxRenewals}
        />
        <TextField
          type="number"
          label="Limite de reservas simultâneas"
          fullWidth
          value={form.holdLimit}
          onChange={(e) => setForm({ ...form, holdLimit: Number(e.target.value) || 0 })}
          inputProps={{ min: 0 }}
          error={!!errors.holdLimit}
          helperText={errors.holdLimit}
        />
        <TextField
          type="number"
          label="Taxa de multa por dia (centavos)"
          fullWidth
          value={form.fineRateCents}
          onChange={(e) => setForm({ ...form, fineRateCents: Number(e.target.value) || 0 })}
          inputProps={{ min: 0 }}
          error={!!errors.fineRateCents}
          helperText={errors.fineRateCents}
        />
        <TextField
          type="number"
          label="Teto de multa (centavos)"
          fullWidth
          value={form.fineCapCents}
          onChange={(e) => setForm({ ...form, fineCapCents: Number(e.target.value) || 0 })}
          inputProps={{ min: 0 }}
          error={!!errors.fineCapCents}
          helperText={errors.fineCapCents}
        />
      </FormDialog>
    </Box>
  )
}