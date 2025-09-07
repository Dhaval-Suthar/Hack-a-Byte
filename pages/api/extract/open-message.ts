import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import EmailModel from '@/models/Email';
import SMSModel from '@/models/SMS';
import { badRequest, notFound, methodNotAllowed, internalError } from '@/lib/api-errors';
import type { NextApiResponseServerIo } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  
  try {
    const { teamId, messageId, messageType } = req.body || {};
    
    if (!teamId || !messageId || !messageType) {
      return badRequest(res, 'teamId, messageId, and messageType are required');
    }
    
    if (!['email', 'sms'].includes(messageType)) {
      return badRequest(res, 'messageType must be email or sms');
    }
    
    await connectDb();
    
    // Find the message
    let message: { 
      recipient: { toString: () => string }; 
      processed: boolean; 
      isScam?: boolean; 
      lossAmount?: number; 
      rewardAmount?: number; 
      save: () => Promise<unknown>;
      [key: string]: unknown;
    } | null = null;
    if (messageType === 'email') {
      message = await EmailModel.findById(messageId);
    } else {
      message = await SMSModel.findById(messageId);
    }
    
    if (!message || message.recipient.toString() !== teamId) {
      return notFound(res, 'Message not found');
    }
    
    // Check if already processed
    if (message.processed) {
      return res.status(200).json({ 
        success: true, 
        alreadyProcessed: true,
        message: 'This message was already opened'
      });
    }
    
    // Find the team
    const team = await Team.findById(teamId).select('wallet.bitcoinBalance');
    if (!team) {
      return notFound(res, 'Team not found');
    }
    
  const balanceChange = 0;
  const outcome: 'gain' | 'loss' | 'neutral' = 'neutral';
  const responseMessage = 'Message opened successfully';
    
  // Do not apply any gain/loss on open. Effects are applied on reply.
  // Keep the message simple/neutral
  await team.save();
    
    // Mark message as processed and read
  // Keep processed=false; only mark read on open
    message.isRead = true;
    await message.save();
    
    // Emit socket event for real-time updates
    try {
      const io = (res as unknown as NextApiResponseServerIo).socket?.server?.io;
      if (io) {
  io.emit('extractor-email-sms', { teamId, outcome, amount: 0, balance: team.wallet.bitcoinBalance, detail: responseMessage, ts: Date.now() });
        
        io.emit('extractor-event', { 
          teamId, 
          event: {
            id: Math.random().toString(36).slice(2),
            type: messageType,
            outcome,
            amount: balanceChange,
            ts: Date.now(),
            detail: responseMessage
          }
        });
      }
    } catch (socketError) {
      console.warn('Socket emit failed:', socketError);
    }
    
    return res.status(200).json({ 
      success: true, 
      outcome,
      balanceChange,
      newBalance: team.wallet.bitcoinBalance,
      message: responseMessage,
      isScam: message.isScam || false
    });
    
  } catch (error) {
    console.error('Error processing message open:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}
