"use server";

import connectDb from "@/db/connectDb";
import Event from "@/models/Event";
import EventRegistration from "@/models/EventRegistration";
import { completeRegistrationPipeline } from "@/lib/event-registration";
import { logger } from '@/lib/logger';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/lib/razorpay';

export interface CreatePaymentOrderData {
	eventId: number;
	eventObjectId?: string; // real Mongo ObjectId
	email: string;
	playingDevice: "smartphone" | "pc_laptop";
	numberOfPlayers: number;
	pricingType?: "normal" | "extended";
}

// Returned shape expected by frontend hook
export interface CreatePaymentOrderResult {
	success: boolean;
	error?: string;
	orderId?: string;
	amount: number; // amount in rupees (Cashfree forms expect rupees)
	currency?: string;
	key?: string; // client id
	registrationId?: string;
	paymentLink?: string | null;
	paymentSessionId?: string | null;
	checkoutMode?: 'sandbox' | 'production';
}

// Create Cashfree order for event registration
export async function createEventPaymentOrder(data: CreatePaymentOrderData): Promise<CreatePaymentOrderResult> {
	try {
		const { eventId, eventObjectId, email, playingDevice, numberOfPlayers, pricingType = "normal" } = data;

		// Basic validation
			if (!eventId || !email || !playingDevice || !numberOfPlayers) {
				return { success: false, error: "All fields are required", amount: 0 };
			}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return { success: false, error: "Please enter a valid email address", amount: 0 };
			}

		await connectDb();

		// Resolve event
		let event;
		if (eventObjectId) {
			try {
				event = await Event.findById(eventObjectId);
			} catch (err) {
				logger.error('Invalid event object id', { error: err instanceof Error ? err.message : String(err) });
						return { success: false, error: 'Invalid event id', amount: 0 };
			}
		} else {
			const all = await Event.find({});
			event = all.find(e => {
				const derived = parseInt(e._id.toString().slice(-6), 16);
				return derived === eventId;
			});
		}

			if (!event) {
				return { success: false, error: 'Event not found', amount: 0 };
			}

		const minPlayers = event.minTeamMembers || 1;
		const maxPlayers = event.maxTeamMembers || 4;
			if (numberOfPlayers < minPlayers || numberOfPlayers > maxPlayers) {
				return { success: false, error: `Number of players must be between ${minPlayers} and ${maxPlayers}`, amount: 0 };
			}

		const normalPrice = event.pricing?.normal || 0; // stored in rupees
		const extendedPrice = event.pricing?.extended;
		const pricePerPersonRupees = pricingType === 'extended' && extendedPrice ? extendedPrice : normalPrice;
		const isPaid = pricePerPersonRupees > 0;
		const amountRupees = pricePerPersonRupees * numberOfPlayers; // Cashfree expects rupees

		// Create registration (pending for paid events)
		const registration = new EventRegistration({
			eventId,
			email: email.toLowerCase(),
			playingDevice,
			numberOfPlayers,
			pricingType,
			paymentStatus: isPaid ? 'pending' : 'paid',
			registrationDate: new Date(),
			accessCodeSent: false
		});

		await registration.save();

		// Free event: complete pipeline immediately
		if (!isPaid) {
			const pipelineResult = await completeRegistrationPipeline({
				registrationId: registration._id.toString(),
				eventId,
				eventTitle: event.title || `Event ${eventId}`,
				email,
				numberOfPlayers,
				playingDevice
			});

					if (!pipelineResult.success) {
						return { success: false, error: pipelineResult.error || 'Failed to complete registration', amount: 0 };
					}

			return {
				success: true,
				orderId: undefined,
				amount: 0,
				currency: 'INR',
				key: process.env.CASHFREE_CLIENT_ID,
				registrationId: registration._id.toString()
			};
		}

		// Paid event: create Razorpay payment link
		// Check if Razorpay is configured
		if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
			// Cleanup registration on missing Razorpay configuration
			await EventRegistration.findByIdAndDelete(registration._id);
			return { 
				success: false, 
				error: 'Payment gateway not configured. Please contact support.', 
				amount: 0 
			};
		}

		// Create Razorpay payment link
		const razorpayResult = await createRazorpayOrder({
			amount: amountRupees * 100, // Razorpay expects paisa
			currency: 'INR',
			receipt: registration._id.toString(),
			description: `Registration for ${event.title}`,
			customer: {
				name: 'Participant', // Could be updated if name is collected
				email: email.toLowerCase(),
			},
			callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?registrationId=${registration._id.toString()}`
		});

		if (!razorpayResult.success) {
			// Cleanup registration on failure
			await EventRegistration.findByIdAndDelete(registration._id);
			return { success: false, error: razorpayResult.error || 'Failed to create payment link', amount: 0 };
		}

		// Save the payment link id on registration for later verification
		await EventRegistration.findByIdAndUpdate(registration._id, { razorpayPaymentLinkId: razorpayResult.paymentLinkId });

		return {
			success: true,
			orderId: registration._id.toString(),
			amount: amountRupees,
			currency: 'INR',
			key: process.env.RAZORPAY_KEY_ID,
			registrationId: registration._id.toString(),
			paymentLink: razorpayResult.paymentLink,
			paymentSessionId: null,
			checkoutMode: 'production' // Razorpay payment links don't have sandbox mode distinction here
		};

	} catch (error: unknown) {
		logger.error('Create payment order error:', { error: error instanceof Error ? error.message : String(error) });
		return { success: false, error: 'Failed to create payment order. Please try again.', amount: 0 };
	}
}

// Verify Razorpay payment by checking payment link status
export async function verifyEventPayment(
	registrationId: string,
	paymentData: {
		payment_link_id?: string;
		payment_id?: string;
		order_id?: string; // for backward compatibility
		cf_order_id?: string;
		payment_status?: string;
	},
	eventData: {
		eventId: number;
		eventTitle: string;
		eventDate: string;
		eventTime: string;
		eventLocation: string;
	}
): Promise<{ success: boolean; error?: string; message?: string }> {
	try {
		// Find the registration
		const registration = await EventRegistration.findById(registrationId);
		if (!registration) {
			return { success: false, error: 'Registration not found' };
		}

		if (registration.paymentStatus === 'paid') {
			return { success: true, message: 'Payment already verified' };
		}

		// Check if Razorpay is configured
		if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
			return { success: false, error: 'Payment gateway not configured. Please contact support.' };
		}

		// Get payment link id
		const paymentLinkId = paymentData.payment_link_id || registration.razorpayPaymentLinkId;
		if (!paymentLinkId) {
			return { success: false, error: 'Payment link ID not found' };
		}

		// Verify payment with Razorpay
		const verifyResult = await verifyRazorpayPayment({ payment_link_id: paymentLinkId });

		if (!verifyResult.success) {
			return { success: false, error: 'Failed to verify payment status' };
		}

		const status = verifyResult.status;
		logger.info('Razorpay payment link status', { paymentLinkId, status });

		// Check if payment was successful
		if (status === 'paid') {
			// Update registration status
			await EventRegistration.findByIdAndUpdate(registrationId, {
				paymentStatus: 'paid',
				paymentVerifiedAt: new Date()
			});

			// Complete the registration pipeline
			const pipelineResult = await completeRegistrationPipeline({
				registrationId,
				eventId: eventData.eventId,
				eventTitle: eventData.eventTitle,
				email: registration.email,
				numberOfPlayers: registration.numberOfPlayers,
				playingDevice: registration.playingDevice
			});

			if (!pipelineResult.success) {
				logger.error('Registration pipeline failed after payment verification', { registrationId, error: pipelineResult.error });
				return { success: false, error: 'Payment verified but registration completion failed' };
			}

			return { success: true, message: 'Payment verified and registration completed successfully' };
		} else if (status === 'cancelled' || status === 'expired') {
			// Update registration status to failed
			await EventRegistration.findByIdAndUpdate(registrationId, {
				paymentStatus: 'failed'
			});
			return { success: false, error: 'Payment failed or was cancelled' };
		} else {
			// Payment is still pending
			return { success: false, error: 'Payment is still processing' };
		}

	} catch (error: unknown) {
		logger.error('Payment verification error:', { error: error instanceof Error ? error.message : String(error) });
		return { success: false, error: 'Payment verification failed' };
	}
}

