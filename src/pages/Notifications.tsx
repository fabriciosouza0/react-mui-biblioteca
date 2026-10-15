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
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
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
  Email,
  Error as ErrorIcon,
  MarkEmailRead,
  NotificationsActive,
  Replay,
  Send,
  Visibility,
  WhatsApp,
} from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import { useNotifications } from '../hooks/useNotifications'
import { useInstitution } from '../context/InstitutionContext'
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_EVENT_LABELS,
  type NotificationChannel,
  type NotificationStatus,
  type SystemNotification,
} from '../api/types'

export default function Notifications() {
  const { selectedInstitution, loading: instLoading } = useInstitution()
  const institutionId = selectedInstitution?.id

  const {
    filteredNotifications,
    unreadCount,
    channelFilter,
    setChannelFilter,
    statusFilter,
    setStatusFilter,
    loading,
    preferences,
    setPreferences,
    markAsRead,
    markAllAsRead,
    resendNotification,
    sendTestNotification,
    savePreferences,
  } = useNotifications(institutionId)

  const [activeTab, setActiveTab] = useState(0)
  const [selectedNotif, setSelectedNotif] = useState<SystemNotification | null>(null)
  const [testChannel, setTestChannel] = useState<NotificationChannel>('EMAIL')
  const [testDestination, setTestDestination] = useState('biblioteca@escola.ce.gov.br')
  const [testSuccessMessage, setTestSuccessMessage] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)

  if (instLoading || !institutionId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const getChannelIcon = (channel: NotificationChannel) => {
    switch (channel) {
      case 'EMAIL':
        return <Email color="primary" fontSize="small" />
      case 'PUSH':
        return <NotificationsActive color="secondary" fontSize="small" />
      case 'WHATSAPP':
        return <WhatsApp color="success" fontSize="small" />
    }
  }

  const handleTestSend = async () => {
    if (!testDestination.trim()) return
    await sendTestNotification(testChannel, testDestination.trim())
    setTestSuccessMessage(`Notificação de teste enviada com sucesso para ${testDestination}!`)
    setTimeout(() => setTestSuccessMessage(''), 5000)
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    await savePreferences(preferences)
    setSavingPrefs(false)
  }

  return (
    <Box>
      <PageHeader
        title="Central de Notificações & Alertas"
        action={
          <Button
            variant="outlined"
            startIcon={<MarkEmailRead />}
            onClick={() => markAllAsRead()}
            disabled={loading || unreadCount === 0}
          >
            Marcar todas como lidas ({unreadCount})
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Histórico & Fila de Envios</span>
                {unreadCount > 0 && (
                  <Chip size="small" color="primary" label={unreadCount} sx={{ height: 20 }} />
                )}
              </Box>
            }
          />
          <Tab label="Configurações de Canais & Automações" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ p: 2.5 }}>
            {/* Barra de Filtros */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="channel-filter-label">Canal de Envio</InputLabel>
                <Select
                  labelId="channel-filter-label"
                  value={channelFilter}
                  label="Canal de Envio"
                  onChange={(e) => setChannelFilter(e.target.value as NotificationChannel | 'ALL')}
                >
                  <MenuItem value="ALL">Todos os Canais</MenuItem>
                  <MenuItem value="EMAIL">E-mail (SMTP/SendGrid)</MenuItem>
                  <MenuItem value="PUSH">Push Web/FCM</MenuItem>
                  <MenuItem value="WHATSAPP">WhatsApp API</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as NotificationStatus | 'ALL')}
                >
                  <MenuItem value="ALL">Todos os Status</MenuItem>
                  <MenuItem value="SENT">Enviado</MenuItem>
                  <MenuItem value="PENDING">Pendente na Fila</MenuItem>
                  <MenuItem value="FAILED">Falha de Envio</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Tabela de Notificações */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Canal</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Destinatário</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assunto & Mensagem</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Evento</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Data / Hora</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Nenhuma notificação encontrada para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <TableRow
                        key={notif.id}
                        hover
                        sx={{
                          bgcolor: notif.read ? 'inherit' : 'action.hover',
                          fontWeight: notif.read ? 'normal' : '500',
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getChannelIcon(notif.channel)}
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {NOTIFICATION_CHANNEL_LABELS[notif.channel]}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {notif.recipientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notif.recipientContact}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 320 }}>
                          <Typography variant="body2" sx={{ fontWeight: notif.read ? 400 : 700 }} noWrap>
                            {notif.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {notif.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={NOTIFICATION_EVENT_LABELS[notif.eventType] ?? notif.eventType}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={
                              notif.status === 'SENT'
                                ? 'Enviado'
                                : notif.status === 'PENDING'
                                ? 'Pendente'
                                : 'Falha'
                            }
                            color={
                              notif.status === 'SENT'
                                ? 'success'
                                : notif.status === 'PENDING'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(notif.createdAt).toLocaleString('pt-BR')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Ver detalhes do envio">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedNotif(notif)
                                  if (!notif.read) markAsRead(notif.id)
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {notif.status === 'FAILED' && (
                              <Tooltip title="Reenviar agora">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => resendNotification(notif.id)}
                                >
                                  <Replay fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {!notif.read && (
                              <Tooltip title="Marcar como lida">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => markAsRead(notif.id)}
                                >
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Canais de Entrega Ativos
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email color="primary" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          E-mail (SMTP / SendGrid)
                        </Typography>
                      </Box>
                      <Switch
                        checked={preferences.emailEnabled}
                        onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Envio de confirmações de empréstimo, avisos de vencimento e boletos/PIX de multas.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsActive color="secondary" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Web Push / Mobile FCM
                        </Typography>
                      </Box>
                      <Switch
                        checked={preferences.pushEnabled}
                        onChange={(e) => setPreferences({ ...preferences, pushEnabled: e.target.checked })}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Alertas instantâneos no navegador e no aplicativo para reservas disponíveis e prazos.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WhatsApp color="success" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          WhatsApp (Twilio / Meta API)
                        </Typography>
                      </Box>
                      <Switch
                        checked={preferences.whatsappEnabled}
                        onChange={(e) => setPreferences({ ...preferences, whatsappEnabled: e.target.checked })}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Lembretes diretos no mensageiro para avisos críticos e cobrança amigável.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Gatilhos de Notificações Automáticas
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyHoldReady}
                      onChange={(e) => setPreferences({ ...preferences, notifyHoldReady: e.target.checked })}
                    />
                  }
                  label="Notificar imediatamente quando uma reserva estiver disponível (Hold Ready)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyOverdue}
                      onChange={(e) => setPreferences({ ...preferences, notifyOverdue: e.target.checked })}
                    />
                  }
                  label="Disparar alerta diário para empréstimos em atraso"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyFines}
                      onChange={(e) => setPreferences({ ...preferences, notifyFines: e.target.checked })}
                    />
                  }
                  label="Notificar lançamento de multa com link de pagamento PIX"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.notifyLoanCreated}
                      onChange={(e) => setPreferences({ ...preferences, notifyLoanCreated: e.target.checked })}
                    />
                  }
                  label="Enviar comprovante digital na retirada de exemplares"
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Disparo de Teste de Conectividade
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="test-channel-label">Canal</InputLabel>
                <Select
                  labelId="test-channel-label"
                  value={testChannel}
                  label="Canal"
                  onChange={(e) => setTestChannel(e.target.value as NotificationChannel)}
                >
                  <MenuItem value="EMAIL">E-mail</MenuItem>
                  <MenuItem value="PUSH">Web Push</MenuItem>
                  <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Destinatário de Teste"
                value={testDestination}
                onChange={(e) => setTestDestination(e.target.value)}
                sx={{ minWidth: 280 }}
              />
              <Button variant="outlined" startIcon={<Send />} onClick={handleTestSend}>
                Disparar Teste
              </Button>
            </Box>

            {testSuccessMessage && (
              <Chip
                color="success"
                icon={<CheckCircle />}
                label={testSuccessMessage}
                sx={{ mb: 3, p: 1 }}
              />
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="contained"
                onClick={handleSavePrefs}
                disabled={savingPrefs}
              >
                Salvar Configurações de Notificação
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Modal de Detalhes da Notificação */}
      <Dialog
        open={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Detalhes da Notificação
        </DialogTitle>
        <DialogContent dividers>
          {selectedNotif && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getChannelIcon(selectedNotif.channel)}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {NOTIFICATION_CHANNEL_LABELS[selectedNotif.channel]}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={selectedNotif.status === 'SENT' ? 'Enviado' : selectedNotif.status === 'PENDING' ? 'Pendente' : 'Falhou'}
                  color={selectedNotif.status === 'SENT' ? 'success' : selectedNotif.status === 'PENDING' ? 'warning' : 'error'}
                />
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Destinatário</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedNotif.recipientName} ({selectedNotif.recipientContact})
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Assunto</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedNotif.subject}
                </Typography>
              </Box>

              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Corpo da Mensagem
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedNotif.message}
                </Typography>
              </Box>

              {selectedNotif.errorReason && (
                <Box sx={{ bgcolor: 'error.light', color: 'error.contrastText', p: 2, borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <ErrorIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Motivo da Falha
                    </Typography>
                  </Box>
                  <Typography variant="caption">
                    {selectedNotif.errorReason}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Tentativas de entrega: {selectedNotif.attempts}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Criado em: {new Date(selectedNotif.createdAt).toLocaleString('pt-BR')}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedNotif(null)}>Fechar</Button>
          {selectedNotif?.status === 'FAILED' && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                resendNotification(selectedNotif.id)
                setSelectedNotif(null)
              }}
            >
              Reenviar Notificação
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
