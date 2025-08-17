import { NextRequest, NextResponse } from 'next/server';
import { testAccessCodeSystem } from '@/lib/test-access-code-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email = 'test@hackabyte.com', 
      playingDevice = 'smartphone', 
      numberOfPlayers = 2 
    } = body;

    // Validate inputs
    if (!['smartphone', 'pc_laptop'].includes(playingDevice)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid playing device. Must be "smartphone" or "pc_laptop"'
      }, { status: 400 });
    }

    if (numberOfPlayers < 1 || numberOfPlayers > 4) {
      return NextResponse.json({
        success: false,
        error: 'Number of players must be between 1 and 4'
      }, { status: 400 });
    }

    // Run the test
    const result = await testAccessCodeSystem(email, playingDevice, numberOfPlayers);
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 400 
    });

  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Access Code System Test API',
    usage: {
      method: 'POST',
      body: {
        email: 'test@example.com (optional)',
        playingDevice: 'smartphone | pc_laptop (optional, default: smartphone)',
        numberOfPlayers: '1-4 (optional, default: 2)'
      },
      example: {
        email: 'user@hackabyte.com',
        playingDevice: 'smartphone',
        numberOfPlayers: 2
      }
    }
  });
}
