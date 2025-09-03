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

// Weight mapping per toggle – tweak central place
const TOGGLE_WEIGHTS: Record<string, number> = {
  firewall: 0.08,
  antiVirus: 0.07,
  vpn: 0.05,
  enc: 0.06,
  ids: 0.05,
  vulnerabilitiesClear: 0.08, // no vulns bonus for defenders (penalty to attacker)
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
