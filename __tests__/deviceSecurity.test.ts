import handler from '@/pages/api/device/security';
import { createMocks } from 'node-mocks-http';

jest.mock('@/db/connectDb', () => jest.fn().mockResolvedValue(undefined));
interface MockDevice { configuration: { securitySettings: Record<string, unknown> }; save: () => Promise<unknown>; }
let mockDevice: MockDevice | null = null;
jest.mock('@/models/Device', () => ({
  __esModule: true,
  default: { findOne: jest.fn().mockImplementation(() => ({ select: jest.fn().mockReturnValue(mockDevice) })) }
}));

describe('device security toggle API', () => {
  it('updates toggles', async () => {
  mockDevice = { configuration: { securitySettings: { firewall: true, antiVirus: true, vpn: false, enc: false, ids: false, vulnerabilities: [] } }, save: jest.fn().mockResolvedValue(true) };
  const { req, res } = createMocks({ method:'PATCH', body: { deviceId: 'd1', toggles: { vpn: true, enc: true } } });
  await handler(req as unknown as import('next').NextApiRequest, res as unknown as import('next').NextApiResponse);
  const data = res._getJSONData();
  if (!data.success) throw new Error('Unexpected failure: '+ JSON.stringify(data));
    expect(data.securitySettings.vpn).toBe(true);
    expect(data.securitySettings.enc).toBe(true);
  });
});
