import type { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team, { StockPortfolio } from '@/models/Team';
import { assertRoleAccess } from '@/lib/role-access';
import { badRequest, methodNotAllowed, notFound, roleForbidden } from '@/lib/api-errors';
import pricesHandler from '@/pages/api/stocks/prices';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { teamId, symbol, action, shares } = req.body as { teamId?: string; symbol?: string; action?: 'buy'|'sell'; shares?: number };
  if (!teamId || !symbol || !action || !shares || shares <= 0) return badRequest(res, 'Invalid fields');
  try { await assertRoleAccess(teamId, 'stocks'); } catch (e) { const err = e as { allowed?: string[] }; return roleForbidden(res,{ allowed: err.allowed, appId: 'stocks' }); }
  await connectDb();
  const team = await Team.findById(teamId).select('wallet stockPortfolio');
  if (!team) return notFound(res, 'Team not found');
  // Get latest price via internal call
  // Minimal internal capture with typed structure
  interface PriceEntry { symbol: string; price: number; updated: number }
  let priceData: { prices: PriceEntry[] } = { prices: [] };
  const mockRes: Partial<NextApiResponse> = {
    status: () => ({
      json: (d: { prices: PriceEntry[] }) => { priceData = d; }
    }) as unknown as NextApiResponse,
  };
  pricesHandler({} as NextApiRequest, mockRes as NextApiResponse);
  const entry = priceData.prices.find((p: PriceEntry) => p.symbol === symbol.toUpperCase());
  if (!entry) return badRequest(res, 'Unknown symbol');
  const price = entry.price;
  if (action === 'buy') {
    const cost = price * shares;
    if (team.wallet.bitcoinBalance < cost) return res.status(400).json({ success: false, error: 'Insufficient funds' });
    team.wallet.bitcoinBalance -= cost;
    // addStock method expects symbol in any case
    // simple manual implementation to avoid loading methods if not compiled
  const existing = (team.stockPortfolio as StockPortfolio[]).find((s: StockPortfolio) => s.symbol === symbol.toUpperCase());
    if (existing) {
      const totalShares = existing.shares + shares;
      const totalCost = (existing.shares * existing.avgPrice) + (shares * price);
      existing.avgPrice = totalCost / totalShares;
      existing.shares = totalShares;
    } else {
      team.stockPortfolio.push({ symbol: symbol.toUpperCase(), shares, avgPrice: price });
    }
  } else { // sell
  const existing = (team.stockPortfolio as StockPortfolio[]).find((s: StockPortfolio) => s.symbol === symbol.toUpperCase());
    if (!existing || existing.shares < shares) return res.status(400).json({ success: false, error: 'Not enough shares' });
    existing.shares -= shares;
    team.wallet.bitcoinBalance += price * shares;
    if (existing.shares === 0) {
      team.stockPortfolio = (team.stockPortfolio as StockPortfolio[]).filter((s: StockPortfolio) => s !== existing);
    }
  }
  await team.save();
  return res.status(200).json({ success: true, action, symbol: symbol.toUpperCase(), shares, price, balance: team.wallet.bitcoinBalance, portfolio: team.stockPortfolio });
}
