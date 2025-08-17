"use server";

import connectDb from "@/db/connectDb";
import EventRegistration from "@/models/EventRegistration";
import { createRazorpayOrder, verifyRazorpayPayment, getEventRegistrationFeePerPerson } from "@/lib/razorpay";
import { createAccessCodeAndPlayspace } from "@/lib/access-code-generation";
import { sendAccessCodeEmail } from "@/lib/nodemailer";

export interface CreatePaymentOrderData {
  eventId: number;
  email: string;
  playingDevice: "smartphone" | "pc_laptop";
  numberOfPlayers: number;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Create Razorpay order for event registration
export async function createEventPaymentOrder(data: CreatePaymentOrderData) {
  try {
    const { eventId, email, playingDevice, numberOfPlayers } = data;

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

    // Validate number of players
    if (numberOfPlayers < 1 || numberOfPlayers > 4) {
      return {
        success: false,
        error: "Number of players must be between 1 and 4"
      };
    }

    await connectDb();

    // Calculate registration fee (per person)
    const feePerPerson = getEventRegistrationFeePerPerson(eventId);
    const amount = feePerPerson * numberOfPlayers;
    
    // Create pending registration record
    const registration = new EventRegistration({
      eventId,
      email: email.toLowerCase(),
      playingDevice,
      numberOfPlayers,
      paymentStatus: "pending",
      registrationDate: new Date()
    });

    await registration.save();

    // Create Razorpay order
    const orderResult = await createRazorpayOrder({
      amount: amount, // Amount in paisa
      currency: "INR",
      receipt: `reg_${registration._id.toString()}`
    });

    if (!orderResult.success || !orderResult.order) {
      // Clean up registration if order creation fails
      await EventRegistration.findByIdAndDelete(registration._id);
      return {
        success: false,
        error: "Failed to create payment order"
      };
    }

    // Update registration with order ID
    await EventRegistration.findByIdAndUpdate(registration._id, {
      razorpayOrderId: orderResult.order.id
    });

    return {
      success: true,
      orderId: orderResult.order.id,
      amount: amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      registrationId: registration._id.toString()
    };

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

    // Generate access code and create playspace (if not already done)
    if (!updatedRegistration.accessCodeId) {
      console.log("Creating access code and playspace for paid registration:", registrationId);
      
      const accessCodeResult = await createAccessCodeAndPlayspace({
        numberOfPlayers: updatedRegistration.numberOfPlayers,
        playingDevice: updatedRegistration.playingDevice,
        eventTitle: eventDetails.eventTitle,
        registrationId: registrationId
      });
      
      if (accessCodeResult.success) {
        // Update registration with access code and playspace info
        await EventRegistration.findByIdAndUpdate(registrationId, {
          accessCodeId: accessCodeResult.accessCodeId,
          playspaceId: accessCodeResult.playspaceId
        });
        
        // Send access code email
        console.log("Sending access code email to:", updatedRegistration.email);
        
        const emailResult = await sendAccessCodeEmail({
          email: updatedRegistration.email,
          eventTitle: eventDetails.eventTitle,
          accessCode: accessCodeResult.accessCode!,
          numberOfPlayers: updatedRegistration.numberOfPlayers,
          playingDevice: updatedRegistration.playingDevice === "smartphone" ? "Smartphone" : "PC/Laptop",
          maxUsages: updatedRegistration.numberOfPlayers,
          playspaceName: accessCodeResult.playspaceName!,
          instructions: `Payment confirmed! Use your access code to enter your dedicated gaming environment and start your cybersecurity challenge!`
        });
        
        if (emailResult.success) {
          // Mark email as sent
          await EventRegistration.findByIdAndUpdate(registrationId, {
            accessCodeSent: true,
            accessCodeSentAt: new Date()
          });
          console.log("Access code email sent successfully to:", updatedRegistration.email);
        } else {
          console.error("Failed to send access code email:", emailResult.error);
        }
      } else {
        console.error("Failed to create access code and playspace:", accessCodeResult.error);
      }
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
