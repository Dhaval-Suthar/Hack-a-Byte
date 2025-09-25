// Random Email/SMS Generator for Online Hackphone Devices
// Sends random emails and SMS with potential rewards to extractors

import connectDb from '@/db/connectDb';
import Device from '@/models/Device';
import Team from '@/models/Team';
import EmailModel, { type EmailModel as EmailModelType } from '@/models/Email';
import SMSModel, { type SMSModel as SMSModelType } from '@/models/SMS';
import mongoose from 'mongoose';
import { getServerIo } from '@/lib/socket';
import { logger } from '@/lib/logger';
import { withRedis } from '@/lib/redis';

/**
 * Create sample emails and SMS for a new hackphone device
 * This is called when a new hackphone device is created
 */
export async function createSampleMessagesForDevice(deviceId: string, teamId?: string) {
  try {
    await connectDb();
    
    if (!teamId) {
      // If no team ID provided, find the team that owns this device
      const team = await Team.findOne({ deviceId: deviceId }).select('_id');
      if (!team) {
        return false;
      }
      teamId = team._id.toString();
    }
    
    const teamObjectId = new mongoose.Types.ObjectId(teamId);
    const deviceObjectId = new mongoose.Types.ObjectId(deviceId);
    
    // Create sample emails
    const sampleEmails = [
      {
        sender: "Welcome Team",
        senderEmail: "welcome@hackathon.com",
        subject: "Welcome to the Hackathon!",
        content: "Welcome to the cybersecurity hackathon! Your hackphone is now active and ready to receive important communications. Keep an eye on your inbox for system messages and potential threats. Good luck!",
        isRead: false
      },
      {
        sender: "Security Updates",
        senderEmail: "security@techcorp.com",
        subject: "Monthly Security Newsletter",
        content: "This month's security tips: Always verify sender addresses, be cautious of urgent requests, and never share sensitive information via email. Stay vigilant!",
        isRead: true
      },
      {
        sender: "IT Support",
        senderEmail: "support@company.com",
        subject: "System Maintenance Scheduled",
        content: "Our servers will undergo routine maintenance this weekend. Please save your work and expect brief service interruptions between 2-4 AM.",
        isRead: false
      }
    ];
    
    // Create sample SMS messages
    const sampleSMSMessages = [
      {
        sender: "System",
        senderPhone: "+1234567890",
        content: "Your hackphone device is now online and monitoring for security events.",
        isRead: false
      },
      {
        sender: "Bank Alert",
        senderPhone: "+1555123456",
        content: "Security notice: Your account was accessed from a new device. If this wasn't you, please contact us immediately.",
        isRead: true
      },
      {
        sender: "Delivery Service",
        senderPhone: "+1888999000",
        content: "Package delivery attempted. Nobody was home. Reply 'Y' to reschedule or visit our website.",
        isRead: false
      }
    ];
    
    // Create the sample emails
    for (const emailData of sampleEmails) {
      await (EmailModel as EmailModelType).createSampleEmail({
        recipient: teamObjectId,
        deviceId: deviceObjectId,
        ...emailData
      });
    }
    
    // Create the sample SMS messages
    for (const smsData of sampleSMSMessages) {
      await (SMSModel as SMSModelType).createSampleSMS({
        recipient: teamObjectId,
        deviceId: deviceObjectId,
        ...smsData
      });
    }
    
    return true;
  } catch (error) {
    logger.error('Error creating sample messages:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return false;
  }
}

interface MessageTemplate {
  type: 'email' | 'sms';
  subject?: string; // Only for emails
  sender: string;
  senderEmail?: string; // Only for emails
  senderPhone?: string; // Only for SMS
  content: string;
  isScam: boolean;
  rewardAmount?: number; // BTC reward if opened and legitimate
  lossAmount?: number; // BTC loss if opened and scam
  probabilityWeight: number; // Higher number = more likely to appear
}

const EMAIL_TEMPLATES: MessageTemplate[] = [
  // Legitimate reward emails
  {
    type: 'email',
    subject: '🎉 Your Bitcoin Bonus is Ready!',
    sender: 'BitRewards',
    senderEmail: 'rewards@bitbonus.com',
    content: 'Congratulations! You have earned a 50 BTC bonus. To receive it, REPLY to this email with your wallet address and private key. Rewards are processed automatically upon verification.',
    isScam: false,
    rewardAmount: 50,
    probabilityWeight: 15
  },
  {
    type: 'email',
    subject: 'Faucet Refill Complete - Claim Your BTC',
    sender: 'CryptoFaucet',
    senderEmail: 'noreply@cryptofaucet.io',
    content: 'Your daily faucet is ready! To collect up to 75 BTC, REPLY with your wallet address and private key so we can credit your account.',
    isScam: false,
    rewardAmount: 75,
    probabilityWeight: 12
  },
  {
    type: 'email',
    subject: 'Mining Pool Dividend Payment',
    sender: 'MiningCorp',
    senderEmail: 'dividends@miningcorp.net',
    content: 'Your share of this week\'s mining pool is 100 BTC. To receive this payment, REPLY with your wallet address and private key for verification.',
    isScam: false,
    rewardAmount: 100,
    probabilityWeight: 8
  },
  
  // Scam emails (extractors should avoid these)
  {
    type: 'email',
    subject: 'URGENT: Account Security Breach Detected',
    sender: 'Security Alert',
    senderEmail: 'security@fake-bank.com',
    content: 'We detected suspicious activity. Click immediately to secure your account or lose access permanently!',
    isScam: true,
    lossAmount: 80,
    probabilityWeight: 20
  },
  {
    type: 'email',
    subject: 'You\'ve Won 1000 BTC! Claim Now!',
    sender: 'Lottery Winner',
    senderEmail: 'winner@fake-lottery.org',
    content: 'Congratulations! You are our grand prize winner. Send 50 BTC processing fee to claim your 1000 BTC prize.',
    isScam: true,
    lossAmount: 50,
    probabilityWeight: 25
  },
  {
    type: 'email',
    subject: 'IRS Bitcoin Tax Refund',
    sender: 'IRS',
    senderEmail: 'refunds@fake-irs.gov',
    content: 'You are eligible for a 200 BTC tax refund. Click here and provide your wallet private key to process.',
    isScam: true,
    lossAmount: 120,
    probabilityWeight: 18
  },
  
  // Neutral emails (no reward/loss)
  {
    type: 'email',
    subject: 'Newsletter: Weekly Crypto Market Update',
    sender: 'CryptoNews',
    senderEmail: 'news@cryptoweekly.com',
    content: 'This week in crypto: Bitcoin reaches new highs, market analysis, and upcoming events.',
    isScam: false,
    probabilityWeight: 30
  }
];

const SMS_TEMPLATES: MessageTemplate[] = [
  // Legitimate reward SMS
  {
    type: 'sms',
    sender: 'BitAlert',
    senderPhone: '+1-555-CRYPTO',
    content: 'BTC Alert: 25 BTC waiting. REPLY with your wallet address and private key to receive.',
    isScam: false,
    rewardAmount: 25,
    probabilityWeight: 15
  },
  {
    type: 'sms',
    sender: 'CryptoFaucet',
    senderPhone: '+1-888-FAUCET',
    content: 'Your hourly faucet drip is ready: 40 BTC. REPLY with wallet address + private key to claim.',
    isScam: false,
    rewardAmount: 40,
    probabilityWeight: 12
  },
  
  // Scam SMS (extractors should avoid)
  {
    type: 'sms',
    sender: 'Bank Alert',
    senderPhone: '+1-555-SCAM',
    content: 'URGENT: Your account is frozen. Click link and enter private key to unlock: http://fake-bank.scam',
    isScam: true,
    lossAmount: 60,
    probabilityWeight: 22
  },
  {
    type: 'sms',
    sender: 'Crypto Exchange',
    senderPhone: '+1-444-PHISH',
    content: 'Congratulations! 500 BTC bonus ready. Verify account with wallet key: http://fake-exchange.net',
    isScam: true,
    lossAmount: 150,
    probabilityWeight: 20
  },
  
  // Neutral SMS
  {
    type: 'sms',
    sender: 'CryptoNews',
    senderPhone: '+1-777-NEWS',
    content: 'Market Update: BTC +5% today. ETH stable. Major conference next week.',
    isScam: false,
    probabilityWeight: 25
  }
];

interface PendingMessage {
  deviceId: string;
  teamId: string;
  template: MessageTemplate;
  scheduledAt: number;
}

// Redis-based message storage functions with fallback to in-memory
async function getPendingMessages(): Promise<PendingMessage[]> {
  try {
    const messages = await withRedis(async (redis) => {
      const data = await redis.get('pending-messages');
      return data ? JSON.parse(data) : [];
    });
    return messages || g.__pendingMessages || [];
  } catch (error) {
    logger.error('Error getting pending messages from Redis, using in-memory fallback:', { error });
    return g.__pendingMessages || [];
  }
}

async function savePendingMessages(messages: PendingMessage[]): Promise<void> {
  try {
    await withRedis(async (redis) => {
      await redis.setEx('pending-messages', 3600, JSON.stringify(messages)); // 1 hour TTL
    });
  } catch (error) {
    logger.error('Error saving pending messages to Redis, using in-memory fallback:', { error });
    g.__pendingMessages = messages;
  }
}

async function addPendingMessage(message: PendingMessage): Promise<void> {
  const messages = await getPendingMessages();
  messages.push(message);
  await savePendingMessages(messages);
}

async function removePendingMessage(index: number): Promise<void> {
  const messages = await getPendingMessages();
  messages.splice(index, 1);
  await savePendingMessages(messages);
}

// Global state for in-memory fallback
const g = global as unknown as { __pendingMessages?: PendingMessage[] };
if (!g.__pendingMessages) g.__pendingMessages = [];

export function getRandomTemplate(type?: 'email' | 'sms'): MessageTemplate {
  const templates = type === 'email' ? EMAIL_TEMPLATES : 
                   type === 'sms' ? SMS_TEMPLATES : 
                   [...EMAIL_TEMPLATES, ...SMS_TEMPLATES];
  
  // Weighted random selection
  const totalWeight = templates.reduce((sum, t) => sum + t.probabilityWeight, 0);
  let random = Math.random() * totalWeight;
  
  for (const template of templates) {
    random -= template.probabilityWeight;
    if (random <= 0) {
      return template;
    }
  }
  
  return templates[0]; // Fallback
}

export async function getOnlineHackphoneDevices(): Promise<Array<{deviceId: string, teamId: string}>> {
  try {
    await connectDb();
    
    // Find all online hackphone devices directly
    const devices = await Device.find({ 
      deviceType: 'hackphone', 
      status: 'online' 
    }).select('_id teamId');
    
    logger.info(`Found ${devices.length} online hackphone devices`);
    
    const onlineHackphones: Array<{deviceId: string, teamId: string}> = [];
    
    for (const device of devices) {
      logger.info(`Device ${device._id}: teamId = ${device.teamId}, type = ${typeof device.teamId}, exists = ${!!device.teamId}`);
      // Use the teamId directly from the device
      if (device.teamId != null && device.teamId !== undefined) {
        onlineHackphones.push({
          deviceId: device._id.toString(),
          teamId: device.teamId.toString()
        });
      } else {
        logger.info(`Device ${device._id} has no teamId, skipping`);
      }
    }
    
    logger.info(`Returning ${onlineHackphones.length} online hackphone devices with teams`);
    return onlineHackphones;
  } catch (error) {
    logger.error('Error getting online hackphone devices:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return [];
  }
}

export async function scheduleRandomMessage(deviceId: string, teamId: string) {
  const template = getRandomTemplate();
  // Deliver in ~2-5 minutes
  const delay = 2 * 60_000 + Math.random() * 3 * 60_000;
  const scheduledAt = Date.now() + delay;
  
  const message: PendingMessage = {
    deviceId,
    teamId,
    template,
    scheduledAt
  };
  
  logger.info(`Scheduling message for device ${deviceId}, team ${teamId}, type ${template.type}, scheduled at ${new Date(scheduledAt).toISOString()}`);
  await addPendingMessage(message);
}

export async function sendScheduledMessage(message: PendingMessage) {
  try {
    await connectDb();
    
    // Verify device is still online
    const device = await Device.findById(message.deviceId).select('status');
    if (!device || device.status !== 'online') {
      logger.info(`Device ${message.deviceId} is not online (status: ${device?.status}), skipping message`);
      return false; // Skip if device is no longer online
    }
    
    logger.info(`Sending ${message.template.type} message to device ${message.deviceId}, team ${message.teamId}`);
    
    const teamId = new mongoose.Types.ObjectId(message.teamId);
    const deviceId = new mongoose.Types.ObjectId(message.deviceId);
    
  if (message.template.type === 'email') {
      // Create email using EmailModel
  const created = await (EmailModel as EmailModelType).createSystemEmail({
        recipient: teamId,
        deviceId: deviceId,
    // attackerTeamId intentionally omitted for random system messages
        sender: message.template.sender,
        senderEmail: message.template.senderEmail!,
        subject: message.template.subject!,
        content: message.template.content,
        isScam: message.template.isScam,
        rewardAmount: message.template.rewardAmount,
        lossAmount: message.template.lossAmount,
        templateId: `template-${Date.now()}`,
        probabilityWeight: message.template.probabilityWeight
      });
      // Emit socket event for real-time delivery
      try {
        const io = getServerIo();
        const id = (created._id as unknown as mongoose.Types.ObjectId).toString();
        io?.to(`team-${message.teamId}`).emit('message-created', {
          teamId: message.teamId,
          type: 'email',
          id,
          subject: created.subject,
          content: created.content,
          sender: created.sender,
          timestamp: Date.now(),
        });
      } catch {}
  } else {
      // Create SMS using SMSModel
  const created = await (SMSModel as SMSModelType).createSystemSMS({
        recipient: teamId,
        deviceId: deviceId,
    // attackerTeamId intentionally omitted for random system messages
        sender: message.template.sender,
        senderPhone: message.template.senderPhone!,
        content: message.template.content,
        isScam: message.template.isScam,
        rewardAmount: message.template.rewardAmount,
        lossAmount: message.template.lossAmount,
        templateId: `template-${Date.now()}`,
        probabilityWeight: message.template.probabilityWeight
      });
      // Emit socket event for real-time delivery
      try {
        const io = getServerIo();
        const id = (created._id as unknown as mongoose.Types.ObjectId).toString();
        io?.to(`team-${message.teamId}`).emit('message-created', {
          teamId: message.teamId,
          type: 'sms',
          id,
          content: created.content,
          sender: created.sender,
          timestamp: Date.now(),
        });
      } catch {}
    }
    
    return true;
  } catch (error) {
    logger.error('Error sending scheduled message:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return false;
  }
}

export async function processScheduledMessages(now = Date.now()) {
  const pendingMessages = await getPendingMessages();
  const readyMessages = pendingMessages.filter((msg: PendingMessage) => now >= msg.scheduledAt);
  
  logger.info(`Processing scheduled messages: ${pendingMessages.length} pending, ${readyMessages.length} ready`);
  
  if (readyMessages.length === 0) return;
  
  // Send ready messages
  for (const message of readyMessages) {
    logger.info(`Sending message to device ${message.deviceId}, team ${message.teamId}`);
    await sendScheduledMessage(message);
    
    // Remove from pending
    const index = pendingMessages.indexOf(message);
    if (index > -1) {
      await removePendingMessage(index);
    }
  }
}

// Schedule messages for all online hackphone devices
export async function scheduleMessagesForOnlineDevices() {
  const onlineDevices = await getOnlineHackphoneDevices();
  const pendingMessages = await getPendingMessages();
  
  logger.info(`Scheduling messages for ${onlineDevices.length} online devices`);
  
  for (const device of onlineDevices) {
    // Ensure at most one pending message per device to avoid flooding
    const hasPendingForDevice = pendingMessages.some((p: PendingMessage) => p.deviceId === device.deviceId);
    if (hasPendingForDevice) {
      logger.info(`Device ${device.deviceId} already has pending message, skipping`);
      continue;
    }
    
    // Always schedule a message (no probability - 100% delivery)
    logger.info(`Scheduling message for device ${device.deviceId}, team ${device.teamId}`);
    await scheduleRandomMessage(device.deviceId, device.teamId);
  }
}

// Main function to be called periodically
export async function runRandomMessageSystem() {
  const now = Date.now();
  
  // Process any scheduled messages that are ready
  await processScheduledMessages(now);
  
  // Schedule new messages for online devices
  await scheduleMessagesForOnlineDevices();
}
