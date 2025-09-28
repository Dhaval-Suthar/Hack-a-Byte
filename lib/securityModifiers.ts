// Centralized security & probability modifier logic
// Provides utilities to compute adjusted success chances based on device security toggles
// and (future) reconnaissance / intel requirements.

export interface RawSecuritySettings {
  firewall?: boolean;
  antiVirus?: boolean;
  vulnerabilities?: string[];
  // Extended toggles from SecurityCenterApp (client) – mirrored naming
  vpn?: boolean;
  enc?: boolean; // encryption
  ids?: boolean; // intrusion detection
}

export interface SuccessContext {
  baseSuccess: number; // base malware success probability (0-1)
  security: RawSecuritySettings | null | undefined;
  intelLevel?: number; // how much recon has been done (0-1). If below threshold, apply penalty
  requiredIntel?: number; // needed intel for no penalty (default 0)
}

export interface SuccessComputation {
  finalChance: number;
  appliedPenalty: number; // total negative adjustment applied (positive number means reduction)
  detail: {
    securityPenalty: number;
    intelPenalty: number;
  };
}

// Weight mapping per toggle – each major security feature reduces success by 25%
const TOGGLE_WEIGHTS: Record<string, number> = {
  firewall: 0.25,       // 25% penalty when enabled
  antiVirus: 0.25,      // 25% penalty when enabled
  vpn: 0.25,           // 25% penalty when enabled
  enc: 0.25,           // 25% penalty when enabled
  ids: 0.03,           // 3% penalty when enabled
  vulnerabilitiesClear: 0.04, // 4% bonus for defenders with no vulnerabilities
};

export function computeSecurityPenalty(sec?: RawSecuritySettings | null): number {
  if (!sec) return 0;
  let penalty = 0;
  if (sec.firewall) penalty += TOGGLE_WEIGHTS.firewall;
  if (sec.antiVirus) penalty += TOGGLE_WEIGHTS.antiVirus;
  if (sec.vpn) penalty += TOGGLE_WEIGHTS.vpn;
  if (sec.enc) penalty += TOGGLE_WEIGHTS.enc;
  if (sec.ids) penalty += TOGGLE_WEIGHTS.ids;
  if (!sec.vulnerabilities || sec.vulnerabilities.length === 0) penalty += TOGGLE_WEIGHTS.vulnerabilitiesClear;
  return penalty;
}

export function computeSuccessChance(ctx: SuccessContext): SuccessComputation {
  const secPenalty = computeSecurityPenalty(ctx.security || undefined);
  const intelNeeded = ctx.requiredIntel ?? 0;
  let intelPenalty = 0;
  if (intelNeeded > 0) {
    const have = ctx.intelLevel ?? 0;
    if (have < intelNeeded) {
      // linear penalty up to 25% if zero intel
      const deficit = intelNeeded - have;
      intelPenalty = Math.min(0.25, (deficit / intelNeeded) * 0.25);
    }
  }
  const totalPenalty = secPenalty + intelPenalty;
  const adjusted = Math.max(0.02, ctx.baseSuccess - totalPenalty);
  return {
    finalChance: adjusted,
    appliedPenalty: totalPenalty,
    detail: { securityPenalty: secPenalty, intelPenalty }
  };
}

export function describeComputation(comp: SuccessComputation) {
  return {
    chance: comp.finalChance,
    securityPenalty: comp.detail.securityPenalty,
    intelPenalty: comp.detail.intelPenalty,
  };
}
