import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import EmailModel, { type EmailModel as EmailModelType } from '@/models/Email';
import SMSModel, { type SMSModel as SMSModelType } from '@/models/SMS';
import { badRequest, notFound, methodNotAllowed, internalError } from '@/lib/api-errors';
import { getServerIo } from '@/lib/socket';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

// Deterministic parsing: accept either "<wallet> <privateKey>" or legacy "CLAIM REWARD <wallet> <privateKey>"
// We intentionally avoid regex validation; just ensure tokens exist.
function extractWalletAndKeyFromReply(replyText: string): { wallet?: string; priv?: string } {
  const tokens = String(replyText || '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 4 && tokens[0].toUpperCase() === 'CLAIM' && tokens[1].toUpperCase() === 'REWARD') {
    return { wallet: tokens[2], priv: tokens[3] };
  }
  if (tokens.length >= 2) {
    return { wallet: tokens[0], priv: tokens[1] };
  }
  return { wallet: undefined, priv: undefined };
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
    let branch: 'reward' | 'scam' | 'worm-scam' | null = null;

  // Try reward branch first only if tokens present
    if (hasAddr && hasPriv) {
      updated = await model.findOneAndUpdate(
        { _id: messageId, recipient: teamId, processed: { $ne: true }, isScam: { $ne: true }, rewardAmount: { $gt: 0 } },
        { $set: { processed: true, processedAt: new Date(), outcome: 'gain', isRead: true } },
        { new: true }
      );
      if (updated) {
        branch = 'reward';
      }
    }

  // If not reward, attempt scam branch (allow any non-empty reply)
    if (!updated) {
      const hasSomeText = typeof replyText === 'string' && replyText.trim().length > 0;
      if (!hasSomeText) {
        return badRequest(res, 'Reply text is required');
      }

      // First check if this is a worm-generated scam (SocialHook, NetCrawler, EmailSpread Pro)
      const wormScam = await model.findOne({
        _id: messageId,
        recipient: teamId,
        processed: { $ne: true },
        isScam: true,
        templateId: { $in: ['worm-001', 'worm-002', 'worm-003'] }
      });

      if (wormScam) {
        // Worm-generated scam: no bitcoin deduction, but forward wallet info
        updated = await model.findOneAndUpdate(
          { _id: messageId, recipient: teamId, processed: { $ne: true }, isScam: true, templateId: { $in: ['worm-001', 'worm-002', 'worm-003'] } },
          { $set: { processed: true, processedAt: new Date(), outcome: 'neutral', isRead: true } },
          { new: true }
        );
        if (updated) {
          branch = 'worm-scam';
        }
      } else {
        // Regular scam: deduct bitcoin
        const updatedScam = await model.findOneAndUpdate(
          { _id: messageId, recipient: teamId, processed: { $ne: true }, isScam: true },
          { $set: { processed: true, processedAt: new Date(), outcome: 'loss', isRead: true } },
          { new: true }
        );
        if (updatedScam) {
          updated = updatedScam;
          branch = 'scam';
        }
      }
    }

  if (!updated) {
      // Determine specific reason
      const existing = await model.findOne({ _id: messageId, recipient: teamId }).lean() as unknown as { processed?: boolean } | null;
      if (!existing) {
        logger.warn('reply-message: message not found or recipient mismatch', { messageId, teamId });
        return notFound(res, 'Message not found');
      }
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
      // Forward reply to original sender (if attackerTeamId exists)
      try {
        interface AttackerMeta { attackerTeamId?: string; sender?: string; senderPhone?: string; subject?: string }
        const meta = await model.findById(messageId).select('attackerTeamId sender senderPhone subject').lean() as unknown as AttackerMeta | null;
        if (meta?.attackerTeamId) {
          const baseContent = wallet
            ? `Wallet: ${wallet}\n\nOriginal sender: ${meta.sender || 'Unknown'}`
            : `Reply: ${String(replyText)}\n\nOriginal sender: ${meta.sender || 'Unknown'}`;
          if (messageType === 'sms') {
            const createdForward = await (SMSModel as SMSModelType).createSystemSMS({
              recipient: new mongoose.Types.ObjectId(String(meta.attackerTeamId)),
              sender: 'Reply Relay',
              senderPhone: '+0 (relay)',
              content: baseContent,
            });
            try {
              const io = getServerIo();
              io?.to?.(`team-${String(meta.attackerTeamId)}`)?.emit('message-created', {
                teamId: String(meta.attackerTeamId),
                type: 'sms',
                id: String((createdForward as unknown as { _id: { toString: () => string } })._id.toString()),
                content: (createdForward as unknown as { content: string }).content,
                sender: (createdForward as unknown as { sender: string }).sender,
                timestamp: Date.now(),
              });
            } catch {}
          } else {
            const createdForward = await (EmailModel as EmailModelType).createSystemEmail({
              recipient: new mongoose.Types.ObjectId(String(meta.attackerTeamId)),
              sender: 'Reply Relay',
              senderEmail: 'relay@hackabyte.local',
              subject: `Reply received on your message: ${meta.subject || 'No Subject'}`,
              content: baseContent,
            });
            try {
              const io = getServerIo();
              io?.to?.(`team-${String(meta.attackerTeamId)}`)?.emit('message-created', {
                teamId: String(meta.attackerTeamId),
                type: 'email',
                id: String((createdForward as unknown as { _id: { toString: () => string } })._id.toString()),
                subject: (createdForward as unknown as { subject: string }).subject,
                content: (createdForward as unknown as { content: string }).content,
                sender: (createdForward as unknown as { sender: string }).sender,
                timestamp: Date.now(),
              });
            } catch {}
          }
        }
      } catch {}
      // Emit socket event (team scoped)
      try {
  const io = getServerIo();
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
    } else if (branch === 'worm-scam') {
      // Worm-generated scam: no balance change, but forward wallet info to attacker
      await team.save(); // Save team (no balance change)
      // Forward reply to original sender (if attackerTeamId exists)
      try {
        interface AttackerMeta { attackerTeamId?: string; sender?: string; senderPhone?: string; subject?: string }
        const meta = await model.findById(messageId).select('attackerTeamId sender senderPhone subject').lean() as unknown as AttackerMeta | null;
        if (meta?.attackerTeamId) {
          const baseContent = wallet
            ? `Wallet: ${wallet}\n\nOriginal sender: ${meta.sender || 'Unknown'}`
            : `Reply: ${String(replyText)}\n\nOriginal sender: ${meta.sender || 'Unknown'}`;
          if (messageType === 'sms') {
            const createdForward = await (SMSModel as SMSModelType).createSystemSMS({
              recipient: new mongoose.Types.ObjectId(String(meta.attackerTeamId)),
              sender: 'Reply Relay',
              senderPhone: '+0 (relay)',
              content: baseContent,
            });
            try {
              const io = getServerIo();
              io?.to?.(`team-${String(meta.attackerTeamId)}`)?.emit('message-created', {
                teamId: String(meta.attackerTeamId),
                type: 'sms',
                id: String((createdForward as unknown as { _id: { toString: () => string } })._id.toString()),
                content: (createdForward as unknown as { content: string }).content,
                sender: (createdForward as unknown as { sender: string }).sender,
                timestamp: Date.now(),
              });
            } catch {}
          } else {
            const createdForward = await (EmailModel as EmailModelType).createSystemEmail({
              recipient: new mongoose.Types.ObjectId(String(meta.attackerTeamId)),
              sender: 'Reply Relay',
              senderEmail: 'relay@hackabyte.local',
              subject: `Reply received on your message: ${meta.subject || 'No Subject'}`,
              content: baseContent,
            });
            try {
              const io = getServerIo();
              io?.to?.(`team-${String(meta.attackerTeamId)}`)?.emit('message-created', {
                teamId: String(meta.attackerTeamId),
                type: 'email',
                id: String((createdForward as unknown as { _id: { toString: () => string } })._id.toString()),
                subject: (createdForward as unknown as { subject: string }).subject,
                content: (createdForward as unknown as { content: string }).content,
                sender: (createdForward as unknown as { sender: string }).sender,
                timestamp: Date.now(),
              });
            } catch {}
          }
        }
      } catch {}
      try {
        const io = getServerIo();
        io?.to?.(`team-${teamId}`)?.emit('extractor-email-sms', {
          teamId,
          outcome: 'neutral',
          amount: 0,
          balance: team.wallet.bitcoinBalance,
          detail: `Reply processed. Wallet info forwarded to attacker.`,
          ts: Date.now()
        });
        io?.to?.(`team-${teamId}`)?.emit('extractor-event', {
          teamId,
          event: {
            id: Math.random().toString(36).slice(2),
            type: messageType,
            outcome: 'neutral',
            amount: 0,
            ts: Date.now(),
            detail: 'Reply processed (wallet info forwarded)'
          }
        });
      } catch {}
      return res.status(200).json({ success: true, outcome: 'neutral', balanceChange: 0, newBalance: team.wallet.bitcoinBalance });
    } else {
      // Scam branch: deduct loss amount from balance
      const loss = Number((updated as { lossAmount?: number } | null)?.lossAmount || 0);
      team.wallet.bitcoinBalance -= loss;
      await team.save();
      // Forward reply (with wallet address if provided)
      try {
        interface AttackerMeta { attackerTeamId?: string; sender?: string; senderPhone?: string; subject?: string }
        const meta = await model.findById(messageId).select('attackerTeamId sender senderPhone subject').lean() as unknown as AttackerMeta | null;
        if (meta?.attackerTeamId) {
          const baseContent = wallet
            ? `Wallet: ${wallet}\n\nOriginal sender: ${meta.sender || 'Unknown'}`
            : `Reply: ${String(replyText)}\n\nOriginal sender: ${meta.sender || 'Unknown'}`;
          if (messageType === 'sms') {
            const createdForward = await (SMSModel as SMSModelType).createSystemSMS({
              recipient: new mongoose.Types.ObjectId(String(meta.attackerTeamId)),
              sender: 'Reply Relay',
              senderPhone: '+0 (relay)',
              content: baseContent,
            });
            try {
              const io = getServerIo();
              io?.to?.(`team-${String(meta.attackerTeamId)}`)?.emit('message-created', {
                teamId: String(meta.attackerTeamId),
                type: 'sms',
                id: String((createdForward as unknown as { _id: { toString: () => string } })._id.toString()),
                content: (createdForward as unknown as { content: string }).content,
                sender: (createdForward as unknown as { sender: string }).sender,
                timestamp: Date.now(),
              });
            } catch {}
          } else {
            const createdForward = await (EmailModel as EmailModelType).createSystemEmail({
              recipient: new mongoose.Types.ObjectId(String(meta.attackerTeamId)),
              sender: 'Reply Relay',
              senderEmail: 'relay@hackabyte.local',
              subject: `Victim reply received: ${meta.subject || 'No Subject'}`,
              content: baseContent,
            });
            try {
              const io = getServerIo();
              io?.to?.(`team-${String(meta.attackerTeamId)}`)?.emit('message-created', {
                teamId: String(meta.attackerTeamId),
                type: 'email',
                id: String((createdForward as unknown as { _id: { toString: () => string } })._id.toString()),
                subject: (createdForward as unknown as { subject: string }).subject,
                content: (createdForward as unknown as { content: string }).content,
                sender: (createdForward as unknown as { sender: string }).sender,
                timestamp: Date.now(),
              });
            } catch {}
          }
        }
      } catch {}
      try {
        const io = getServerIo();
        io?.to?.(`team-${teamId}`)?.emit('extractor-email-sms', {
          teamId,
          outcome: 'loss',
          amount: loss,
          balance: team.wallet.bitcoinBalance,
          detail: `⚠️ Scam detected! Lost ${loss} BTC`,
          ts: Date.now()
        });
        io?.to?.(`team-${teamId}`)?.emit('extractor-event', {
          teamId,
          event: {
            id: Math.random().toString(36).slice(2),
            type: messageType,
            outcome: 'loss',
            amount: loss,
            ts: Date.now(),
            detail: 'Scam loss via reply'
          }
        });
      } catch {}
      return res.status(200).json({ success: true, outcome: 'loss', balanceChange: -loss, newBalance: team.wallet.bitcoinBalance });
    }
  } catch (error) {
    logger.error('Error processing reply-message:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    const msg = error instanceof Error ? error.message : 'unknown';
    return internalError(res, msg);
  }
}
