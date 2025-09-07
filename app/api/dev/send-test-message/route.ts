import { NextRequest, NextResponse } from 'next/server';
import { sendScheduledMessage } from '@/lib/randomMessageGenerator';
import connectDb from '@/db/connectDb';

export async function POST(request: NextRequest) {
  try {
    const { teamId, type = 'sms', deviceId = '68ba8a4fdfe3d0f3c9d2a130' } = await request.json();
    
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    await connectDb();

    // Create a test message template
    const testMessage = {
      deviceId,
      teamId,
      scheduledAt: Date.now(), // Send immediately
      template: {
        type,
        sender: type === 'sms' ? 'Test SMS' : 'Test Email',
        content: type === 'sms' 
          ? 'This is a test SMS message to verify socket notifications are working!'
          : 'This is a test email content to verify socket notifications are working!',
        ...(type === 'email' ? {
          senderEmail: 'test@example.com',
          subject: 'Test Email Notification'
        } : {
          senderPhone: '+1234567890'
        }),
        isScam: false,
        rewardAmount: 0,
        lossAmount: 0,
        probabilityWeight: 1
      }
    };

    // Send the message immediately
    const success = await sendScheduledMessage(testMessage);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Test ${type} sent successfully`,
        deviceId,
        teamId
      });
    } else {
      return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 });
    }

  } catch (error) {
    console.error('Test message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
