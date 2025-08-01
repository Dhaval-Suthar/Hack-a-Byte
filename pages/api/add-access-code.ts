import { NextRequest, NextResponse } from 'next/server';
import { createCustomAccessCode } from '@/app/actions/admin';

export async function POST(request: NextRequest) {
  try {
    const { adminKey } = await request.json();
    
    // Use the createCustomAccessCode function to add the access code
    const result = await createCustomAccessCode(
      '111111',              // code
      'permanent',           // type
      1,                     // priority (1 is highest)
      undefined,             // maxUsages (unlimited)
      undefined,             // expiresInHours (never expires)
      'learn more',          // description
      undefined,             // playspaceId (no specific playspace)
      adminKey               // adminKey
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Access code 111111 created successfully!',
        accessCode: result.accessCode
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating access code:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create access code'
    }, { status: 500 });
  }
}
