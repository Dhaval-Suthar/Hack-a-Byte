import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

// Create Razorpay order
export const createRazorpayOrder = async (params: CreateOrderParams) => {
  try {
    const options = {
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      partial_payment: false,
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return {
      success: false,
      error: "Failed to create payment order",
    };
  }
};

// Verify Razorpay payment
export const verifyRazorpayPayment = (params: PaymentVerificationParams): boolean => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
};

// Get payment fee per person for event
export const getEventRegistrationFeePerPerson = (eventId: number): number => {
  // Event ID 100 is Mosaic 2025
  if (eventId === 100) {
    return 10000; // ₹100 per person
  }

  // Default fee for other events
  return 5000; // ₹50 per person
};

export default razorpay;
