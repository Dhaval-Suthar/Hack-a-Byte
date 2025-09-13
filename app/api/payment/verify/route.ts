"use server";

import { NextRequest, NextResponse } from 'next/server';
import { verifyEventPayment } from '@/app/actions/payment';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      registrationId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      eventTitle,
      eventDate,
      eventTime,
      eventLocation
    } = body;

    // Validate required fields
    if (!registrationId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({
        success: false,
        error: 'Missing required payment verification data'
      }, { status: 400 });
    }

    if (!eventId || !eventTitle) {
      return NextResponse.json({
        success: false,
        error: 'Missing event details'
      }, { status: 400 });
    }

    const result = await verifyEventPayment(
      registrationId,
      {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      },
      {
        eventId,
        eventTitle,
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        eventTime: eventTime || 'TBD',
        eventLocation: eventLocation || 'Online'
      }
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }

  } catch (error) {
    logger.error('Payment verification API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during payment verification'
    }, { status: 500 });
  }
}
