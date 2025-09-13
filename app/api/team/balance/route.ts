import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { success: false, error: 'Missing teamId parameter' },
        { status: 400 }
      );
    }

    await connectDb();

    // Try finding by playspaceId first, then by _id
    let team = await Team.findOne({ playspaceId: teamId }).select('_id wallet.bitcoinBalance');
    if (!team) {
      try {
        team = await Team.findById(teamId).select('_id wallet.bitcoinBalance');
      } catch (error) {
        // Invalid ObjectId format - log but continue
        console.warn('Invalid teamId format for findById:', teamId, error);
      }
    }

    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teamId: team._id,
      bitcoinBalance: team.wallet?.bitcoinBalance || 0,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching team balance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
