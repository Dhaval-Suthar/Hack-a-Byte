"use server";

import { NextRequest, NextResponse } from 'next/server';
import { verifyEventPayment } from '@/app/actions/payment';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      registrationId,
      order_id, // Cashfree order ID
      cf_order_id, // Cashfree order ID (alternative)
      payment_status, // Cashfree payment status
      eventId,
      eventTitle,
      eventDate,
      eventTime,
      eventLocation
    } = body;

    // Validate required fields
    if (!registrationId) {
      return NextResponse.json({
        success: false,
        error: 'Missing registration ID'
      }, { status: 400 });
    }

    // For Cashfree, we primarily need the registrationId to look up the order
    // The order_id and payment_status are optional but helpful
    if (!eventId || !eventTitle) {
      return NextResponse.json({
        success: false,
        error: 'Missing event details'
      }, { status: 400 });
    }

    const result = await verifyEventPayment(
      registrationId,
      {
        order_id: order_id || cf_order_id,
        payment_status
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
