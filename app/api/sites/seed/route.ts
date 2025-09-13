import { NextResponse } from 'next/server';
import seedSites from '@/lib/seedSites';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const result = await seedSites();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `Successfully seeded ${result.count} sites` 
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error seeding sites:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed sites' },
      { status: 500 }
    );
  }
}
