import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import EmailModel from '@/models/Email';
import SMSModel from '@/models/SMS';
import { badRequest, methodNotAllowed, internalError } from '@/lib/api-errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const { teamId, messageType, messageIds } = req.body || {};
    if (!teamId || !messageType || !Array.isArray(messageIds) || messageIds.length === 0) {
      return badRequest(res, 'teamId, messageType and messageIds[] are required');
    }
    if (!['email', 'sms'].includes(messageType)) {
      return badRequest(res, 'messageType must be email or sms');
    }

    await connectDb();
    const model = messageType === 'email' ? EmailModel : SMSModel;

    const result = await model.deleteMany({ _id: { $in: messageIds }, recipient: teamId });
    return res.status(200).json({ success: true, deletedCount: result.deletedCount || 0 });
  } catch (error) {
    console.error('Error deleting messages:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}
