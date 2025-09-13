import { NextResponse } from 'next/server';
import { processScheduledMessages } from '@/lib/randomMessageGenerator';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    await processScheduledMessages();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Processed scheduled messages',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Manual process error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
