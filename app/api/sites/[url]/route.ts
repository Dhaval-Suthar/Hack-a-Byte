import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import Site from '@/models/Site';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ url: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDb();
    
    const { url } = await params;
    const decodedUrl = decodeURIComponent(url);
    const site = await Site.findOne({ url: decodedUrl });
    
    if (!site) {
      return NextResponse.json(
        { success: false, error: 'Site not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, site });
  } catch (error) {
    logger.error('Error fetching site:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch site' },
      { status: 500 }
    );
  }
}
