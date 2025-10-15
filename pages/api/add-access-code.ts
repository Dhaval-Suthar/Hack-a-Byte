import { NextRequest, NextResponse } from 'next/server';
import { createCustomAccessCode } from '@/app/actions/admin';
import { validateAndSanitizeInput, checkFormSubmissionRate } from '@/lib/validation';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkFormSubmissionRate(clientIP)) {
      logger.warn('Rate limit exceeded for access code creation', { ip: clientIP });
      return NextResponse.json({
        success: false,
        error: 'Too many requests. Please try again later.'
      }, { status: 429 });
    }

    const body = await request.json();
    const { adminKey } = body;

    // Validate and sanitize adminKey
    if (!adminKey || typeof adminKey !== 'string') {
      logger.warn('Invalid adminKey provided', { ip: clientIP });
      return NextResponse.json({
        success: false,
        error: 'Invalid admin key'
      }, { status: 400 });
    }

    const sanitizedAdminKey = validateAndSanitizeInput(adminKey, {
      maxLength: 100,
      allowHtml: false,
      allowSpecialChars: true
    });

    // Use the createCustomAccessCode function to add the access code
    const result = await createCustomAccessCode(
      '111111',              // code
      'permanent',           // type
      1,                     // priority (1 is highest)
      undefined,             // maxUsages (unlimited)
      undefined,             // expiresInHours (never expires)
      'learn more',          // description
      undefined,             // playspaceId (no specific playspace)
      sanitizedAdminKey      // adminKey
    );

    if (result.success) {
      logger.info('Access code created successfully', { ip: clientIP });
      return NextResponse.json({
        success: true,
        message: 'Access code 111111 created successfully!',
        accessCode: result.accessCode
      });
    } else {
      logger.error('Failed to create access code', { error: result.error, ip: clientIP });
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    logger.error('Unexpected error in access code creation', { 
      error: error instanceof Error ? error.message : String(error),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });
    return NextResponse.json({
      success: false,
      error: 'Failed to create access code'
    }, { status: 500 });
  }
}
