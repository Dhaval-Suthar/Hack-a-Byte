// This file is kept for backward compatibility but Razorpay has been replaced with Cashfree
// All payment functionality is now handled in lib/cashfree.ts and app/actions/payment.ts

export interface CreateOrderParams {
  amount: number; // Amount in paisa (multiply by 100 for rupees)
  currency: string;
  receipt: string;
}

export interface PaymentVerificationParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Create Razorpay order - DEPRECATED: Use Cashfree instead
export const createRazorpayOrder = async () => {
  throw new Error("Razorpay has been replaced with Cashfree. Use createEventPaymentOrder from app/actions/payment.ts instead.");
};

// Verify Razorpay payment - DEPRECATED: Use Cashfree instead
export const verifyRazorpayPayment = (): boolean => {
  throw new Error("Razorpay has been replaced with Cashfree. Use verifyEventPayment from app/actions/payment.ts instead.");
};

// Get payment fee per person for event - DEPRECATED: Use Cashfree pricing
export const getEventRegistrationFeePerPerson = (): number => {
  throw new Error("Razorpay pricing has been replaced with Cashfree. Update your event pricing logic.");
};

const razorpayExports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getEventRegistrationFeePerPerson
};

export default razorpayExports;
