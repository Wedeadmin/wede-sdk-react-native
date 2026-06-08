/**
 * Wede Proximity Score Engine — SDK Edition
 * Identical algorithm to backend scoreEngine.ts.
 * No external dependencies. Pure TypeScript. Works fully offline.
 * Patent INPI 120488 — Claim 5: local scoring without connectivity.
 */

export interface ScoredTeam {
  team_id: string
  team_name: string
  status: string
  vertical: string
  distance_km: number
  eta_min: number
  equipment_match: number
  member_availability: number
  score: number
  recommended: boolean
  channel: 'internet' | 'sms' | 'voice'
  position: { lat: number; lng: number; last_seen?: string; source: 'gps' | 'zone' | 'unknown' }
}

export interface TeamInput {
  id: string
  name: string
  status: string
  vertical: string
  equipment: string[]
  zone_lat?: number
  zone_lng?: number
  zone_boundary?: Array<{ lat: number; lng: number }>
  members: {
    id: string
    status: string
    lat?: number | null
    lng?: number | null
    last_seen?: string | null
  }[]
  verticals?: { vertical: string; event_types: string[] }[]
  team_equipment?: { code: string; status: string }[]
}

export interface EventInput {
  lat: number
  lng: number
  vertical?: string
  event_type?: string
  priority?: string
  required_equipment?: string[]
}

export function pointInPolygon(
  lat: number, lng: number,
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  if (polygon.length < 3) return false
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat
    const xj = polygon[j].lng, yj = polygon[j].lat
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function resolvePosition(team: TeamInput): { lat: number; lng: number; source: 'gps' | 'zone' | 'unknown' } {
  const now = Date.now()
  const tenMin = 10 * 60 * 1000
  const fresh = team.members
    .filter(m => m.status === 'available' && m.lat && m.lng && m.last_seen)
    .filter(m => now - new Date(m.last_seen!).getTime() < tenMin)
    .sort((a, b) => new Date(b.last_seen!).getTime() - new Date(a.last_seen!).getTime())
  if (fresh[0]?.lat && fresh[0]?.lng) return { lat: fresh[0].lat, lng: fresh[0].lng, source: 'gps' }
  const anyGps = team.members.filter(m => m.lat && m.lng)
  if (anyGps[0]?.lat && anyGps[0]?.lng) return { lat: anyGps[0].lat!, lng: anyGps[0].lng!, source: 'gps' }
  if (team.zone_lat && team.zone_lng) return { lat: team.zone_lat, lng: team.zone_lng, source: 'zone' }
  return { lat: 0, lng: 0, source: 'unknown' }
}

function resolveChannel(etaMin: number, priority?: string): 'internet' | 'sms' | 'voice' {
  if (priority === 'P1_CRITICAL' || priority === 'CRITICAL') return etaMin > 5 ? 'sms' : 'internet'
  if (etaMin > 15) return 'sms'
  return 'internet'
}

export function scoreTeams(teams: TeamInput[], evt: EventInput): ScoredTeam[] {
  const available = teams.filter(t => t.status === 'available' || t.status === 'on_mission')
  const scored = available.map(team => {
    const pos = resolvePosition(team)
    let distanceKm = 0
    if (pos.source !== 'unknown') {
      distanceKm = parseFloat(haversineKm(pos.lat, pos.lng, evt.lat, evt.lng).toFixed(2))
    }
    const etaMin = Math.round(distanceKm / 0.7)
    const memberAvail = team.members.length > 0
      ? team.members.filter(m => m.status === 'available').length / team.members.length
      : 0
    const operationalEquip = team.team_equipment
      ? team.team_equipment.filter(e => e.status === 'operational').map(e => e.code)
      : team.equipment
    const required = evt.required_equipment ?? []
    const equipmentMatch = required.length > 0
      ? required.filter(eq => operationalEquip.includes(eq)).length / required.length
      : operationalEquip.length > 0 ? 0.8 : 0.5
    const inZone = team.zone_boundary && team.zone_boundary.length >= 3
      ? pointInPolygon(evt.lat, evt.lng, team.zone_boundary)
      : true
    const geofencePenalty = inZone ? 0 : 0.2
    const coversVertical = !evt.vertical || team.vertical === evt.vertical ||
      (team.verticals?.some(v => v.vertical === evt.vertical) ?? false)
    const coversEventType = !evt.event_type ||
      (team.verticals?.some(v => v.event_types.includes(evt.event_type!)) ?? true)
    const capabilityBonus = coversVertical && coversEventType ? 0 : 0.3
    const travelScore = Math.min(etaMin / 30, 1)
    const capScore = (1 - equipmentMatch) + capabilityBonus
    const memberScore = 1 - memberAvail
    const loadPenalty = team.status === 'on_mission' ? 0.5 : 0
    const finalScore = (0.35 * travelScore) + (0.25 * capScore) + (0.2 * memberScore) + (0.1 * loadPenalty) + (0.1 * geofencePenalty)
    return {
      team_id: team.id, team_name: team.name, status: team.status, vertical: team.vertical,
      distance_km: distanceKm, eta_min: etaMin,
      equipment_match: parseFloat(equipmentMatch.toFixed(2)),
      member_availability: parseFloat(memberAvail.toFixed(2)),
      score: parseFloat(finalScore.toFixed(4)),
      recommended: false,
      channel: resolveChannel(etaMin, evt.priority),
      position: { ...pos, last_seen: team.members.find(m => m.lat && m.lng)?.last_seen ?? undefined },
    }
  })
  scored.sort((a, b) => b.score - a.score)
  if (scored.length > 0) scored[0].recommended = true
  return scored
}
