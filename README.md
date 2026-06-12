# @wede/react-native-sdk

Official React Native SDK for the Wede Technology platform.

Wede is an offline-first middleware layer that keeps critical operational workflows running regardless of connectivity. When internet fails, operations continue locally and sync automatically on reconnect.

## Installation

```bash
npm install @wede/react-native-sdk
npm install @react-native-async-storage/async-storage
```

## Quick Start

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WedeClient } from '@wede/react-native-sdk'

const client = new WedeClient({
  apiKey: 'wede_live_YOUR_KEY',
  storage: AsyncStorage,
})

// Send an event
const event = await client.sendEvent({
  type: 'EMERGENCY',
  priority: 'high',
  vertical: 'healthcare',
  idempotency_key: 'evt-001',
  payload: { condition: 'cardiac_arrest' },
  location: { lat: 38.7169, lng: -9.1395 }
})

// Score and dispatch teams
const scored = await client.scoreTeams({
  lat: 38.7169, lng: -9.1395,
  vertical: 'healthcare', priority: 'high'
})

await client.dispatch({
  event_id: event.data.event_id,
  team_id: scored.data[0].team_id,
  event_lat: 38.7169, event_lng: -9.1395
})
```

## Offline Operation

The SDK operates fully offline. When internet is unavailable, dispatches are queued locally with guaranteed delivery on reconnect.

```typescript
import { WedeClient, WedeDeviceId } from '@wede/react-native-sdk'

// Register device on first launch
const deviceId = await WedeDeviceId.getOrCreate(AsyncStorage)
await client.registerDevice(deviceId, 'ios', '2.0.0')

// Dispatch works online and offline
const result = await client.dispatch({
  event_id: 'uuid', team_id: 'uuid',
  event_lat: 38.7169, event_lng: -9.1395
})
// result.queued === true when offline

// Sync when connectivity restored
await client.syncDeviceQueue(deviceId)
```

## Method Reference

| Method | Description |
| --- | --- |
| `sendEvent(params)` | Submit an operational event |
| `listEvents()` | List events for the tenant |
| `scoreTeams(params)` | Score available teams by proximity and capability |
| `dispatch(params)` | Dispatch a team to an event |
| `requestBackup(params)` | Request backup for an active mission |
| `listMissions()` | List missions |
| `getMission(id)` | Get a specific mission |
| `updateMissionStatus(id, status)` | Update mission status |
| `updateDispatchSettings(params)` | Configure auto-dispatch settings |
| `registerDevice(deviceId, platform, version)` | Register device for offline sync |
| `syncDeviceQueue(deviceId)` | Sync offline queue with server |
| `refreshCache()` | Refresh local team and catalog cache |
| `getTenantInfo()` | Get tenant configuration |
| `getUsage(from, to)` | Get usage statistics |
| `listZones()` | List operational zones |
| `listParsers()` | List event parsers |
| `getBilling()` | Get billing information |

## Documentation

[docs.wede.pt](https://docs.wede.pt)

## Patent

Wede Technology INPI 120488 (pending) — Claim 5: local score engine and guaranteed offline dispatch queue.

## License

MIT
