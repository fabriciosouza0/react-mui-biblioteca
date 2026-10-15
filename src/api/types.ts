export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface Institution {
  id: string
  code: string
  name: string
  settings: Record<string, unknown>
  createdAt: string
}

export type AdminRoleType = 'GLOBAL_ADMIN' | 'INSTITUTION_ADMIN'

export interface InstitutionWithRole extends Institution {
  role: AdminRoleType
}

export interface MeResponse {
  login: string
  nome: string
  role: AdminRoleType
  institutions: InstitutionWithRole[]
}

export type PatronProfileType = 'STUDENT' | 'TEACHER' | 'STAFF' | 'EXTERNAL'
export type PatronStatusType = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED'

export interface ProfileConfig {
  id: string
  institutionId: string
  profile: PatronProfileType
  maxLoans: number
  loanDays: number
  maxRenewals: number
  holdLimit: number
  fineRateCents: number
  fineCapCents: number
  createdAt: string
  updatedAt: string
}

export interface Library {
  id: string
  institutionId: string
  name: string
  isCentral: boolean
  createdAt: string
  updatedAt: string
}

export interface Patron {
  id: string
  institutionId: string
  externalId: string
  name: string
  phone?: string
  profile: PatronProfileType
  status: PatronStatusType
  fineBalance: number
  version: number
  createdAt: string
  updatedAt: string
}

export interface Work {
  id: string
  institutionId: string
  isbn13?: string
  title: string
  authors: string
  publisher?: string
  publishedYear?: number
  edition?: string
  cdu?: string
  coverUrl?: string
  description?: string
  version: number
  createdAt: string
  updatedAt: string
}

export type ItemStatusType = 'AVAILABLE' | 'ON_LOAN' | 'ON_HOLD' | 'IN_TRANSIT' | 'LOST' | 'WITHDRAWN' | 'IN_REPAIR'

export interface Item {
  id: string
  workId: string
  workTitle?: string
  workIsbn13?: string
  libraryId: string
  libraryName?: string
  targetLibraryId?: string | null
  targetLibraryName?: string | null
  barcode: string
  callNumber?: string
  status: ItemStatusType
  transferNote?: string
  withdrawReason?: string
  version: number
  createdAt: string
  updatedAt: string
}

export type LoanStatusType = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST_CLAIMED'

