import { NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Team from '@/models/Team';

export async function GET() {
  try {
    await connectDb();

    // Get all teams to debug the team mapping
    const teams = await Team.find({})
      .select('_id playspaceId name wallet.bitcoinBalance')
      .lean();

    console.log('🎯 [debug-teams] All teams:', teams.map(t => ({
      mongoId: t._id,
      playspaceId: t.playspaceId,
      name: t.name,
      balance: t.wallet?.bitcoinBalance || 0
    })));

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
    console.error('Error fetching teams debug info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
