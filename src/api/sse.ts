import { api, getToken, getUser, setSession, getCurrentInstitutionId } from './client'

export interface SseMessage {
  event?: string
  data: string
}

interface SseClientOptions {
  url: string
  onMessage: (message: SseMessage) => void
  onError?: (error: Error) => void
  reconnectDelayMs?: number
}

const MAX_RETRY_MS = 30_000

function parseEvent(block: string): SseMessage | null {
  const lines = block.split(/\r?\n/)
  let event: string | undefined
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }
  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}

export class SseClient {
  private readonly url: string
  private readonly onMessage: (message: SseMessage) => void
  private readonly onError?: (error: Error) => void
  private readonly baseDelayMs: number
  private controller: AbortController | null = null
  private closed = false
  private retryMs: number
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: SseClientOptions) {
    this.url = options.url
    this.onMessage = options.onMessage
    this.onError = options.onError
    this.baseDelayMs = options.reconnectDelayMs ?? 3_000
    this.retryMs = this.baseDelayMs
  }

  connect(): void {
    if (this.closed) return
    this.controller = new AbortController()
    void this.open()
  }

  close(): void {
    this.closed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.controller?.abort()
    this.controller = null
  }

  private async open(): Promise<void> {
    if (this.closed) return
    try {
      const controller = this.controller
      const token = getToken()
      const instId = getCurrentInstitutionId()
      const response = await fetch(this.url, {
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(instId ? { 'X-Institution-Id': instId } : {}),
        },
        signal: controller?.signal,
      })

      if (response.status === 401 || response.status === 403) {
        if (await this.tryRefresh()) {
          this.retryMs = this.baseDelayMs
          this.scheduleReconnect(0)
          return
        }
        this.fail(new Error('Não autorizado — sessão expirada.'))
        return
      }

      if (!response.ok || !response.body) {
        throw new Error(`SSE falhou com status ${response.status}`)
      }

      await this.readStream(response.body)
      if (!this.closed) {
        this.retryMs = this.baseDelayMs
        this.scheduleReconnect(this.baseDelayMs)
      }
    } catch (err) {
      if (this.closed) return
      if ((err as Error).name === 'AbortError') return
      this.scheduleReconnect(this.retryMs)
      this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS)
    }
  }

  private async readStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        if (buffer.trim()) {
          const message = parseEvent(buffer + '\n\n')
          if (message) this.onMessage(message)
        }
        return
      }
      buffer += decoder.decode(value, { stream: true })
      let separator: number
      while ((separator = findBlockSeparator(buffer)) >= 0) {
        const raw = buffer.slice(0, separator)
        buffer = buffer.slice(separator + 2)
        const message = parseEvent(raw)
        if (message) {
          this.retryMs = this.baseDelayMs
          this.onMessage(message)
        }
      }
    }
  }

  private scheduleReconnect(delay: number): void {
    if (this.closed) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh')
      const user = getUser()
      if (!user) return false
      setSession(data.accessToken, user)
      return true
    } catch {
      return false
    }
  }

  private fail(error: Error): void {
    this.controller?.abort()
    this.onError?.(error)
  }
}

function findBlockSeparator(buffer: string): number {
  const lf = buffer.indexOf('\n\n')
  const crlf = buffer.indexOf('\r\n\r\n')
  if (lf === -1) return crlf
  if (crlf === -1) return lf
  return Math.min(lf, crlf)
}