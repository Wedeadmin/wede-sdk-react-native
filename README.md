# @wede/react-native-sdk

Official React Native SDK for the Wede Technology platform.

Wede is an offline-first infrastructure layer that keeps critical digital services operational when connectivity, cloud, or infrastructure fails.

The React Native SDK includes a built-in offline queue backed by AsyncStorage — events captured when offline are automatically synced when connectivity is restored.

## Installation

npm install @wede/react-native-sdk
npm install @react-native-async-storage/async-storage

## Quick Start

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage"
import { WedeClient, WedeEvent } from "@wede/react-native-sdk"

const client = new WedeClient({
  apiKey: "wede_live_YOUR_KEY",
  storage: AsyncStorage,
})

// Send event — automatically queued if offline
const result = await client.sendEventOrQueue({
  type: "EMERGENCY",
  idempotency_key: "evt-001",
  vertical: "healthcare",
  priority: "critical",
  payload: { patient_id: "PT123" },
})

if (result.queued) {
  console.log("Offline — event queued locally")
}

// Flush queue when connectivity is restored
const { flushed, failed } = await client.flushQueue()
console.log(`Flushed: ${flushed}, Failed: ${failed}`)

// Check queue size
const size = await client.getQueueSize()
```

## Offline Queue

The offline queue is the key feature of the React Native SDK. Pass any AsyncStorage-compatible storage to enable it.

Events sent via `sendEventOrQueue` are automatically queued when offline and synced when `flushQueue` is called.

Listen for connectivity changes and flush the queue automatically:

```typescript
import NetInfo from "@react-native-community/netinfo"

NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    client.flushQueue()
  }
})
```

## Methods

| Method | Description |
|--------|-------------|
| `sendEvent(event)` | Submit an event (throws if offline) |
| `sendEventOrQueue(event)` | Submit or queue if offline |
| `flushQueue()` | Sync all queued events |
| `getQueueSize()` | Number of queued events |
| `listEvents(params?)` | List events |
| `listZones()` | List all zones |
| `getZone(zoneId)` | Get a specific zone |
| `syncBatch(batch)` | Sync offline batch |
| `getSyncStatus(batchId)` | Get sync status |
| `getConnectivityStatus(zoneId)` | Get zone connectivity |
| `reportConnectivity(report)` | Report connectivity state |
| `listParsers()` | List parsers |
| `getActiveParser(vertical)` | Get active parser |
| `listWebhooks()` | List webhooks |
| `createWebhook(webhook)` | Create webhook |
| `deleteWebhook(webhookId)` | Delete webhook |
| `getTenantInfo()` | Get tenant details |
| `getUsage(from, to)` | Get usage statistics |

## Documentation

https://docs.wede.pt

## License

MIT
