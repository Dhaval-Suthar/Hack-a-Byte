import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { badRequest, notFound, methodNotAllowed } from '@/lib/api-errors';
import { getServerIo } from '@/lib/socket';

function emit(_res: NextApiResponse, event: string, payload: Record<string, unknown>) {
  try { getServerIo()?.emit(event, { ...payload, ts: Date.now() }); } catch {}
}

/* Wallet transfer endpoint
   POST body: { fromAddress, toAddress, amount, privateKey }
   Validates sender private key. Adjusts balances. Emits wallet-transfer event.
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { fromAddress, toAddress, amount, privateKey } = req.body as { fromAddress?: string; toAddress?: string; amount?: number; privateKey?: string };
  if (!fromAddress || !toAddress || !amount || amount <= 0 || !privateKey) return badRequest(res, 'Invalid fields');
  try {
    await connectDb();
    // Step 1: Load sender doc
    const senderPre = await Team.findOne({ 'wallet.walletAddress': fromAddress }).select('wallet');
    if (!senderPre) return notFound(res, 'Sender not found');
    if (senderPre.wallet.privateKey !== privateKey) return res.status(403).json({ success: false, error: 'Invalid key' });
    // Quick insufficient check to fast-fail (non-atomic)
    if (senderPre.wallet.bitcoinBalance < amount) return res.status(400).json({ success: false, error: 'Insufficient balance' });
    // Step 2: Atomic decrement ensuring balance still sufficient
    const sender = await Team.findOneAndUpdate(
      { 'wallet.walletAddress': fromAddress, 'wallet.bitcoinBalance': { $gte: amount } },
      { $inc: { 'wallet.bitcoinBalance': -amount } },
      { new: true }
    ).select('wallet');
    if (!sender) {
      // Lost race due to concurrent spend
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }
    // Step 3: Increment receiver balance
    const receiver = await Team.findOneAndUpdate(
      { 'wallet.walletAddress': toAddress },
      { $inc: { 'wallet.bitcoinBalance': amount } },
      { new: true }
    ).select('wallet');
    if (!receiver) return notFound(res, 'Receiver not found');
    emit(res, 'wallet-transfer', { fromAddress, toAddress, amount, senderBalance: sender.wallet.bitcoinBalance, receiverBalance: receiver.wallet.bitcoinBalance });
    return res.status(200).json({ success: true, amount, senderBalance: sender.wallet.bitcoinBalance, receiverBalance: receiver.wallet.bitcoinBalance });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Internal error' });
  }
}
