// Device maintenance auto-recovery scheduler (in-memory)
// Restores devices that enter 'maintenance' back to 'online' after a duration
// Duration is derived from malwareConfig.offlineSeconds when set, or a default.

import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import { getMalwareDefinition } from '@/lib/malwareConfig';

interface PendingRecovery { deviceId: string; readyAt: number; reason?: string }

const g = global as unknown as { __pendingRecovery?: Map<string, PendingRecovery> };
if (!g.__pendingRecovery) g.__pendingRecovery = new Map();
const pending = g.__pendingRecovery;

const DEFAULT_SECONDS = 60;

export function scheduleDeviceRecovery(deviceId: string, malwareType?: string) {
  const def = malwareType ? getMalwareDefinition(malwareType) : undefined;
  const seconds = def?.offlineSeconds ?? DEFAULT_SECONDS;
  const readyAt = Date.now() + seconds * 1000;
  pending.set(deviceId, { deviceId, readyAt, reason: malwareType });
}

export function cancelDeviceRecovery(deviceId: string) {
  pending.delete(deviceId);
}

// Called periodically (e.g., from API hits) to process ready recoveries
export async function processDeviceRecoveries(now = Date.now()) {
  if (!pending.size) return [] as string[];
  const ready: string[] = [];
  for (const [id, rec] of pending.entries()) {
    if (now >= rec.readyAt) ready.push(id);
  }
  if (!ready.length) return [];
  try {
    await connectDb();
    for (const id of ready) {
      try {
        const device = await Device.findById(id).select('status');
        if (device && device.status === 'maintenance') {
          device.status = 'online';
          await device.save();
        }
      } catch {}
      pending.delete(id);
    }
  } catch {}
  return ready;
}

export function getPendingRecoveries() {
  return Array.from(pending.values());
}
