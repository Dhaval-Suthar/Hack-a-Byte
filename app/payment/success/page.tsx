'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface PaymentStatus {
  loading: boolean;
  success: boolean;
  message: string;
  error?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>({
    loading: true,
    success: false,
    message: 'Verifying payment...'
  });

  useEffect(() => {
    const verifyPayment = async () => {
      if (!searchParams) {
        setStatus({
          loading: false,
          success: false,
          message: 'Invalid payment session',
          error: 'Missing search parameters'
        });
        return;
      }

      const registrationId = searchParams.get('registrationId');
      const orderId = searchParams.get('order_id') || searchParams.get('cf_order_id');
      const paymentStatus = searchParams.get('payment_status');

      if (!registrationId) {
        setStatus({
          loading: false,
          success: false,
          message: 'Invalid payment session',
          error: 'Registration ID is missing'
        });
        return;
      }

      try {
        // Call the verification API
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registrationId,
            order_id: orderId,
            payment_status: paymentStatus,
            eventId: 100, // Default event ID - you might want to store this in session/localStorage
            eventTitle: 'Event Registration',
            eventDate: new Date().toISOString().split('T')[0],
            eventTime: 'TBD',
            eventLocation: 'Online'
          })
        });

        const result = await response.json();

        if (result.success) {
          setStatus({
            loading: false,
            success: true,
            message: result.message || 'Payment verified successfully!'
          });

          // Redirect to success page or dashboard after a delay
          setTimeout(() => {
            router.push('/?payment=success');
          }, 3000);
        } else {
          setStatus({
            loading: false,
            success: false,
            message: 'Payment verification failed',
            error: result.error || 'Unknown error'
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus({
          loading: false,
          success: false,
          message: 'Payment verification failed',
          error: 'Network error occurred'
        });
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center">
          {status.loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Processing Payment</h2>
              <p className="text-gray-400">{status.message}</p>
            </>
          ) : status.success ? (
            <>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Payment Successful!</h2>
              <p className="text-gray-400 mb-4">{status.message}</p>
              <p className="text-sm text-gray-500">Redirecting you shortly...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Payment Failed</h2>
              <p className="text-gray-400 mb-4">{status.error}</p>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}