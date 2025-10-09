import { NextApiRequest, NextApiResponse } from 'next';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import Device from '@/models/Device';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// SystemLock Pro Hints - Get hints about the target device's PIN
// POST /api/attack/systemlock-pro-hints
// Body: { attackerTeamId, targetMAC }

interface PinHints {
  highestDigit: number;
  lowestDigit: number;
  repeatedDigits: { digit: number; count: number }[];
  sumOfDigits: number;
  hasConsecutiveDigits: boolean;
  digitPositions: { digit: number; positions: number[] }[];
}

function generatePinHints(pin: string): PinHints {
  const digits = pin.split('').map(Number);
  const digitCounts = new Map<number, number>();
  
  // Count occurrences of each digit
  digits.forEach(digit => {
    digitCounts.set(digit, (digitCounts.get(digit) || 0) + 1);
  });

  // Find repeated digits (appearing 2 or more times)
  const repeatedDigits = Array.from(digitCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([digit, count]) => ({ digit, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  // Find digit positions
  const digitPositions = Array.from(digitCounts.keys()).map(digit => ({
    digit,
    positions: digits.map((d, index) => d === digit ? index + 1 : -1)
      .filter(pos => pos !== -1)
  }));

  // Check for consecutive digits
  let hasConsecutiveDigits = false;
  for (let i = 0; i < digits.length - 1; i++) {
    if (Math.abs(digits[i] - digits[i + 1]) === 1) {
      hasConsecutiveDigits = true;
      break;
    }
  }

  return {
    highestDigit: Math.max(...digits),
    lowestDigit: Math.min(...digits),
    repeatedDigits,
    sumOfDigits: digits.reduce((sum, digit) => sum + digit, 0),
    hasConsecutiveDigits,
    digitPositions
  };
}

function generateHintMessages(hints: PinHints): string[] {
  const messages: string[] = [];

  // Basic range hints
  messages.push(`🔢 Highest digit: ${hints.highestDigit}`);
  messages.push(`🔢 Lowest digit: ${hints.lowestDigit}`);

  // Sum hint
  messages.push(`➕ Sum of all digits: ${hints.sumOfDigits}`);

  // Repeated digits hints
  if (hints.repeatedDigits.length > 0) {
    hints.repeatedDigits.forEach(({ digit, count }) => {
      if (count === 2) {
        messages.push(`🔄 Digit ${digit} appears twice`);
      } else if (count === 3) {
        messages.push(`🔄 Digit ${digit} appears 3 times`);
      } else if (count === 4) {
        messages.push(`🔄 All digits are ${digit}!`);
      }
    });
  } else {
    messages.push(`✨ All digits are unique`);
  }

  // Consecutive digits hint
  if (hints.hasConsecutiveDigits) {
    messages.push(`📈 Contains consecutive digits`);
  } else {
    messages.push(`🔀 No consecutive digits`);
  }

  // Position hints for most frequent digits
  if (hints.repeatedDigits.length > 0) {
    const mostRepeated = hints.repeatedDigits[0];
    const positions = hints.digitPositions.find(dp => dp.digit === mostRepeated.digit)?.positions || [];
    messages.push(`📍 Digit ${mostRepeated.digit} is at position(s): ${positions.join(', ')}`);
  }

  return messages;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    logger.info('SystemLock Pro hints request received', { method: req.method, body: req.body });

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const schema = z.object({
      attackerTeamId: z.string().min(1),
      targetMAC: z.string().min(1)
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Invalid request data', { body: req.body, errors: parsed.error.issues });
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request',
        details: parsed.error.issues 
      });
    }

    const { attackerTeamId, targetMAC } = parsed.data;

    logger.info('Processing SystemLock Pro hints request', { attackerTeamId, targetMAC });

    // Normalize MAC address to standard uppercase colon-separated format
    const normalizedMAC = targetMAC.replace(/-/g, ':').toUpperCase().trim();

    await connectDb();

    // Find target device by MAC address (using same logic as main attack)
    let targetDevice = await Device.findOne({ deviceMacAddress: normalizedMAC });
    if (!targetDevice) {
      const ciRegex = new RegExp(`^${normalizedMAC}$`, 'i');
      targetDevice = await Device.findOne({ deviceMacAddress: { $regex: ciRegex } });
    }
    if (!targetDevice) {
      const hex = normalizedMAC.replace(/[^0-9A-F]/g, '');
      if (hex.length === 12) {
        const parts = hex.match(/.{1,2}/g) || [];
        const flex = `^${parts.join('[:\\-]?')}$`;
        const flexRegex = new RegExp(flex, 'i');
        targetDevice = await Device.findOne({ deviceMacAddress: { $regex: flexRegex } });
      }
    }
    if (!targetDevice) {
      return res.status(404).json({ 
        success: false, 
        error: 'Target device not found'
      });
    }

    // Find attacker team
    const attackerTeam = await Team.findById(attackerTeamId);
    if (!attackerTeam) {
      return res.status(404).json({ 
        success: false, 
        error: 'Attacker team not found' 
      });
    }

    // Check if attacker owns SystemLock Pro
    if (!attackerTeam.purchasedMalware.includes('ransom-003')) {
      return res.status(403).json({ 
        success: false, 
        error: 'SystemLock Pro not purchased' 
      });
    }

    // Check if device has a PIN set
    const hasPin = targetDevice.pin && targetDevice.pin !== null;
    
    if (!hasPin) {
      return res.status(200).json({
        success: true,
        hasPin: false,
        hints: [],
        message: 'Device has no PIN - any 4-digit guess will work!'
      });
    }

    // Generate hints for the PIN
    const hints = generatePinHints(targetDevice.pin);
    const hintMessages = generateHintMessages(hints);

    logger.info('SystemLock Pro hints generated', {
      attackerTeamId,
      targetMAC: normalizedMAC,
      hintsCount: hintMessages.length
    });

    return res.status(200).json({
      success: true,
      hasPin: true,
      hints: hintMessages,
      message: `Generated ${hintMessages.length} hints for device ${normalizedMAC}`
    });

  } catch (error) {
    logger.error('SystemLock Pro hints error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      attackerTeamId: req.body?.attackerTeamId,
      targetMAC: req.body?.targetMAC
    }, error as Error);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
