"use server";

import connectDb from "@/db/connectDb";
import Event from "@/models/Event";
import EventRegistration from "@/models/EventRegistration";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/razorpay";
import { completeRegistrationPipeline } from "@/lib/event-registration";

export interface CreatePaymentOrderData {
  eventId: number;
  eventObjectId?: string; // real Mongo ObjectId
  email: string;
  playingDevice: "smartphone" | "pc_laptop";
  numberOfPlayers: number;
  pricingType?: "normal" | "extended";
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Create Razorpay order for event registration
export async function createEventPaymentOrder(data: CreatePaymentOrderData) {
  try {
  const { eventId, eventObjectId, email, playingDevice, numberOfPlayers, pricingType = "normal" } = data;

    // Validate inputs
    if (!eventId || !email || !playingDevice || !numberOfPlayers) {
      return {
        success: false,
        error: "All fields are required"
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Please enter a valid email address"
      };
    }

    await connectDb();

    // Fetch event data to get team size limits
    // Prefer real ObjectId when provided
    let event;
    if (eventObjectId) {
      try {
        event = await Event.findById(eventObjectId);
  } catch {
        return { success: false, error: "Invalid event id" };
      }
    } else {
      const all = await Event.find({});
      event = all.find(e => {
        const derived = parseInt(e._id.toString().slice(-6), 16);
        return derived === eventId;
      });
    }
    if (!event) {
      return {
        success: false,
        error: "Event not found"
      };
    }

    const minPlayers = event.minTeamMembers || 1;
    const maxPlayers = event.maxTeamMembers || 4;

    // Validate number of players based on event limits
    if (numberOfPlayers < minPlayers || numberOfPlayers > maxPlayers) {
      return {
        success: false,
        error: `Number of players must be between ${minPlayers} and ${maxPlayers}`
      };
    }

  // Determine if event is paid based on stored pricing
  const normalPrice = event.pricing?.normal || 0; // assume stored in rupees
  const extendedPrice = event.pricing?.extended;
  const pricePerPersonRupees = pricingType === "extended" && extendedPrice ? extendedPrice : normalPrice;
  const isPaid = pricePerPersonRupees > 0;
  const amount = pricePerPersonRupees * 100 * numberOfPlayers; // convert rupees to paisa
    
    // Create registration record (pending if paid, paid if free)
    const registration = new EventRegistration({
      eventId,
      email: email.toLowerCase(),
      playingDevice,
      numberOfPlayers,
      pricingType,
      paymentStatus: isPaid ? "pending" : "paid",
      registrationDate: new Date()
    });

    await registration.save();

    if (isPaid) {
      const orderResult = await createRazorpayOrder({
        amount: amount, // paisa
        currency: "INR",
        receipt: `reg_${registration._id.toString()}`
      });

      if (!orderResult.success || !orderResult.order) {
        await EventRegistration.findByIdAndDelete(registration._id);
        return { success: false, error: "Failed to create payment order" };
      }

      await EventRegistration.findByIdAndUpdate(registration._id, { razorpayOrderId: orderResult.order.id });

      return {
        success: true,
        orderId: orderResult.order.id,
        amount: amount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
        registrationId: registration._id.toString()
      };
    } else {
      // Free event: directly complete pipeline
      const pipelineResult = await completeRegistrationPipeline({
        registrationId: registration._id.toString(),
        eventId,
        eventTitle: event.title,
        email,
        numberOfPlayers,
        playingDevice
      });
      if (!pipelineResult.success) {
        return { success: false, error: pipelineResult.error || "Failed to complete registration" };
      }
      return {
        success: true,
        orderId: undefined,
        amount: 0,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
        registrationId: registration._id.toString()
      };
    }

  } catch (error: unknown) {
    console.error("Create payment order error:", error);
    return {
      success: false,
      error: "Failed to create payment order. Please try again."
    };
  }
}

// Verify payment and complete registration
export async function verifyEventPayment(
  registrationId: string,
  paymentData: VerifyPaymentData,
  eventDetails: {
    eventId: number;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
  }
) {
  try {
    if (!registrationId || !paymentData.razorpay_order_id || !paymentData.razorpay_payment_id || !paymentData.razorpay_signature) {
      return {
        success: false,
        error: "Missing payment verification data"
      };
    }

    await connectDb();

    // Find the registration
    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return {
        success: false,
        error: "Registration not found"
      };
    }

    // Verify payment signature
    const isValidPayment = verifyRazorpayPayment(paymentData);
    if (!isValidPayment) {
      // Mark payment as failed
      await EventRegistration.findByIdAndUpdate(registrationId, {
        paymentStatus: "failed"
      });
      return {
        success: false,
        error: "Payment verification failed"
      };
    }

    // Update registration with payment details
    const updatedRegistration = await EventRegistration.findByIdAndUpdate(
      registrationId,
      {
        paymentStatus: "paid",
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature
      },
      { new: true }
    );

    if (!updatedRegistration) {
      return {
        success: false,
        error: "Failed to update registration"
      };
    }

    // Generate access code, create team, and send email via shared pipeline
    const pipelineResult = await completeRegistrationPipeline({
      registrationId,
      eventId: eventDetails.eventId,
      eventTitle: eventDetails.eventTitle,
      email: updatedRegistration.email,
      numberOfPlayers: updatedRegistration.numberOfPlayers,
      playingDevice: updatedRegistration.playingDevice,
    });
    if (!pipelineResult.success) {
      console.error("Registration completion pipeline failed:", pipelineResult.error);
    }

    return {
      success: true,
      message: "Payment verified and registration completed successfully! Check your email for the access code.",
      registrationData: {
        id: updatedRegistration._id.toString(),
        eventId: updatedRegistration.eventId,
        email: updatedRegistration.email,
        paymentId: paymentData.razorpay_payment_id,
        accessCodeGenerated: !!updatedRegistration.accessCodeId
      }
    };

  } catch (error: unknown) {
    console.error("Verify payment error:", error);
    return {
      success: false,
      error: "Failed to verify payment. Please try again."
    };
  }
}
