"use server";

import connectDb from "@/db/connectDb";
import Event from "@/models/Event";
import EventRegistration from "@/models/EventRegistration";
import { completeRegistrationPipeline } from "@/lib/event-registration";
import { logger } from '@/lib/logger';

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

			// Paid event: create Cashfree order via REST API
			// Choose base URL: allow override with CASHFREE_API_BASE, otherwise infer sandbox when using test client ids
			const inferredBase = process.env.CASHFREE_API_BASE || (
				(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_ID.startsWith('TEST')) ||
				(process.env.CASHFREE_CLIENT_SECRET && process.env.CASHFREE_CLIENT_SECRET.includes('test'))
					? 'https://sandbox.cashfree.com'
					: 'https://api.cashfree.com'
			);
			const cfUrl = `${inferredBase}/pg/orders`;
			const customerPhone = process.env.CASHFREE_CUSTOMER_PHONE_DEFAULT || '9999999999';

			const isSandbox = inferredBase.includes('sandbox');
			const body = {
			order_id: registration._id.toString(),
			order_amount: Number(amountRupees.toFixed(2)),
			order_currency: 'INR',
			customer_details: {
				customer_id: registration._id.toString(),
				customer_email: email.toLowerCase(),
					customer_phone: customerPhone,
			},
			return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?registrationId=${registration._id.toString()}`
		};

				// Log non-sensitive diagnostics: which base URL we will call and whether credentials are present
				try {
					const maskedClientId = process.env.CASHFREE_CLIENT_ID ? `${process.env.CASHFREE_CLIENT_ID.slice(0, 6)}...` : 'MISSING';
					logger.info('Cashfree request', { base: inferredBase, clientId: maskedClientId });
					} catch {
						// ignore logging errors
					}

					const resp = await fetch(cfUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Accept': 'application/json',
							// Cashfree requires a version header; include both common variants to be compatible
							'version': process.env.CASHFREE_API_VERSION || '2022-01-01',
							'x-api-version': process.env.CASHFREE_API_VERSION || '2022-01-01',
							'x-client-id': process.env.CASHFREE_CLIENT_ID || '',
							'x-client-secret': process.env.CASHFREE_CLIENT_SECRET || ''
						},
						body: JSON.stringify(body)
					});

			if (!resp.ok) {
				// Cleanup registration on failure to create order
				await EventRegistration.findByIdAndDelete(registration._id);
				const text = await resp.text();
				// Provide a clearer message for auth errors
				if (resp.status === 401) {
					logger.error('Cashfree order creation failed - authentication error', { status: resp.status, body: text });
					return { success: false, error: 'Cashfree authentication failed - please check CASHFREE_CLIENT_ID/SECRET and CASHFREE_API_BASE', amount: 0 };
				}

				logger.error('Cashfree order creation failed', { status: resp.status, body: text });
				return { success: false, error: 'Failed to create payment order', amount: 0 };
			}

		const json = await resp.json();

		// Log the full response to see what Cashfree returns
		logger.info('Cashfree order created', { 
			orderId: json.order_id, 
			hasOrderToken: !!json.order_token,
			hasPaymentLink: !!json.payment_link,
			orderStatus: json.order_status
		});

		// Extract Cashfree response fields
		const returnedOrderId = json.order_id || registration._id.toString();
		const paymentLink = json.payment_link || null;
		const paymentSessionId = json.order_token || null; // Cashfree uses order_token, not payment_session_id

		// Save the order id on registration for later verification
		await EventRegistration.findByIdAndUpdate(registration._id, { razorpayOrderId: returnedOrderId });

		return {
			success: true,
			orderId: returnedOrderId,
			amount: amountRupees,
			currency: 'INR',
			key: process.env.CASHFREE_CLIENT_ID,
			registrationId: registration._id.toString(),
			paymentLink,
			paymentSessionId,
			checkoutMode: isSandbox ? 'sandbox' : 'production'
		};

	} catch (error: unknown) {
		logger.error('Create payment order error:', { error: error instanceof Error ? error.message : String(error) });
		return { success: false, error: 'Failed to create payment order. Please try again.', amount: 0 };
	}
}

