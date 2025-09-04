"use client";

import { useState } from 'react';
import { registerForEvent } from '../app/actions/eventRegistration';
import { createEventPaymentOrder } from '../app/actions/payment';

interface RegistrationData {
  eventId: number;
  eventObjectId?: string;
  email: string;
  playingDevice: "smartphone" | "pc_laptop";
  numberOfPlayers: number;
  pricingType?: "normal" | "extended";
}

interface UseEventRegistrationReturn {
  registerForEvent: (data: RegistrationData, paymentMethod: 'razorpay' | 'wallet') => Promise<{ success: boolean; message: string }>;
  loading: boolean;
  error: string | null;
}

export function useEventRegistration(): UseEventRegistrationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegisterForEvent = async (
    data: RegistrationData,
    paymentMethod: 'razorpay' | 'wallet'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (paymentMethod === 'razorpay') {
        // Handle Razorpay payment flow
        const paymentResult = await createEventPaymentOrder(data);

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Failed to create payment order');
        }

        // Check if this is a paid event (has orderId) or free event
        if (paymentResult.orderId && paymentResult.amount > 0 && paymentResult.key) {
          // This is a paid event - we need to integrate with Razorpay SDK
          return new Promise((resolve) => {
            // Check if Razorpay is available
            if (typeof window === 'undefined' || !window.Razorpay) {
              resolve({ success: false, message: 'Razorpay SDK not loaded. Please refresh the page and try again.' });
              return;
            }

            const options = {
              key: paymentResult.key!,
              amount: paymentResult.amount,
              currency: paymentResult.currency,
              order_id: paymentResult.orderId!,
              name: 'Hack-A-Byte Event Registration',
              description: `Registration for Event #${data.eventId}`,
              handler: async (response: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
              }) => {
                try {
                  // Verify payment on server
                  const verifyResponse = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      registrationId: paymentResult.registrationId,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      eventId: data.eventId,
                      eventTitle: `Event ${data.eventId}`, // You might want to pass the actual title
                      eventDate: new Date().toISOString().split('T')[0], // Current date as fallback
                      eventTime: 'TBD',
                      eventLocation: 'Online'
                    }),
                  });

                  const verifyResult = await verifyResponse.json();

                  if (verifyResult.success) {
                    resolve({ success: true, message: verifyResult.message || 'Payment successful and registration completed!' });
                  } else {
                    resolve({ success: false, message: verifyResult.error || 'Payment verification failed' });
                  }
                } catch (error) {
                  console.error('Payment verification error:', error);
                  resolve({ success: false, message: 'Payment verification failed. Please contact support.' });
                }
              },
              prefill: {
                email: data.email,
              },
              theme: {
                color: '#00ff88',
              },
              modal: {
                ondismiss: () => {
                  resolve({ success: false, message: 'Payment cancelled by user' });
                }
              }
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
          });
        } else if (!paymentResult.key) {
          return { success: false, message: 'Payment configuration error. Please contact support.' };
        } else {
          // This is a free event - registration already completed
          return { success: true, message: 'Registration successful! Check your email for the access code.' };
        }
      } else {
        // Handle wallet payment or free registration
        const result = await registerForEvent(data);

        if (!result.success) {
          throw new Error(result.error || 'Registration failed');
        }

        return { success: true, message: result.message || 'Registration successful' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    registerForEvent: handleRegisterForEvent,
    loading,
    error
  };
}
