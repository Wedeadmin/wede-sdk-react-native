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

export type MissionStatus = 'CREATED' | 'SENT' | 'ACK' | 'ON_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'FAILED'

export interface WedeTeamMember {
  id: string
  team_id: string
  name: string
  role: string
  status: 'available' | 'on_mission' | 'offline'
  lat?: number
  lng?: number
  last_seen?: string
}

export interface WedeTeam {
  id: string
  tenant_id: string
  name: string
  type: string
  vertical: string
  status: 'available' | 'on_mission' | 'offline'
  zone_id?: string
  zone_lat?: number
  zone_lng?: number
  equipment?: string[]
  members?: WedeTeamMember[]
  created_at: string
  updated_at: string
}

export interface WedeScoredTeam {
  team_id: string
  team_name: string
  distance_km: number
  eta_min: number
  score: number
  recommended: boolean
  channel: 'internet' | 'sms' | 'voice'
}

export interface WedeMission {
  id: string
  event_id: string
  team_id: string
  status: MissionStatus
  channel_used: string
  vertical?: string
  priority?: string
  payload?: Record<string, unknown>
  feedback?: Record<string, unknown>
  notes?: string
  event_lat?: number
  event_lng?: number
  dispatched_at: string
  sent_at?: string
  ack_at?: string
  on_route_at?: string
  on_site_at?: string
  completed_at?: string
  failed_at?: string
}

export interface WedeBilling {
  tenant_id: string
  country: string
  current_plan: {
    id: string
    name: string
    display_name: string
    max_events_per_year: number
    pricing: { price_yearly: number; currency: string } | null
  } | null
  usage: {
    events_this_year: number
    sms_used: number
    voice_used: number
    dispatches_total: number
    missions_total: number
  }
}

export interface WedeCatalogAction {
  id: string
  tenant_id: string
  vertical: string
  code: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WedeCreateCatalogAction {
  vertical: string
  code: string
  name: string
  description?: string
}
