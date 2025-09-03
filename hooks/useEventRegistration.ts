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

        // Here you would typically integrate with Razorpay SDK
        // For now, we'll assume payment is successful and proceed with registration
        // In a real implementation, you'd wait for Razorpay payment completion

        // After payment verification, register for the event
        const registrationResult = await registerForEvent(data);

        if (!registrationResult.success) {
          throw new Error(registrationResult.error || 'Registration failed after payment');
        }

        return { success: true, message: registrationResult.message || 'Registration successful' };
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
