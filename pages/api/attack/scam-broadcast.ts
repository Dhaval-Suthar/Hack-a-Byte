import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import mongoose from 'mongoose';
import { badRequest, internalError, methodNotAllowed } from '@/lib/api-errors';
import { getOnlineHackphoneDevices } from '@/lib/randomMessageGenerator';
import EmailModel, { type EmailModel as EmailModelType } from '@/models/Email';
import SMSModel, { type SMSModel as SMSModelType } from '@/models/SMS';
import { getServerIo } from '@/lib/socket';

/*
  Broadcast scam messages to all online hackphone devices.
  POST body: {
    attackerTeamId: string,
    wormId: 'worm-001' | 'worm-002' | 'worm-003',
    emailSubject?: string,
    emailContent?: string,
    smsContent?: string,
    lossAmount?: number
  }
  Behavior by wormId:
    - worm-001 (EmailSpread Pro): email only
    - worm-003 (SocialHook): sms only
    - worm-002 (NetCrawler): both email and sms
*/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const {
      attackerTeamId,
      wormId,
      emailSubject,
      emailContent,
      smsContent,
      lossAmount,
    } = req.body as {
      attackerTeamId?: string;
      wormId?: 'worm-001' | 'worm-002' | 'worm-003';
      emailSubject?: string;
      emailContent?: string;
      smsContent?: string;
      lossAmount?: number;
    };

    if (!attackerTeamId) return badRequest(res, 'attackerTeamId is required');
    if (!wormId || !['worm-001','worm-002','worm-003'].includes(wormId)) {
      return badRequest(res, 'Valid wormId is required');
    }

    await connectDb();

    const devices = await getOnlineHackphoneDevices();
    if (!devices.length) {
      return res.status(200).json({ success: true, recipients: 0, emails: 0, sms: 0 });
    }

  const io = getServerIo();
  console.log('scam-broadcast: attackerTeamId resolved to', attackerTeamId);

    // Defaults if content not provided
    const defaultEmailSubject = emailSubject || 'Security Notice: Action Required';
    const defaultEmailContent = (emailContent && String(emailContent).trim()) ||
      'We detected unusual activity on your account. For your security, please verify your details immediately.';
    const defaultSmsContent = (smsContent && String(smsContent).trim()) ||
      'Security alert: Suspicious activity detected. Verify your account now to prevent restrictions.';
    const scamLoss = typeof lossAmount === 'number' && lossAmount >= 0 ? lossAmount : 10;

    let emailCount = 0;
    let smsCount = 0;
    const attackerId = String(attackerTeamId);

  for (const d of devices) {
      const teamIdStr = String(d.teamId);
  if (teamIdStr === attackerId) continue; // skip own team

      const teamId = new mongoose.Types.ObjectId(teamIdStr);
      const deviceId = new mongoose.Types.ObjectId(d.deviceId);

      const doEmail = wormId === 'worm-001' || wormId === 'worm-002';
      const doSms = wormId === 'worm-003' || wormId === 'worm-002';

    if (doEmail) {
        const email = await (EmailModel as EmailModelType).createSystemEmail({
          recipient: teamId,
          deviceId,
      attackerTeamId: new mongoose.Types.ObjectId(attackerId),
          sender: 'Security Alert',
          senderEmail: 'security@notice-center.net',
          subject: defaultEmailSubject,
          content: defaultEmailContent,
          isScam: true,
          lossAmount: scamLoss,
          templateId: wormId,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        });
        emailCount++;
        try {
          io?.to(`team-${teamIdStr}`).emit('message-created', {
            teamId: teamIdStr,
            type: 'email',
            id: (email._id as mongoose.Types.ObjectId).toString(),
            subject: email.subject,
            content: email.content,
            sender: email.sender,
            timestamp: Date.now(),
          });
          console.log('scam-broadcast: emitted email message-created to', `team-${teamIdStr}`);
        } catch {}
      }

    if (doSms) {
        const sms = await (SMSModel as SMSModelType).createSystemSMS({
          recipient: teamId,
          deviceId,
      attackerTeamId: new mongoose.Types.ObjectId(attackerId),
          sender: 'Security',
          senderPhone: '+1-555-ALERT',
          content: defaultSmsContent,
          isScam: true,
          lossAmount: scamLoss,
          templateId: wormId,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        });
        smsCount++;
        try {
          io?.to(`team-${teamIdStr}`).emit('message-created', {
            teamId: teamIdStr,
            type: 'sms',
            id: (sms._id as mongoose.Types.ObjectId).toString(),
            content: sms.content,
            sender: sms.sender,
            timestamp: Date.now(),
          });
          console.log('scam-broadcast: emitted sms message-created to', `team-${teamIdStr}`);
        } catch {}
      }
    }

    return res.status(200).json({ success: true, recipients: devices.length, emails: emailCount, sms: smsCount });
  } catch (error) {
    console.error('scam-broadcast error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return internalError(res, msg);
  }
}
