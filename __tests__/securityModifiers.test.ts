import { computeSuccessChance } from '@/lib/securityModifiers';

describe('securityModifiers', () => {
  it('reduces success chance with active defenses', () => {
    const base = 0.6;
    const { finalChance } = computeSuccessChance({ baseSuccess: base, security: { firewall: true, antiVirus: true, vpn: true, enc: true, ids: true, vulnerabilities: [] } });
    expect(finalChance).toBeLessThan(base);
  });
  it('applies intel penalty when insufficient intel', () => {
    const { finalChance: lowIntel } = computeSuccessChance({ baseSuccess: 0.5, security: {}, intelLevel: 0.1, requiredIntel: 0.5 });
    const { finalChance: goodIntel } = computeSuccessChance({ baseSuccess: 0.5, security: {}, intelLevel: 0.5, requiredIntel: 0.5 });
    expect(lowIntel).toBeLessThan(goodIntel);
  });
});
