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
        // Handle Cashfree payment flow
        const paymentResult = await createEventPaymentOrder(data);

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Failed to create payment order');
        }

        // Check if this is a paid event (has orderId) or free event
        if (paymentResult.orderId && (paymentResult.amount ?? 0) > 0 && paymentResult.key) {
          // Paid event flow - redirect to Cashfree payment page
          // Cashfree provides a direct payment_link - use it
          if (paymentResult.paymentLink) {
            // Log for debugging
            console.log('✅ Payment order created:', {
              orderId: paymentResult.orderId,
              amount: paymentResult.amount,
              paymentLink: paymentResult.paymentLink
            });
            console.log('🚀 Redirecting to Cashfree payment link in 100ms...');
            
            // Use window.location.replace to ensure the redirect completes
            // This prevents the back button from returning to the form
            setTimeout(() => {
              window.location.replace(paymentResult.paymentLink!);
            }, 100);
            
            // Keep loading state active during redirect
            return { success: true, message: 'Redirecting to payment gateway...' };
          }

          // Fallback: construct URL from order token if no payment link
          if (paymentResult.paymentSessionId) {
            const checkoutUrl = paymentResult.checkoutMode === 'production' 
              ? 'https://payments.cashfree.com/order' 
              : 'https://payments-test.cashfree.com/order';
            
            const redirectUrl = `${checkoutUrl}/${paymentResult.paymentSessionId}`;
            console.log('Redirecting to Cashfree checkout:', redirectUrl);
            
            setTimeout(() => {
              window.location.replace(redirectUrl);
            }, 100);
            
            return { success: true, message: 'Redirecting to payment gateway...' };
          }

          return { success: false, message: 'Unable to initiate payment. Please contact support.' };
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
