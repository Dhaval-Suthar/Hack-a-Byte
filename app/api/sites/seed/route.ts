import { NextResponse } from 'next/server';
import seedSites from '@/lib/seedSites';

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
    console.error('Error seeding sites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed sites' },
      { status: 500 }
    );
  }
}
