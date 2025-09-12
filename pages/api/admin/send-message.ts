import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import EmailModel, { type EmailModel as EmailModelType } from '@/models/Email';
import SMSModel, { type SMSModel as SMSModelType } from '@/models/SMS';
import Device from '@/models/Device';
import Team from '@/models/Team';
import { badRequest, methodNotAllowed, internalError, unauthorized } from '@/lib/api-errors';
import mongoose from 'mongoose';
import { getServerIo } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Missing or invalid authorization header');
    }

    const adminKey = authHeader.substring(7);
    // TODO: Validate admin key against database or environment variable
    if (!adminKey) {
      return unauthorized(res, 'Invalid admin key');
    }

    const {
      type,
      subject,
      content,
      isScam,
      rewardAmount,
      lossAmount,
      targetDevices,
      targetTeams
    } = req.body || {};

    if (!type || !content) {
      return badRequest(res, 'Message type and content are required');
    }

    if (!['email', 'sms'].includes(type)) {
      return badRequest(res, 'Type must be email or sms');
    }

    if (type === 'email' && !subject) {
      return badRequest(res, 'Subject is required for email messages');
    }

    if ((!targetDevices || targetDevices.length === 0) && (!targetTeams || targetTeams.length === 0)) {
      return badRequest(res, 'At least one target device or team must be specified');
    }

    await connectDb();

    // Collect all target team IDs
    const targetTeamIds: string[] = [];

    // Add teams directly specified
    if (targetTeams && targetTeams.length > 0) {
      targetTeamIds.push(...targetTeams);
    }

    // Add teams that own the specified devices
    if (targetDevices && targetDevices.length > 0) {
      const devices = await Device.find({ _id: { $in: targetDevices } }).select('_id').lean();
      const deviceIds = devices.map(d => (d._id as mongoose.Types.ObjectId).toString());

      // Find teams that own these devices
      const teams = await Team.find({ deviceId: { $in: deviceIds } }).select('_id').lean();
      const teamIds = teams.map(t => (t._id as mongoose.Types.ObjectId).toString());

      targetTeamIds.push(...teamIds);
    }

    // Remove duplicates
    const uniqueTeamIds = [...new Set(targetTeamIds)];

    if (uniqueTeamIds.length === 0) {
      return badRequest(res, 'No valid teams found for the specified targets');
    }

    // Create messages for each team
    const messages = [];
    const teamObjectIds = uniqueTeamIds.map(id => new mongoose.Types.ObjectId(id));

    for (const teamId of teamObjectIds) {
      if (type === 'email') {
        const email = await (EmailModel as EmailModelType).createSystemEmail({
          recipient: teamId,
          sender: 'System Administrator',
          senderEmail: 'admin@hackabyte.com',
          subject: subject,
          content: content,
          isScam: isScam || false,
          rewardAmount: rewardAmount || 0,
          lossAmount: lossAmount || 0,
          templateId: 'admin-custom',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        messages.push(email);

        // Emit socket event for real-time notification
        try {
          const io = getServerIo();
          const teamIdStr = teamId.toString();
          io?.to(`team-${teamIdStr}`).emit('message-created', {
            teamId: teamIdStr,
            type: 'email',
            id: (email._id as mongoose.Types.ObjectId).toString(),
            subject: email.subject,
            content: email.content,
            sender: email.sender,
            timestamp: Date.now(),
          });
        } catch (socketError) {
          console.warn('Failed to emit admin email notification:', socketError);
        }
      } else {
        const sms = await (SMSModel as SMSModelType).createSystemSMS({
          recipient: teamId,
          sender: 'Admin',
          senderPhone: '+1-ADMIN-001',
          content: content,
          isScam: isScam || false,
          rewardAmount: rewardAmount || 0,
          lossAmount: lossAmount || 0,
          templateId: 'admin-custom',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        messages.push(sms);

        // Emit socket event for real-time notification
        try {
          const io = getServerIo();
          const teamIdStr = teamId.toString();
          io?.to(`team-${teamIdStr}`).emit('message-created', {
            teamId: teamIdStr,
            type: 'sms',
            id: (sms._id as mongoose.Types.ObjectId).toString(),
            content: sms.content,
            sender: sms.sender,
            timestamp: Date.now(),
          });
        } catch (socketError) {
          console.warn('Failed to emit admin SMS notification:', socketError);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully sent ${type.toUpperCase()} to ${uniqueTeamIds.length} team(s)`,
      recipientCount: uniqueTeamIds.length,
      messageCount: messages.length
    });

  } catch (error) {
    console.error('Error sending admin message:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return internalError(res, msg);
  }
}
