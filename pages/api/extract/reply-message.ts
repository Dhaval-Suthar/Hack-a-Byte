import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import EmailModel from '@/models/Email';
import SMSModel from '@/models/SMS';
import { badRequest, notFound, methodNotAllowed, internalError } from '@/lib/api-errors';
import type { NextApiResponseServerIo } from '@/lib/socket';

// Deterministic parsing: expect format "CLAIM REWARD <wallet> <privateKey>"
// We intentionally avoid regex address/key validation per request; just ensure tokens exist.
function extractWalletAndKeyFromReply(replyText: string): { wallet?: string; priv?: string } {
  // Normalize whitespace; split by any whitespace
  const tokens = String(replyText || '').trim().split(/\s+/).filter(Boolean);
  // Expected positions: tokens[0]=CLAIM, tokens[1]=REWARD, tokens[2]=wallet, tokens[3]=privateKey
  const wallet = tokens[2];
  const priv = tokens[3];
  return { wallet, priv };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);

  try {
    const { teamId, messageId, messageType, replyText } = req.body || {};
    if (!teamId || !messageId || !messageType || !replyText) {
      return badRequest(res, 'teamId, messageId, messageType and replyText are required');
    }
    if (!['email', 'sms'].includes(messageType)) {
      return badRequest(res, 'messageType must be email or sms');
    }

  await connectDb();

  // Choose model
  const model = messageType === 'email' ? EmailModel : SMSModel;

    // We'll support two branches:
    // 1) Legit reward branch (requires deterministic tokens)
    // 2) Scam loss branch (any non-empty reply triggers loss)
    const { wallet, priv } = extractWalletAndKeyFromReply(replyText);
    const hasAddr = !!wallet;
    const hasPriv = !!priv;
    let updated: unknown | null = null;
    let branch: 'reward' | 'scam' | null = null;

    // Try reward branch first only if tokens present
    if (hasAddr && hasPriv) {
      updated = await model.findOneAndUpdate(
        { _id: messageId, recipient: teamId, processed: { $ne: true }, isScam: { $ne: true }, rewardAmount: { $gt: 0 } },
        { $set: { processed: true, processedAt: new Date(), outcome: 'gain', isRead: true } },
        { new: true }
      );
      if (updated) branch = 'reward';
    }

    // If not reward, attempt scam branch (allow any non-empty reply)
    if (!updated) {
      const hasSomeText = typeof replyText === 'string' && replyText.trim().length > 0;
      if (!hasSomeText) {
        return badRequest(res, 'Reply text is required');
      }
      const updatedScam = await model.findOneAndUpdate(
        { _id: messageId, recipient: teamId, processed: { $ne: true }, isScam: true, lossAmount: { $gt: 0 } },
        { $set: { processed: true, processedAt: new Date(), outcome: 'loss', isRead: true } },
        { new: true }
      );
      if (updatedScam) {
        updated = updatedScam;
        branch = 'scam';
      }
    }

    if (!updated) {
      // Determine specific reason
      const existing = await model.findOne({ _id: messageId, recipient: teamId }).lean() as unknown as { processed?: boolean } | null;
      if (!existing) return notFound(res, 'Message not found');
      if (existing?.processed) {
        // Provide stable shape with zero change to avoid undefined on client
        const team = await Team.findById(teamId).select('wallet.bitcoinBalance');
        return res.status(200).json({ success: true, alreadyProcessed: true, outcome: 'neutral', balanceChange: 0, newBalance: team?.wallet.bitcoinBalance, message: 'Message already processed' });
      }
      return badRequest(res, 'This message does not accept this kind of reply');
    }

    const team = await Team.findById(teamId).select('wallet.bitcoinBalance');
    if (!team) return notFound(res, 'Team not found');

    // Apply balance change depending on branch
    if (branch === 'reward') {
      const reward = Number((updated as { rewardAmount?: number } | null)?.rewardAmount || 0);
      team.wallet.bitcoinBalance += reward;
      await team.save();
      // Emit socket event (team scoped)
      try {
        const io = (res as unknown as NextApiResponseServerIo).socket?.server?.io;
        io?.to?.(`team-${teamId}`)?.emit('extractor-email-sms', {
          teamId,
          outcome: 'gain',
          amount: reward,
          balance: team.wallet.bitcoinBalance,
          detail: `🎉 Reward claimed via reply! +${reward} BTC`,
          ts: Date.now()
        });
        io?.to?.(`team-${teamId}`)?.emit('extractor-event', {
          teamId,
          event: {
            id: Math.random().toString(36).slice(2),
            type: messageType,
            outcome: 'gain',
            amount: reward,
            ts: Date.now(),
            detail: 'Reward claimed via reply'
          }
        });
      } catch {}
      return res.status(200).json({ success: true, outcome: 'gain', balanceChange: Number((updated as { rewardAmount?: number } | null)?.rewardAmount || 0), newBalance: team.wallet.bitcoinBalance });
    } else {
      // Scam branch: deduct loss on reply
      const loss = Number((updated as { lossAmount?: number } | null)?.lossAmount || 0);
      team.wallet.bitcoinBalance = Math.max(0, team.wallet.bitcoinBalance - loss);
      await team.save();
      try {
        const io = (res as unknown as NextApiResponseServerIo).socket?.server?.io;
        io?.to?.(`team-${teamId}`)?.emit('extractor-email-sms', {
          teamId,
          outcome: 'loss',
          amount: -loss,
          balance: team.wallet.bitcoinBalance,
          detail: `Reply processed. -${loss} BTC`,
          ts: Date.now()
        });
        io?.to?.(`team-${teamId}`)?.emit('extractor-event', {
          teamId,
          event: {
            id: Math.random().toString(36).slice(2),
            type: messageType,
            outcome: 'loss',
            amount: -loss,
            ts: Date.now(),
            detail: 'Loss from replying to message'
          }
        });
      } catch {}
      return res.status(200).json({ success: true, outcome: 'loss', balanceChange: -loss, newBalance: team.wallet.bitcoinBalance });
    }
  } catch (error) {
    console.error('Error processing reply-message:', error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}
