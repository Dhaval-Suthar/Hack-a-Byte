import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { methodNotAllowed } from '@/lib/api-errors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);
  const limitRaw = req.query.limit as string | undefined;
  const limit = limitRaw ? Math.min(100, Math.max(1, parseInt(limitRaw,10) || 10)) : 10;
  try {
    await connectDb();
    const teams = await Team.find({}).select('name wallet.walletAddress wallet.bitcoinBalance').sort({ 'wallet.bitcoinBalance': -1 }).limit(limit).lean();
    return res.status(200).json({ success: true, teams });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Internal error' });
  }
}
