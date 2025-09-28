import { sendAccessCodeEmail } from '../lib/nodemailer';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
  })),
}));

describe('sendAccessCodeEmail', () => {
  const mockSendMail = jest.fn(() => Promise.resolve({ messageId: 'test-message-id' }));
  const mockTransporter = {
    sendMail: mockSendMail,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  it('should include wallet information in email when provided', async () => {
    const params = {
      email: 'test@example.com',
      eventTitle: 'Test Event',
      accessCode: '123456',
      numberOfPlayers: 2,
      playingDevice: 'Smartphone',
      maxUsages: 2,
      playspaceName: 'Test Playspace',
      walletAddress: '0x123456789abcdef',
      privateKey: '0xabcdef123456789',
    };

    const result = await sendAccessCodeEmail(params);

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);

    const mailOptions = mockSendMail.mock.calls[0][0] as any;
    expect(mailOptions.html).toContain('🔐 YOUR WALLET CREDENTIALS');
    expect(mailOptions.html).toContain(params.walletAddress);
    expect(mailOptions.html).toContain(params.privateKey);
  });

  it('should include device information in email when provided', async () => {
    const params = {
      email: 'test@example.com',
      eventTitle: 'Test Event',
      accessCode: '123456',
      numberOfPlayers: 2,
      playingDevice: 'Smartphone',
      maxUsages: 2,
      playspaceName: 'Test Playspace',
      deviceId: '507f1f77bcf86cd799439011',
      deviceMacAddress: 'AA:BB:CC:DD:EE:FF',
    };

    const result = await sendAccessCodeEmail(params);

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);

    const mailOptions = mockSendMail.mock.calls[0][0] as any;
    expect(mailOptions.html).toContain('Device ID:');
    expect(mailOptions.html).toContain(params.deviceId);
    expect(mailOptions.html).toContain('MAC Address:');
    expect(mailOptions.html).toContain(params.deviceMacAddress);
  });
});
