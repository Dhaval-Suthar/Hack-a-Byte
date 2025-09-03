// Simple in-process sweeper for transient in-memory maps.
// NOTE: For multi-instance deployments replace with Redis + key TTL.
import { wormTokens } from '@/pages/api/attack/worm';
import { activeFakeBank } from '@/pages/api/attack/fakebank';
import { activeRansomDemands } from '@/pages/api/attack/ransomware';

const g = global as unknown as { __sweeperStarted?: boolean };
if (!g.__sweeperStarted) {
  g.__sweeperStarted = true;
  setInterval(() => {
    const now = Date.now();
    // Worm tokens prune
    for (const [id,t] of Object.entries(wormTokens)) {
      if (t.expires < now) delete wormTokens[id];
    }
    // Fake bank windows
    for (const [teamId, win] of Object.entries(activeFakeBank)) {
      if (win.expires < now) delete activeFakeBank[teamId];
    }
    // Ransom demands (shape: { [teamId]: { expires:number } })
    for (const [key, demand] of Object.entries(activeRansomDemands)) {
      if (demand.expires < now) delete activeRansomDemands[key];
    }
  }, 30_000).unref();
}
