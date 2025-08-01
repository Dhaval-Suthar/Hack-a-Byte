import { NextRequest, NextResponse } from 'next/server';
import { validateDeviceSession } from '@/lib/device-session';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, deviceType } = await request.json();

    if (!deviceId || !deviceType) {
      return NextResponse.json(
        { error: 'Device ID and type are required' },
        { status: 400 }
      );
    }

    const sessionData = await validateDeviceSession(deviceId, deviceType);

    if (!sessionData) {
      return NextResponse.json({ isAuthenticated: false });
    }

    return NextResponse.json({
      isAuthenticated: true,
      username: sessionData.username,
      deviceId: sessionData.deviceId,
      playspaceId: sessionData.playspaceId,
    });
  } catch (error) {
    console.error('Session validation API error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
