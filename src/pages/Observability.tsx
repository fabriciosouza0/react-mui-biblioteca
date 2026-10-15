import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  CheckCircle,
  Code,
  Download,
  Memory,
  PlayArrow,
  Refresh,
  Speed,
  Storage,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import { useObservability } from '../hooks/useObservability'
import { useInstitution } from '../context/InstitutionContext'
import type { AuditLogEntry } from '../api/types'

export default function Observability() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    metrics,
    jobs,
    filteredAuditLogs,
    auditSearch,
    setAuditSearch,
    severityFilter,
    setSeverityFilter,
    loading,
    triggeringJob,
    triggerJob,
    exportAuditCsv,
    refresh,
  } = useObservability(institutionId)

  const [activeTab, setActiveTab] = useState(0)
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null)

  if (instLoading || !institutionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const getMetricIcon = (name: string) => {
    if (name.includes('PostgreSQL') || name.includes('HikariCP')) return <Storage color="primary" />
    if (name.includes('JVM') || name.includes('Memory')) return <Memory color="secondary" />
    return <Speed color="info" />
  }

  return (
    <Box>
      <PageHeader
        title="Observabilidade & Monitoramento do Sistema"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refresh}
              disabled={loading}
            >
              Atualizar Métricas
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportAuditCsv}
            >
              Exportar Auditoria (CSV)
            </Button>
          </Box>
        }
      />

      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Saúde da Infraestrutura & Métricas" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Rotinas Periódicas & Schedulers</span>
                <Chip size="small" color="success" label={`${jobs.length} jobs`} sx={{ height: 20 }} />
              </Box>
            }
          />
          <Tab label="Trilha de Auditoria & Eventos" />
        </Tabs>

        {/* Aba 0: Saúde & Métricas */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <CheckCircle color="success" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Todos os subsistemas estão operando com 100% de disponibilidade
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {metrics.map((metric) => (
                <Grid item xs={12} sm={6} md={4} key={metric.name}>
                  <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {metric.name}
                        </Typography>
                        {getMetricIcon(metric.name)}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {metric.value}
                      </Typography>
                      {metric.unit && (
                        <Chip
                          size="small"
                          label={metric.unit}
                          color={metric.status === 'HEALTHY' ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ mb: 1.5 }}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {metric.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Aba 1: Schedulers / CronJobs K8s */}
        {activeTab === 1 && (
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Rotinas de batch desacopladas da Web API executadas via CronJobs efêmeros do Kubernetes (BE-019).
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nome da Rotina</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Frequência / Agendamento</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Última Execução</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Duração</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Processados</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Ação Manual</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {job.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {job.frequency}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          cron({job.schedule})
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(job.lastRunAt).toLocaleString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{job.lastDurationMs} ms</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {job.itemsProcessed}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={
                            job.status === 'SUCCESS'
                              ? 'Sucesso'
                              : job.status === 'RUNNING'
                              ? 'Executando'
                              : 'Falha'
                          }
                          color={
                            job.status === 'SUCCESS'
                              ? 'success'
                              : job.status === 'RUNNING'
                              ? 'info'
                              : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            triggeringJob === job.id ? (
                              <CircularProgress size={14} />
                            ) : (
                              <PlayArrow fontSize="small" />
                            )
                          }
                          disabled={triggeringJob !== null}
                          onClick={() => triggerJob(job)}
                        >
                          Executar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Aba 2: Trilha de Auditoria */}
        {activeTab === 2 && (
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
              <TextField
                size="small"
                label="Buscar por evento, ator ou mensagem"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                sx={{ minWidth: 320 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="severity-filter-label">Severidade</InputLabel>
                <Select
                  labelId="severity-filter-label"
                  value={severityFilter}
                  label="Severidade"
                  onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | 'INFO' | 'WARN' | 'ERROR')}
                >
                  <MenuItem value="ALL">Todas as Severidades</MenuItem>
                  <MenuItem value="INFO">Informativo (INFO)</MenuItem>
                  <MenuItem value="WARN">Aviso (WARN)</MenuItem>
                  <MenuItem value="ERROR">Erro Crítico (ERROR)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Severidade</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Evento</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ator / Usuário</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>IP Origem</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Detalhes da Ação</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Payload</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAuditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Nenhum registro de auditoria encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={log.severity}
                            color={
                              log.severity === 'INFO'
                                ? 'default'
                                : log.severity === 'WARN'
                                ? 'warning'
                                : 'error'
                            }
                            icon={
                              log.severity === 'WARN' ? (
                                <Warning fontSize="small" />
                              ) : log.severity === 'ERROR' ? (
                                <ErrorIcon fontSize="small" />
                              ) : undefined
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {log.eventType}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{log.actor}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {log.ipAddress}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{log.details}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {log.payload && (
                            <Tooltip title="Inspecionar Payload JSON">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedAuditLog(log)}
                              >
                                <Code fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Modal de Inspeção de Payload JSON */}
      <Dialog
        open={!!selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Payload do Evento ({selectedAuditLog?.eventType})
        </DialogTitle>
        <DialogContent dividers>
          {selectedAuditLog && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                {selectedAuditLog.details}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  overflowX: 'auto',
                }}
              >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(selectedAuditLog.payload, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAuditLog(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
