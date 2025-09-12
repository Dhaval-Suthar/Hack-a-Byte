import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { z } from 'zod';
import { emitScoped } from '@/lib/emitter';

// CryptoLocker payment processing
// POST body: { attackerTeamId, targetTeamId, amount }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔒 CryptoLocker payment request received:', {
    method: req.method,
    body: req.body,
    contentType: req.headers['content-type'],
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : 'no body'
  });
  
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  
  const schema = z.object({ 
    attackerTeamId: z.string().min(1),
    targetTeamId: z.string().min(1),
    amount: z.number().min(1)
  });
  
  const parsed = schema.safeParse(req.body);
  console.log('🔒 Schema validation result:', {
    success: parsed.success,
    errors: parsed.error?.issues,
    data: parsed.data,
    bodyString: JSON.stringify(req.body)
  });
  
  if (!parsed.success) {
    console.log('🔒 Validation failed with body:', req.body);
    return res.status(400).json({ success: false, error: 'Invalid body' });
  }
  
  const { attackerTeamId, targetTeamId, amount } = parsed.data;

  try {
    await connectDb();
    
    const targetTeam = await Team.findById(targetTeamId).select('wallet.bitcoinBalance');
    const attackerTeam = await Team.findById(attackerTeamId).select('wallet.bitcoinBalance');
    
    if (!targetTeam || !attackerTeam) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Check if target has enough funds
    if (targetTeam.wallet.bitcoinBalance < amount) {
      // Not enough funds - trigger game over
      emitScoped(res, { 
        scope: 'team', 
        id: targetTeamId, 
        event: 'cryptolocker-game-over', 
        payload: { 
          reason: 'Insufficient funds to pay ransom',
          demanded: amount,
          available: targetTeam.wallet.bitcoinBalance,
          message: 'GAME OVER: Unable to pay ransom. All data lost.',
          ts: Date.now()
        } 
      });

      return res.status(200).json({ 
        success: false, 
        outcome: 'game_over',
        reason: 'insufficient_funds'
      });
    }

    // Process payment
    targetTeam.wallet.bitcoinBalance -= amount;
    attackerTeam.wallet.bitcoinBalance += amount;
    
    await targetTeam.save();
    await attackerTeam.save();

    // Notify teams of successful payment
    emitScoped(res, { 
      scope: 'team', 
      id: targetTeamId, 
      event: 'cryptolocker-payment-sent', 
      payload: { 
        amount,
        newBalance: targetTeam.wallet.bitcoinBalance,
        message: 'Payment sent. Files are being decrypted...',
        ts: Date.now()
      } 
    });

    emitScoped(res, { 
      scope: 'team', 
      id: attackerTeamId, 
      event: 'cryptolocker-payment-received', 
      payload: { 
        amount,
        newBalance: attackerTeam.wallet.bitcoinBalance,
        targetTeamId,
        message: `Received ${amount} BTC ransom payment`,
        ts: Date.now()
      } 
    });

    return res.status(200).json({ 
      success: true, 
      outcome: 'payment_successful',
      amount,
      newBalance: targetTeam.wallet.bitcoinBalance
    });
  } catch (error) {
    console.error('CryptoLocker payment error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
