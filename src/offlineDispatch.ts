/**
 * Wede Offline Dispatch
 * Scores teams locally and queues dispatch when offline.
 * Patent INPI 120488 — Claim 5 implementation.
 */

import { scoreTeams, ScoredTeam, EventInput, TeamInput } from './scoreEngine.js'
import { WedeCache, WedeStorage } from './cache.js'

const QUEUE_KEY = 'wede_offline_dispatch_queue'

export interface OfflineDispatchRequest {
  id: string
  action_id: string
  event: EventInput
  team_id: string
  team_name: string
  score: number
  channel: string
  queued_at: string
  synced: boolean
}

export interface DispatchOfflineResult {
  success: boolean
  team: ScoredTeam | null
  queued: boolean
  queue_id: string | null
  reason?: string
}

export class WedeOfflineDispatch {
  private cache: WedeCache
  private storage: WedeStorage

  constructor(storage: WedeStorage) {
    this.storage = storage
    this.cache = new WedeCache(storage)
  }

  /**
   * Score teams locally using cached data.
   * Works without network connectivity.
   */
  async scoreLocally(event: EventInput): Promise<ScoredTeam[]> {
    const teams = await this.cache.getTeams()
    if (!teams || teams.length === 0) return []
    return scoreTeams(teams, event)
  }

  /**
   * Dispatch offline:
   * 1. Score teams locally
   * 2. Pick best available team
   * 3. Queue dispatch for sync when online
   */
  async dispatch(actionId: string, event: EventInput): Promise<DispatchOfflineResult> {
    const scored = await this.scoreLocally(event)
    const best = scored.find(t => t.status === 'available') ?? scored[0] ?? null

    if (!best) {
      return { success: false, team: null, queued: false, queue_id: null, reason: 'no_teams_cached' }
    }

    const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const entry: OfflineDispatchRequest = {
      id, action_id: actionId, event,
      team_id: best.team_id, team_name: best.team_name,
      score: best.score, channel: best.channel,
      queued_at: new Date().toISOString(), synced: false,
    }

    await this.enqueue(entry)
    return { success: true, team: best, queued: true, queue_id: id }
  }

  /**
   * Get all pending (unsynced) dispatch requests.
   */
  async getPendingQueue(): Promise<OfflineDispatchRequest[]> {
    try {
      const raw = await this.storage.getItem(QUEUE_KEY)
      const all: OfflineDispatchRequest[] = raw ? JSON.parse(raw) : []
      return all.filter(e => !e.synced)
    } catch { return [] }
  }

  /**
   * Mark a queued dispatch as synced.
   */
  async markSynced(id: string): Promise<void> {
    try {
      const raw = await this.storage.getItem(QUEUE_KEY)
      const all: OfflineDispatchRequest[] = raw ? JSON.parse(raw) : []
      const updated = all.map(e => e.id === id ? { ...e, synced: true } : e)
      await this.storage.setItem(QUEUE_KEY, JSON.stringify(updated))
    } catch {}
  }

  /**
   * Clear synced entries from queue.
   */
  async clearSynced(): Promise<void> {
    try {
      const raw = await this.storage.getItem(QUEUE_KEY)
      const all: OfflineDispatchRequest[] = raw ? JSON.parse(raw) : []
      await this.storage.setItem(QUEUE_KEY, JSON.stringify(all.filter(e => !e.synced)))
    } catch {}
  }

  private async enqueue(entry: OfflineDispatchRequest): Promise<void> {
    try {
      const raw = await this.storage.getItem(QUEUE_KEY)
      const all: OfflineDispatchRequest[] = raw ? JSON.parse(raw) : []
      all.push(entry)
      await this.storage.setItem(QUEUE_KEY, JSON.stringify(all))
    } catch {}
  }
}
