import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { wormTokens } from '@/pages/api/attack/worm'; // fallback legacy
import { badRequest, methodNotAllowed, notFound } from '@/lib/api-errors';
import { withRedis } from '@/lib/redis';
import { emitScoped } from '@/lib/emitter';

async function getToken(tokenId: string) {
  const redisTok = await withRedis(async r => {
    const raw = await r.get(`wormtoken:${tokenId}`);
    return raw ? JSON.parse(raw) as typeof wormTokens[string] : null;
  });
  return redisTok || wormTokens[tokenId] || null;
}

type WormTokenType = typeof wormTokens[string];
async function consumeToken(tokenId: string, token: WormTokenType) {
  const ok = await withRedis(async r => { await r.del(`wormtoken:${tokenId}`); return true; });
  if (!ok) token.consumed = true;
}

/* Open a worm payload token
   POST body: { teamId, tokenId }
   Awards reward to attacker if valid and marks consumed.
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { teamId, tokenId } = req.body as { teamId?: string; tokenId?: string };
  if (!teamId || !tokenId) return badRequest(res, 'teamId & tokenId required');
  const token = await getToken(tokenId);
  // prune expired tokens opportunistically
  const nowTs = Date.now();
  // No full sweep when Redis enabled; local fallback prune
  for (const [id,t] of Object.entries(wormTokens)) if (t.expires < nowTs - 10_000) delete wormTokens[id];
  if (!token) return notFound(res, 'Token not found');
  if (token.targetTeamId !== teamId) return res.status(403).json({ success: false, error: 'Not your token' });
  const now = Date.now();
  if (token.expires < now) return res.status(410).json({ success: false, error: 'Expired' });
  if (token.consumed) return res.status(200).json({ success: true, already: true });
  await connectDb();
  const attacker = await Team.findById(token.attackerTeamId).select('wallet.bitcoinBalance');
  if (!attacker) return notFound(res, 'Attacker missing');
  attacker.wallet.bitcoinBalance += token.reward;
  await attacker.save();
  await consumeToken(tokenId, token);
  emitScoped(res, { event: 'worm-opened', payload: { tokenId, wormId: token.wormId, channel: token.channel, reward: token.reward, attackerTeamId: token.attackerTeamId, victimTeamId: teamId } });
  return res.status(200).json({ success: true, reward: token.reward, attackerBalance: attacker.wallet.bitcoinBalance });
}
