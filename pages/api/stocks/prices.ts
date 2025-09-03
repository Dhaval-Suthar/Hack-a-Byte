import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory simple price model with mild random walk
interface StockInfo { symbol: string; price: number; updated: number; }
const g = global as unknown as { __stocks?: Record<string, StockInfo> };
if (!g.__stocks) g.__stocks = {
  BTC: { symbol: 'BTC', price: 1000, updated: Date.now() },
  ETH: { symbol: 'ETH', price: 500, updated: Date.now() },
  SOL: { symbol: 'SOL', price: 80, updated: Date.now() },
  HAX: { symbol: 'HAX', price: 50, updated: Date.now() },
};

function tickAll() {
  Object.values(g.__stocks!).forEach(s => {
    if (Date.now() - s.updated > 5000) { // update every 5s on demand
      const drift = 1 + (Math.random()-0.5)*0.04; // +/-2%
      s.price = Math.max(1, Math.round(s.price * drift));
      s.updated = Date.now();
    }
  });
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  tickAll();
  return res.status(200).json({ success: true, prices: Object.values(g.__stocks!) });
}
