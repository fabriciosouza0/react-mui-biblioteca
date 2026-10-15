import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
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
import { useLibraries } from '../hooks/useLibraries'
import { useInstitution } from '../context/InstitutionContext'

export default function Libraries() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    libraries,
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
  } = useLibraries(institutionId)

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
        title="Filiais / Bibliotecas"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={openNew}>
            Nova filial
          </Button>
        }
      />
      {loading && libraries.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Central</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {libraries.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell>{l.id.slice(0, 8)}</TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={<Checkbox checked={l.isCentral} disabled />}
                      label=""
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Visualizar">
                      <IconButton onClick={() => openEdit(l)}><Visibility /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(l)}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => remove(l)}><Delete /></IconButton>
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
        title={editing === null ? 'Nova filial' : 'Editar filial'}
        saving={saving}
        onSubmit={save}
      >
        <FormDialog.Field
          label="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
        />
        <FormControlLabel
          control={<Checkbox checked={form.isCentral} onChange={(e) => setForm({ ...form, isCentral: e.target.checked })} />}
          label="Filial central?"
        />
      </FormDialog>
    </Box>
  )
}