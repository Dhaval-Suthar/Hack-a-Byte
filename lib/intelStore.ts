// In-memory reconnaissance intel store
// Tracks intel level per attackerTeamId -> targetDeviceId pair with expiry/decay

export interface IntelRecord { level: number; expires: number; lastGain: number; }

interface IntelMap { [attackerTeamId: string]: { [targetDeviceId: string]: IntelRecord } }

const g = global as unknown as { __intelMap?: IntelMap };
if (!g.__intelMap) g.__intelMap = {};
const intelMap = g.__intelMap;

// Config
const MAX_LEVEL = 1.0;
const GAIN_MIN = 0.08;
const GAIN_MAX = 0.18;
const BASE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes of freshness

export function getIntelLevel(attacker: string|undefined, target: string|undefined): number {
  if (!attacker || !target) return 0;
  const rec = intelMap[attacker]?.[target];
  if (!rec) return 0;
  if (Date.now() > rec.expires) {
    delete intelMap[attacker][target];
    return 0;
  }
  return Math.min(MAX_LEVEL, rec.level);
}

export function applyRecon(attacker: string, target: string): IntelRecord {
  const now = Date.now();
  intelMap[attacker] = intelMap[attacker] || {};
  const existing = intelMap[attacker][target];
  if (existing && now > existing.expires) {
    // expired stale; reset
    delete intelMap[attacker][target];
  }
  const gain = GAIN_MIN + Math.random() * (GAIN_MAX - GAIN_MIN);
  const newLevel = Math.min(MAX_LEVEL, (intelMap[attacker][target]?.level || 0) + gain);
  const rec: IntelRecord = { level: newLevel, expires: now + BASE_EXPIRY_MS, lastGain: now };
  intelMap[attacker][target] = rec;
  return rec;
}

export function getIntelStatus(attacker: string, target: string) {
  const level = getIntelLevel(attacker, target);
  return { level, fresh: level>0 };
}

export function decayAll() {
  const now = Date.now();
  for (const a of Object.keys(intelMap)) {
    for (const t of Object.keys(intelMap[a])) {
      if (now > intelMap[a][t].expires) delete intelMap[a][t];
    }
  }
}
