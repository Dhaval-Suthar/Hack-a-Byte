import { NextResponse } from 'next/server';
import { processScheduledMessages } from '@/lib/randomMessageGenerator';

export async function POST() {
  try {
    await processScheduledMessages();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Processed scheduled messages',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Manual process error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
