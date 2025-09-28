import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Since you're using an external socket server, we need to make a request to it
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    
    if (!socketUrl) {
      return NextResponse.json({ error: 'Socket URL not configured' }, { status: 500 });
    }

    // Try to get socket info from your external socket server
    // You'll need to implement this endpoint on your socket server
    const response = await fetch(`${socketUrl}/socket-stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'External socket server not responding',
        socketUrl: socketUrl,
        note: 'Make sure your socket server has a /socket-stats endpoint'
      }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Socket info error:', error);
    return NextResponse.json({ 
      error: 'Failed to get socket info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}