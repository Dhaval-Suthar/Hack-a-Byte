import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { activeRansomDemands } from '../ransomware';
import { withRedis } from '@/lib/redis';
import { emitScoped } from '@/lib/emitter';

async function getDemand(key: string) {
  const redisRec = await withRedis(async r => {
    const raw = await r.get(`ransomdemand:${key}`);
    return raw ? JSON.parse(raw) as typeof activeRansomDemands[string] : null;
  });
  return redisRec || activeRansomDemands[key] || null;
}

async function clearDemand(key: string) {
  const ok = await withRedis(async r => { await r.del(`ransomdemand:${key}`); return true; });
  if (!ok) delete activeRansomDemands[key];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const { targetKey, payerTeamId } = req.body as { targetKey?: string; payerTeamId?: string };
  if (!targetKey || !payerTeamId) return res.status(400).json({ success: false, error: 'Missing fields' });
  const demandRec = await getDemand(targetKey);
  if (!demandRec) return res.status(404).json({ success: false, error: 'No active demand' });
  if (Date.now() > demandRec.expires) {
  await clearDemand(targetKey);
  emitScoped(res, { event: 'ransomware-unpaid', payload: { targetKey, demand: demandRec.demand } });
    return res.status(410).json({ success: false, error: 'Payment window expired' });
  }
  try {
    await connectDb();
    const payer = await Team.findById(payerTeamId);
    if (!payer) return res.status(404).json({ success: false, error: 'Payer team not found' });
    if (payer.wallet.bitcoinBalance < demandRec.demand) return res.status(400).json({ success: false, error: 'Insufficient balance' });
    payer.wallet.bitcoinBalance -= demandRec.demand;
    await payer.save();
    if (demandRec.attackerTeamId) {
      const attacker = await Team.findById(demandRec.attackerTeamId);
      if (attacker) {
        attacker.wallet.bitcoinBalance += demandRec.demand;
        await attacker.save();
      }
    }
  demandRec.paid = true;
  await clearDemand(targetKey);
  emitScoped(res, { event: 'ransomware-paid', payload: { targetKey, amount: demandRec.demand, attackerTeamId: demandRec.attackerTeamId } });
    return res.status(200).json({ success: true, amount: demandRec.demand });
  } catch {
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
