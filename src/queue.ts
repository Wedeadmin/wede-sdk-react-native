import { WedeEvent, WedeStorage } from './types.js'

const QUEUE_KEY = 'wede_offline_queue'

export class OfflineQueue {
  private storage: WedeStorage

  constructor(storage: WedeStorage) {
    this.storage = storage
  }

  async push(event: WedeEvent): Promise<void> {
    const queue = await this.getAll()
    queue.push({ ...event, _queued_at: new Date().toISOString() })
    await this.storage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }

  async getAll(): Promise<(WedeEvent & { _queued_at: string })[]> {
    try {
      const raw = await this.storage.getItem(QUEUE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(QUEUE_KEY)
  }

  async size(): Promise<number> {
    const queue = await this.getAll()
    return queue.length
  }
}
