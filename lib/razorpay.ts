// Razorpay integration for payment links
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CreateOrderParams {
  amount: number; // Amount in paisa (multiply by 100 for rupees)
  currency: string;
  receipt: string;
  description?: string;
  customer?: {
    name?: string;
    email?: string;
  };
  callback_url?: string;
}

export interface CreateOrderResult {
  success: boolean;
  paymentLink?: string;
  paymentLinkId?: string;
  error?: string;
}

export interface PaymentVerificationParams {
  payment_link_id?: string;
  payment_id?: string;
  signature?: string;
}

// Create Razorpay payment link
export const createRazorpayOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
  try {
    const link = await razorpay.paymentLink.create({
      amount: params.amount, // in paisa
      currency: params.currency,
      description: params.description || 'Payment',
      customer: params.customer || {},
      notify: { sms: true, email: true },
      callback_url: params.callback_url,
      callback_method: 'get',
    });

    return {
      success: true,
      paymentLink: link.short_url,
      paymentLinkId: link.id,
    };
  } catch (error) {
    console.error('Razorpay payment link creation failed:', error);
    return {
      success: false,
      error: 'Failed to create payment link',
    };
  }
};

// Verify Razorpay payment - for payment links, check status
export const verifyRazorpayPayment = async (params: PaymentVerificationParams): Promise<{ success: boolean; status?: string }> => {
  try {
    // For payment links, we can fetch the payment link details
    if (params.payment_link_id) {
      const link = await razorpay.paymentLink.fetch(params.payment_link_id);
      // Return the status
      return { success: true, status: link.status };
    }
    return { success: false };
  } catch (error) {
    console.error('Razorpay payment verification failed:', error);
    return { success: false };
  }
};

// Get payment fee per person for event - placeholder
export const getEventRegistrationFeePerPerson = (): number => {
  // This would need to be implemented based on your pricing logic
  return 100; // Default 1 INR in paisa
};

const razorpayExports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getEventRegistrationFeePerPerson
};

export default razorpayExports;
