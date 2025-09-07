import { NextResponse } from 'next/server';
import Device from '@/models/Device';
import Team from '@/models/Team';
import connectDb from '@/db/connectDb';

export async function GET() {
  try {
    await connectDb();
    
    const devices = await Device.find({}).select('_id teamId status').limit(10);
    const teams = await Team.find({}).select('_id name').limit(10);
    
    return NextResponse.json({ 
      devices: devices.map(d => ({ id: d._id, teamId: d.teamId, status: d.status })),
      teams: teams.map(t => ({ id: t._id, name: t.name }))
    });

  } catch (error) {
    console.error('Debug info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
