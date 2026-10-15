import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  Assessment,
  Download,
  Print,
  TrendingUp,
  AutoStories,
  CheckCircle,
  AccountBalanceWallet,
} from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import { useReports, type PeriodFilter } from '../hooks/useReports'
import { useInstitution } from '../context/InstitutionContext'
import { useLibraries } from '../hooks/useLibraries'
import type { ReportType } from '../api/types'

export default function Reports() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id
  const { libraries } = useLibraries(institutionId)

  const {
    reportType,
    setReportType,
    period,
    setPeriod,
    libraryFilter,
    setLibraryFilter,
    loading,
    kpis,
    loanReportData,
    topWorksData,
    patronActivityData,
    fineCollectionData,
    exportCsv,
    printPdf,
    formatCents,
  } = useReports(institutionId)

  if (instLoading || !institutionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const kpiIcons = [
    <AutoStories color="primary" />,
    <CheckCircle color="success" />,
    <AccountBalanceWallet color="warning" />,
    <TrendingUp color="info" />,
  ]

  return (
    <Box sx={{ '@media print': { p: 0, m: 0 } }}>
      {/* Cabeçalho de impressão (oculto na tela, visível na impressão) */}
      <Box
        sx={{
          display: 'none',
          '@media print': {
            display: 'block',
            mb: 3,
            pb: 2,
            borderBottom: '2px solid #000',
          },
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {selectedInstitution.name} ({selectedInstitution.code})
        </Typography>
        <Typography variant="subtitle1">
          Relatório Gerencial da Biblioteca — Emitido em {new Date().toLocaleDateString('pt-BR')} às{' '}
          {new Date().toLocaleTimeString('pt-BR')}
        </Typography>
      </Box>

      {/* Cabeçalho da página na tela */}
      <Box sx={{ '@media print': { display: 'none' } }}>
        <PageHeader
          title="Relatórios & Business Intelligence"
          action={
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportCsv}
                disabled={loading}
              >
                Exportar CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={printPdf}
                disabled={loading}
              >
                Imprimir / PDF
              </Button>
            </Box>
          }
        />
      </Box>

      {/* Barra de Filtros */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
          bgcolor: 'background.paper',
          '@media print': { display: 'none' },
        }}
      >
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="report-type-label">Tipo de Relatório</InputLabel>
          <Select
            labelId="report-type-label"
            value={reportType}
            label="Tipo de Relatório"
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            <MenuItem value="loans_by_library_month">Empréstimos & Devoluções por Mês</MenuItem>
            <MenuItem value="top_works">Obras Mais Circuladas (Top Livros)</MenuItem>
            <MenuItem value="patron_activity">Atividade & Inadimplência de Locatários</MenuItem>
            <MenuItem value="fine_collection">Arrecadação & Baixas de Multas</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="period-label">Período</InputLabel>
          <Select
            labelId="period-label"
            value={period}
            label="Período"
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
          >
            <MenuItem value="LAST_30_DAYS">Últimos 30 Dias</MenuItem>
            <MenuItem value="LAST_90_DAYS">Últimos 90 Dias</MenuItem>
            <MenuItem value="CURRENT_YEAR">Ano Atual (2026)</MenuItem>
            <MenuItem value="ALL_TIME">Todo o Histórico</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="library-filter-label">Unidade / Filial</InputLabel>
          <Select
            labelId="library-filter-label"
            value={libraryFilter}
            label="Unidade / Filial"
            onChange={(e) => setLibraryFilter(e.target.value)}
          >
            <MenuItem value="ALL">Todas as Bibliotecas</MenuItem>
            {libraries.map((lib) => (
              <MenuItem key={lib.id} value={lib.id}>
                {lib.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Grid de KPIs */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {kpi.label}
                  </Typography>
                  <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                    {kpiIcons[idx % kpiIcons.length]}
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {kpi.value}
                </Typography>
                {kpi.change && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {kpi.change}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Seção Gráfica / Visualização Analítica */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Assessment color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Visualização de Tendência e Distribuição
          </Typography>
        </Box>

        {reportType === 'loans_by_library_month' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loanReportData.map((item) => {
              const maxLoans = Math.max(...loanReportData.map((d) => d.loansCount), 1)
              const percent = Math.round((item.loansCount / maxLoans) * 100)
              return (
                <Box key={item.month}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.month}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.loansCount} empréstimos · {item.returnedCount} devoluções (Taxa de atraso: {item.overdueRate}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{ height: 10, borderRadius: 5 }}
                    color={item.overdueRate > 5 ? 'warning' : 'primary'}
                  />
                </Box>
              )
            })}
          </Box>
        )}

        {reportType === 'top_works' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topWorksData.slice(0, 5).map((work, index) => {
              const maxL = Math.max(...topWorksData.map((w) => w.loansCount), 1)
              const percent = Math.round((work.loansCount / maxL) * 100)
              return (
                <Box key={work.workId}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      #{index + 1} {work.title} ({work.authors})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {work.loansCount} empréstimos · {work.holdsCount} reservas na fila
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{ height: 10, borderRadius: 5 }}
                    color="primary"
                  />
                </Box>
              )
            })}
          </Box>
        )}

        {reportType === 'fine_collection' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {fineCollectionData.map((item) => (
              <Box key={item.month}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.month}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Arrecadado: {formatCents(item.collectedCents)} de {formatCents(item.assessedCents)} ({item.collectionRate}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.collectionRate}
                  sx={{ height: 10, borderRadius: 5 }}
                  color="success"
                />
              </Box>
            ))}
          </Box>
        )}

        {reportType === 'patron_activity' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Distribuição de pontualidade dos locatários: 96% dos locatários ativos mantêm seus empréstimos regulares.
            </Typography>
            <LinearProgress
              variant="determinate"
              value={96}
              sx={{ height: 12, borderRadius: 6 }}
              color="success"
            />
          </Box>
        )}
      </Paper>

      {/* Tabela de Dados Detalhada */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        {reportType === 'loans_by_library_month' && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Mês</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Unidade / Biblioteca</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Empréstimos Realizados</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Devoluções Registradas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Taxa de Atraso</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Duração Média</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loanReportData.map((row) => (
                <TableRow key={row.month} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{row.month}</TableCell>
                  <TableCell>{row.libraryName}</TableCell>
                  <TableCell align="right">{row.loansCount}</TableCell>
                  <TableCell align="right">{row.returnedCount}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={`${row.overdueRate}%`}
                      color={row.overdueRate > 5 ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{row.avgLoanDays} dias</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {reportType === 'top_works' && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Posição</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Título da Obra</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Autores</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ISBN</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Empréstimos</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Locatários Únicos</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Fila de Espera</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topWorksData.map((row, idx) => (
                <TableRow key={row.workId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>#{idx + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.title}</TableCell>
                  <TableCell>{row.authors}</TableCell>
                  <TableCell>{row.isbn ?? '-'}</TableCell>
                  <TableCell align="right">{row.loansCount}</TableCell>
                  <TableCell align="right">{row.uniquePatrons}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={`${row.holdsCount} reservas`}
                      color={row.holdsCount > 5 ? 'primary' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {reportType === 'patron_activity' && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Locatário</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Perfil</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Empréstimos Ativos</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Histórico (12 Meses)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Saldo em Multas</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patronActivityData.map((row) => (
                <TableRow key={row.patronId} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                  <TableCell>{row.profile}</TableCell>
                  <TableCell align="right">{row.activeLoans}</TableCell>
                  <TableCell align="right">{row.totalLoans12m}</TableCell>
                  <TableCell align="right">{formatCents(row.fines12mCents)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={row.status === 'ACTIVE' ? 'Ativo' : 'Bloqueado'}
                      color={row.status === 'ACTIVE' ? 'success' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {reportType === 'fine_collection' && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600 }}>Mês</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Multas Emitidas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Total Arrecadado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Isenções Concedidas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Baixas Contábeis</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Taxa de Arrecadação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fineCollectionData.map((row) => (
                <TableRow key={row.month} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{row.month}</TableCell>
                  <TableCell align="right">{formatCents(row.assessedCents)}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {formatCents(row.collectedCents)}
                  </TableCell>
                  <TableCell align="right">{formatCents(row.waivedCents)}</TableCell>
                  <TableCell align="right">{formatCents(row.writtenOffCents)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={`${row.collectionRate}%`}
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  )
}
