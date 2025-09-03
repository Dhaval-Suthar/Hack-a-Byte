import { scheduleDeviceRecovery, processDeviceRecoveries, getPendingRecoveries, cancelDeviceRecovery } from '@/lib/deviceRecovery';

jest.mock('@/db/connectDb', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/malwareConfig', () => ({ getMalwareDefinition: (t: string) => ({ id: t, offlineSeconds: t==='ransomware'?90: (t==='trojan'?60:45) }) }));

// Mock Device model methods used in processDeviceRecoveries
const findByIdMock = jest.fn();
jest.mock('@/models/Device', () => ({
  __esModule: true,
  default: { findById: (...args: unknown[]) => findByIdMock(...args) }
}));

describe('deviceRecovery module', () => {
  beforeEach(() => {
    // Clear pending map by cancelling each
    for (const rec of getPendingRecoveries()) cancelDeviceRecovery(rec.deviceId);
    jest.clearAllMocks();
  });

  it('schedules recovery with malware specific offlineSeconds', () => {
    scheduleDeviceRecovery('dev1', 'ransomware');
    const recs = getPendingRecoveries();
    expect(recs.length).toBe(1);
    const rec = recs[0];
    // ransomware offlineSeconds from config (90) -> readyAt about now+90s
    const delta = rec.readyAt - Date.now();
    expect(delta).toBeGreaterThan(85_000); // allow margin
    expect(delta).toBeLessThan(95_000);
  });

  it('uses default when malware type not provided', () => {
    scheduleDeviceRecovery('dev2');
    const rec = getPendingRecoveries()[0];
    const delta = rec.readyAt - Date.now();
    expect(delta).toBeGreaterThan(55_000);
    expect(delta).toBeLessThan(65_000);
  });

  it('processes ready recoveries and sets device online', async () => {
    scheduleDeviceRecovery('dev3', 'trojan');
    const rec = getPendingRecoveries()[0];
    // Force ready
    rec.readyAt = Date.now() - 1000;
  const save = jest.fn().mockResolvedValue(undefined);
  const deviceObj = { _id: 'dev3', status: 'maintenance', save };
  findByIdMock.mockReturnValue({ select: () => deviceObj });
    const recovered = await processDeviceRecoveries(Date.now());
    expect(recovered).toContain('dev3');
    expect(save).toHaveBeenCalled();
  });

  it('skips devices not in maintenance', async () => {
    scheduleDeviceRecovery('dev4', 'worm');
    const rec = getPendingRecoveries()[0];
    rec.readyAt = Date.now() - 1000;
  const save = jest.fn();
  findByIdMock.mockReturnValue({ select: () => ({ _id: 'dev4', status: 'online', save }) });
    const recovered = await processDeviceRecoveries(Date.now());
    expect(recovered).toContain('dev4'); // still reported as processed
    expect(save).not.toHaveBeenCalled(); // not saved because status not maintenance
  });
});
