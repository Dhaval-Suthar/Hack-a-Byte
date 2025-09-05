import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Site from '@/models/Site';

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isReward = searchParams.get('reward');
    
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (isReward === 'true') query.isRewardSite = true;
    
    const sites = await Site.find(query).sort({ createdAt: -1 });
    
    // Shuffle the sites array to randomize order
    const shuffledSites = sites.sort(() => Math.random() - 0.5);
    
    return NextResponse.json({ success: true, sites: shuffledSites });
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    
    const data = await request.json();
    const site = new Site(data);
    await site.save();
    
    return NextResponse.json({ success: true, site });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
