import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import EmailModel from '@/models/Email';
import SMSModel from '@/models/SMS';
import { badRequest, methodNotAllowed, internalError } from '@/lib/api-errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  
  try {
    const { teamId, type } = req.query;
    
    if (!teamId) {
      return badRequest(res, 'teamId is required');
    }
    
    if (type && !['email', 'sms'].includes(type as string)) {
      return badRequest(res, 'type must be email or sms');
    }
    
    await connectDb();
    
    let messages: unknown[] = [];
    
    if (!type || type === 'email') {
      // Get emails
      const emails = await EmailModel.find({ recipient: teamId })
        .sort({ timestamp: -1 })
        .limit(25)
        .lean();
      
      const emailMessages = emails.map(email => ({
        id: (email._id as { toString: () => string }).toString(),
        type: 'email',
        sender: email.sender,
        senderEmail: email.senderEmail,
        subject: email.subject,
        content: email.content,
        timestamp: email.timestamp,
        isRead: email.isRead,
        isStarred: email.isStarred || false,
        isScam: email.isScam || false,
        rewardAmount: email.rewardAmount || 0,
        lossAmount: email.lossAmount || 0,
        processed: email.processed || false,
        outcome: email.outcome || null,
        messageType: email.type // 'system', 'user', or 'sample'
      }));
      
      messages.push(...emailMessages);
    }
    
    if (!type || type === 'sms') {
      // Get SMS messages
      const smsMessages = await SMSModel.find({ recipient: teamId })
        .sort({ timestamp: -1 })
        .limit(25)
        .lean();
      
      const formattedSMS = smsMessages.map(sms => ({
        id: (sms._id as { toString: () => string }).toString(),
        type: 'sms',
        sender: sms.sender,
        senderPhone: sms.senderPhone,
        content: sms.content,
        timestamp: sms.timestamp,
        isRead: sms.isRead,
        isScam: sms.isScam || false,
        rewardAmount: sms.rewardAmount || 0,
        lossAmount: sms.lossAmount || 0,
        processed: sms.processed || false,
        outcome: sms.outcome || null,
        messageType: sms.type // 'system', 'user', or 'sample'
      }));
      
      messages.push(...formattedSMS);
    }
    
    // Sort all messages by timestamp (newest first)
    (messages as Array<{ timestamp: Date }>).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Limit to 50 total messages
    messages = messages.slice(0, 50);
    
    return res.status(200).json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}
