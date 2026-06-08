/**
 * Wede SDK Local Cache
 * Stores teams and catalog actions locally for offline scoring.
 * Uses abstract storage (localStorage, AsyncStorage, etc.)
 */

import { WedeTeam, WedeCatalogAction } from './types.js'
import { TeamInput } from './scoreEngine.js'

const CACHE_KEY_TEAMS    = 'wede_cache_teams'
const CACHE_KEY_CATALOG  = 'wede_cache_catalog'
const CACHE_KEY_META     = 'wede_cache_meta'
const CACHE_TTL_MS       = 5 * 60 * 1000 // 5 minutes

export interface WedeStorage {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export interface CacheMeta {
  teams_at?: string
  catalog_at?: string
}

export class WedeCache {
  private storage: WedeStorage

  constructor(storage: WedeStorage) {
    this.storage = storage
  }

  private async get(key: string): Promise<unknown> {
    try {
      const raw = await this.storage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  private async set(key: string, value: unknown): Promise<void> {
    await this.storage.setItem(key, JSON.stringify(value))
  }

  async setTeams(teams: WedeTeam[]): Promise<void> {
    await this.set(CACHE_KEY_TEAMS, teams)
    const meta = (await this.get(CACHE_KEY_META) as CacheMeta) ?? {}
    meta.teams_at = new Date().toISOString()
    await this.set(CACHE_KEY_META, meta)
  }

  async getTeams(): Promise<TeamInput[] | null> {
    const teams = await this.get(CACHE_KEY_TEAMS) as WedeTeam[] | null
    if (!teams) return null
    const meta = (await this.get(CACHE_KEY_META) as CacheMeta) ?? {}
    if (meta.teams_at) {
      const age = Date.now() - new Date(meta.teams_at).getTime()
      if (age > CACHE_TTL_MS) return null // stale
    }
    return teams.map(t => ({
      id: t.id, name: t.name, status: t.status, vertical: t.vertical,
      equipment: t.equipment ?? [], members: t.members ?? [],
      zone_lat: t.zone_lat, zone_lng: t.zone_lng,
    }))
  }

  async setCatalog(actions: WedeCatalogAction[]): Promise<void> {
    await this.set(CACHE_KEY_CATALOG, actions)
    const meta = (await this.get(CACHE_KEY_META) as CacheMeta) ?? {}
    meta.catalog_at = new Date().toISOString()
    await this.set(CACHE_KEY_META, meta)
  }

  async getCatalog(): Promise<WedeCatalogAction[] | null> {
    return this.get(CACHE_KEY_CATALOG) as Promise<WedeCatalogAction[] | null>
  }

  async getMeta(): Promise<CacheMeta> {
    return (await this.get(CACHE_KEY_META) as CacheMeta) ?? {}
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(CACHE_KEY_TEAMS)
    await this.storage.removeItem(CACHE_KEY_CATALOG)
    await this.storage.removeItem(CACHE_KEY_META)
  }
}
