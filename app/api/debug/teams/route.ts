import { NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await connectDb();

    // Get all teams to debug the team mapping
    const teams = await Team.find({})
      .select('_id playspaceId name wallet.bitcoinBalance')
      .lean();

    return NextResponse.json({
      success: true,
      teams: teams.map(t => ({
        mongoId: t._id,
        playspaceId: t.playspaceId,
        name: t.name,
        balance: t.wallet?.bitcoinBalance || 0
      }))
    });

  } catch (error) {
    logger.error('Error fetching teams debug info:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
