import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { Add, Delete, Edit, Search } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import FormDialog from '../components/FormDialog/FormDialog'
import WorkDependenciesDialog from '../components/WorkDependenciesDialog'
import AuthorsFieldArray, { parseAuthors, AUTHOR_ROLE_LABELS } from '../components/AuthorsFieldArray'
import { useWorks } from '../hooks/useWorks'
import { useInstitution } from '../context/InstitutionContext'
import { MAX } from '../utils/validation'

export default function Works() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    works,
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
    enrichFromIsbn,
    depsDialogOpen,
    depsWorkId,
    depsWorkTitle,
    closeDepsDialog,
    deleteAfterDeps,
  } = useWorks(institutionId)

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
        title="Catálogo de Obras"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título, autor ou ISBN"
        action={
          <>
            <Button variant="outlined" startIcon={<Search />} onClick={() => {
              const isbn = window.prompt('Digite o ISBN para buscar e enriquecer:')
              if (isbn) enrichFromIsbn(isbn)
            }}>
              Buscar por ISBN
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={openNew}>
              Nova obra
            </Button>
          </>
        }
      />
      {loading && works.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ISBN</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Autores</TableCell>
                <TableCell>CDU</TableCell>
                <TableCell>Editora</TableCell>
                <TableCell>Ano</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {works.map((w) => (
                <TableRow key={w.id} hover>
                  <TableCell>{w.isbn13 ?? '-'}</TableCell>
                  <TableCell>{w.title}</TableCell>
                  <TableCell>
                    {(() => {
                      const parsed = parseAuthors(w.authors)
                      if (parsed.length === 0) return w.authors || '-'
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {parsed.map((a, idx) => (
                            <Chip
                              key={idx}
                              label={a.role && a.role !== 'author' ? `${a.name} (${AUTHOR_ROLE_LABELS[a.role] || a.role})` : a.name}
                              size="small"
                              variant="outlined"
                              color={idx === 0 ? 'primary' : 'default'}
                            />
                          ))}
                        </Box>
                      )
                    })()}
                  </TableCell>
                  <TableCell>{w.cdu ?? '-'}</TableCell>
                  <TableCell>{w.publisher ?? '-'}</TableCell>
                  <TableCell>{w.publishedYear ?? '-'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => openEdit(w)}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => remove(w)}><Delete /></IconButton>
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
        title={editing === null ? 'Nova obra' : 'Editar obra'}
        saving={saving}
        onSubmit={save}
        maxWidth="md"
      >
        <FormDialog.Field
          label="ISBN-13"
          disabled={editing !== null}
          value={form.isbn13}
          onChange={(e) => setForm({ ...form, isbn13: e.target.value.replace(/[^0-9]/g, '').slice(0, 13) })}
          error={!!errors.isbn13}
          helperText={errors.isbn13}
        />
        <FormDialog.Field
          label="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          maxLength={MAX.TITULO}
          error={!!errors.title}
          helperText={errors.title}
        />
        <AuthorsFieldArray
          value={form.authors}
          onChange={(serialized) => setForm({ ...form, authors: serialized })}
          error={errors.authors}
          disabled={saving}
        />
        <FormDialog.Field
          label="CDU"
          value={form.cdu}
          onChange={(e) => setForm({ ...form, cdu: e.target.value })}
          maxLength={30}
          error={!!errors.cdu}
          helperText={errors.cdu}
        />
        <FormDialog.Field
          label="Editora"
          value={form.publisher}
          onChange={(e) => setForm({ ...form, publisher: e.target.value })}
          maxLength={120}
          error={!!errors.publisher}
          helperText={errors.publisher}
        />
        <FormDialog.Field
          label="Ano de publicação"
          type="number"
          inputProps={{ min: 1000, max: new Date().getFullYear() }}
          value={form.publishedYear}
          onChange={(e) => setForm({ ...form, publishedYear: e.target.value ? Number(e.target.value) : '' })}
        />
        <FormDialog.Field
          label="Edição"
          value={form.edition}
          onChange={(e) => setForm({ ...form, edition: e.target.value })}
          maxLength={30}
          error={!!errors.edition}
          helperText={errors.edition}
        />
        <FormDialog.Field
          label="URL da capa"
          value={form.coverUrl}
          onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
          maxLength={500}
          error={!!errors.coverUrl}
          helperText={errors.coverUrl}
        />
        <FormDialog.Field
          label="Descrição"
          multiline
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FormDialog>

      <WorkDependenciesDialog
        open={depsDialogOpen}
        workId={depsWorkId}
        workTitle={depsWorkTitle}
        institutionId={institutionId}
        onClose={closeDepsDialog}
        onDeleted={deleteAfterDeps}
      />
    </Box>
  )
}