export interface Loan {
  id: string
  patronId: string
  patronName?: string
  patronExternalId?: string
  patronProfile?: string
  itemId: string
  itemBarcode?: string
  itemCallNumber?: string
  workTitle?: string
  libraryId: string
  libraryName?: string
  status: LoanStatusType
  checkedOutAt: string
  dueAt: string
  returnedAt?: string
  returnedLibraryId?: string
  renewalCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export type HoldStatusType = 'WAITING' | 'READY' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'

export interface Hold {
  id: string
  patronId: string
  patronName?: string
  patronExternalId?: string
  workId: string
  workTitle?: string
  workIsbn13?: string
  libraryId: string
  libraryName?: string
  status: HoldStatusType
  position: number
  placedAt: string
  readyAt?: string
  expiresAt?: string
  fulfilledAt?: string
  cancelledAt?: string
  version: number
  createdAt: string
  updatedAt: string
}

export type FineTypeType = 'OVERDUE' | 'LOST' | 'DAMAGE' | 'PROCESSING'
export type FineStatusType = 'PENDING' | 'PARTIAL' | 'PAID' | 'WAIVED' | 'WRITTEN_OFF'

export interface Fine {
  id: string
  patronId: string
  patronName?: string
  patronExternalId?: string
  loanId?: string
  itemBarcode?: string
  workTitle?: string
  type: FineTypeType
  amountCents: number
  balanceCents: number
  status: FineStatusType
  assessedAt: string
  paidAt?: string
  waivedAt?: string
  reason?: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface DashboardMetrics {
  totalWorks: number
  totalItems: number
  totalPatrons: number
  activeLoans: number
  overdueLoans: number
  readyHolds: number
  pendingFines: number
  totalFineBalanceCents: number
}

export interface Dashboard {
  totalWorks: number
  totalItems: number
  availableItems: number
  totalPatrons: number
  activePatrons: number
  activeLoans: number
  overdueLoans: number
  readyHolds: number
  pendingFines: number
  totalFineBalance: string
  totalFineBalanceCents: number
  totalLibraries: number
  inTransitItems: number
  inRepairItems: number
}

export interface PatronFormData {
  institutionId: string
  externalId: string
  name: string
  phone: string
  profile: PatronProfileType
}

export interface WorkFormData {
  institutionId: string
  isbn13: string
  title: string
  authors: string
  publisher: string
  publishedYear: number | ''
  edition: string
  cdu: string
  coverUrl: string
  description: string
}

export interface ItemFormData {
  workId: string
  libraryId: string
  barcode: string
  callNumber: string
}

export interface LoanFormData {
  patronId: string
  itemId: string
  libraryId: string
}

export interface HoldFormData {
  patronId: string
  workId: string
  libraryId: string
}

export interface FinePaymentData {
  fineId: string
  paymentRef: string
  amountCents: number
}

export interface ProfileConfigFormData {
  institutionId: string
  profile: PatronProfileType
  maxLoans: number
  loanDays: number
  maxRenewals: number
  holdLimit: number
  fineRateCents: number
  fineCapCents: number
}

export interface LibraryFormData {
  institutionId: string
  name: string
  isCentral: boolean
}

export const PROFILE_LABELS: Record<PatronProfileType, string> = {
  STUDENT: 'Aluno',
  TEACHER: 'Professor',
  STAFF: 'Funcionário',
  EXTERNAL: 'Externo',
}

export const PATRON_STATUS_LABELS: Record<PatronStatusType, string> = {
  ACTIVE: 'Ativo',
  BLOCKED: 'Bloqueado',
  SUSPENDED: 'Suspenso',
}

export const LOAN_STATUS_LABELS: Record<LoanStatusType, string> = {
  ACTIVE: 'Ativo',
  RETURNED: 'Devolvido',
  OVERDUE: 'Atrasado',
  LOST_CLAIMED: 'Perdido (reivindicado)',
}

export const HOLD_STATUS_LABELS: Record<HoldStatusType, string> = {
  WAITING: 'Na fila',
  READY: 'Pronto para retirada',
  FULFILLED: 'Retirado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
}

export const FINE_STATUS_LABELS: Record<FineStatusType, string> = {
  PENDING: 'Pendente',
  PARTIAL: 'Parcial',
  PAID: 'Pago',
  WAIVED: 'Isento',
  WRITTEN_OFF: 'Baixado',
}

export const FINE_TYPE_LABELS: Record<FineTypeType, string> = {
  OVERDUE: 'Atraso',
  LOST: 'Perda',
  DAMAGE: 'Dano',
  PROCESSING: 'Taxa administrativa',
}

export const ITEM_STATUS_LABELS: Record<ItemStatusType, string> = {
  AVAILABLE: 'Disponível',
  ON_LOAN: 'Emprestado',
  ON_HOLD: 'Reservado',
  IN_TRANSIT: 'Em trânsito',
  LOST: 'Perdido',
  WITHDRAWN: 'Retirado do acervo',
  IN_REPAIR: 'Em reparo',
}

export interface WorkItemDependency {
  id: string
  barcode: string
  callNumber: string | null
  status: string
  libraryName: string
}

export interface WorkHoldDependency {
  id: string
  patronName: string
  libraryName: string
  status: string
  position: number
}

export interface WorkDependenciesResponse {
  items: WorkItemDependency[]
  holds: WorkHoldDependency[]
}

// FE-015: Relatórios / OLAP
export type ReportType = 'loans_by_library_month' | 'top_works' | 'patron_activity' | 'fine_collection'

export interface LoanReportRow {
  month: string
  libraryName: string
  loansCount: number
  returnedCount: number
  overdueRate: number
  avgLoanDays: number
}

export interface TopWorkReportRow {
  workId: string
  title: string
  authors: string
  isbn?: string
  loansCount: number
  uniquePatrons: number
  holdsCount: number
}

export interface PatronActivityReportRow {
  patronId: string
  name: string
  profile: string
  activeLoans: number
  totalLoans12m: number
  fines12mCents: number
  status: string
}

export interface FineCollectionReportRow {
  month: string
  assessedCents: number
  collectedCents: number
  waivedCents: number
  writtenOffCents: number
  collectionRate: number
}

export interface ReportSummaryKpi {
  label: string
  value: string | number
  change?: string
  isPositive?: boolean
}

// FE-016: Notificações e Preferências
export type NotificationChannel = 'EMAIL' | 'PUSH' | 'WHATSAPP'
export type NotificationStatus = 'SENT' | 'PENDING' | 'FAILED'
export type NotificationEventType =
  | 'LOAN_CREATED'
  | 'LOAN_DUE_SOON'
  | 'LOAN_OVERDUE'
  | 'HOLD_READY'
  | 'HOLD_EXPIRED'
  | 'FINE_ASSESSED'
  | 'FINE_PAID'

export interface SystemNotification {
  id: string
  channel: NotificationChannel
  eventType: NotificationEventType
  recipientName: string
  recipientContact: string
  subject: string
  message: string
  status: NotificationStatus
  attempts: number
  createdAt: string
  sentAt?: string
  errorReason?: string
  read: boolean
}

export interface NotificationPreferences {
  emailEnabled: boolean
  pushEnabled: boolean
  whatsappEnabled: boolean
  dueSoonDays: number
  notifyHoldReady: boolean
  notifyOverdue: boolean
  notifyFines: boolean
  notifyLoanCreated: boolean
}

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: 'E-mail',
  PUSH: 'Push Web/App',
  WHATSAPP: 'WhatsApp',
}

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEventType, string> = {
  LOAN_CREATED: 'Empréstimo Realizado',
  LOAN_DUE_SOON: 'Lembrete de Vencimento',
  LOAN_OVERDUE: 'Aviso de Atraso',
  HOLD_READY: 'Reserva Disponível',
  HOLD_EXPIRED: 'Reserva Expirada',
  FINE_ASSESSED: 'Multa Emitida',
  FINE_PAID: 'Confirmação de Pagamento',
}

// FE-017: Observabilidade, Auditoria e Schedulers
export type JobStatus = 'SUCCESS' | 'RUNNING' | 'FAILED' | 'IDLE'

export interface ScheduledJobInfo {
  id: string
  name: string
  description: string
  schedule: string
  frequency: string
  lastRunAt: string
  lastDurationMs: number
  status: JobStatus
  itemsProcessed: number
  errorCount: number
  nextRunAt: string
}

export interface SystemMetric {
  name: string
  value: string | number
  unit?: string
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  description: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  eventType: string
  actor: string
  ipAddress: string
  severity: 'INFO' | 'WARN' | 'ERROR'
  details: string
  payload?: Record<string, unknown>
}