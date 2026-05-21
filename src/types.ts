export interface WedeClientOptions {
  apiKey: string
  baseUrl?: string
  timeout?: number
  retries?: number
  storage?: WedeStorage
}

export interface WedeStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

export interface WedeEvent {
  type: string
  idempotency_key: string
  payload: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high' | 'critical'
  vertical?: string
  zone_id?: string
  channel_preference?: 'rest_full' | 'rest_compressed' | 'sms' | 'queued_offline'
}

export interface WedeZone {
  zone_id: string
  name: string
  country: string
  region?: string
  connectivity_state: 'online' | 'degraded' | 'offline'
  verticals_active: string[]
}

export interface WedeSyncBatch {
  events: WedeEvent[]
  captured_at: string
  device_id?: string
}

export interface WedeConnectivityStatus {
  zone_id: string
  state: 'online' | 'degraded' | 'offline'
  latency_ms?: number
  channel_available: string[]
  reported_at: string
}

export interface WedeParserField {
  id: string
  name: string
  sms_code: string
  type: string
  required: boolean
  enabled: boolean
  offline_capable: boolean
  section: string
  max_bytes: number
  description?: string
  enum_values?: string[]
  legal?: boolean
  custom?: boolean
}

export interface WedeParser {
  id: string
  tenant_id: string
  vertical: string
  version: number
  name: string
  is_active: boolean
  schema: WedeParserField[]
  created_at: string
  updated_at: string
}

export interface WedeResponse<T> {
  data: T
  request_id: string
  timestamp: string
}
