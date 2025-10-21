import { apiRequest } from '@/lib/auth';
import type { Booking, PaymentDetails, RazorpayResponse } from '@/types';

export async function createBooking(input: {
	turfId: string;
	date: string; // yyyy-mm-dd
	startTime: string; // HH:mm
	endTime: string;   // HH:mm
	totalAmount?: number;
	userName: string;
	userEmail: string;
	userPhone?: string;
	paymentMethod: 'cash' | 'online' | 'owner';
	bookingType?: 'customer' | 'owner' | 'maintenance' | 'event';
	notes?: string;
}): Promise<Booking> {
	const res = await apiRequest<{ booking: Booking }>(`/api/bookings`, {
		method: 'POST',
		body: JSON.stringify({
			turfId: input.turfId,
			date: input.date,
			startTime: input.startTime,
			endTime: input.endTime,
			totalAmount: input.totalAmount,
			userName: input.userName,
			userEmail: input.userEmail,
			userPhone: input.userPhone,
			paymentMethod: input.paymentMethod,
			bookingType: input.bookingType,
			notes: input.notes,
		}),
	});
	return res.booking;
}

export async function createBookingWithPayment(input: {
	turfId: string;
	date: string; // yyyy-mm-dd
	startTime: string; // HH:mm
	endTime: string;   // HH:mm
	totalAmount?: number;
	userName: string;
	userEmail: string;
	userPhone?: string;
}): Promise<PaymentDetails> {
	const res = await apiRequest<PaymentDetails>(`/api/payments/create-booking-with-payment`, {
		method: 'POST',
		body: JSON.stringify({
			turfId: input.turfId,
			date: input.date,
			startTime: input.startTime,
			endTime: input.endTime,
			totalAmount: input.totalAmount,
			userName: input.userName,
			userEmail: input.userEmail,
			userPhone: input.userPhone,
		}),
	});
	return res;
}

export async function createPaymentOrder(input: {
	bookingId: string;
	amount: number;
}): Promise<PaymentDetails> {
	const res = await apiRequest<{ paymentDetails: PaymentDetails }>(`/api/payments/create-order`, {
		method: 'POST',
		body: JSON.stringify(input),
	});
	return res.paymentDetails;
}

export async function verifyPayment(input: {
	bookingId?: string; // Optional for new bookings created during payment verification
	razorpayResponse: RazorpayResponse;
}): Promise<Booking> {
	const res = await apiRequest<{ booking: Booking }>(`/api/payments/verify`, {
		method: 'POST',
		body: JSON.stringify(input),
	});
	return res.booking;
}

export async function payLater(bookingId: string): Promise<PaymentDetails> {
	const res = await apiRequest<{ paymentDetails: PaymentDetails }>(`/api/bookings/${bookingId}/pay-later`, {
		method: 'POST',
	});
	return res.paymentDetails;
}

export async function cancelBooking(input: {
	bookingId: string;
	reason?: string;
}): Promise<Booking> {
	const res = await apiRequest<{ booking: Booking }>(`/api/bookings/${input.bookingId}/cancel`, {
		method: 'POST',
		body: JSON.stringify({ reason: input.reason }),
	});
	return res.booking;
}

export async function getMyBookings(): Promise<Booking[]> {
	console.log('[getMyBookings] Starting API call to /api/bookings/mine');
	try {
		const res = await apiRequest<{ bookings: Booking[] }>(`/api/bookings/mine`);
		console.log('[getMyBookings] API response:', res);
		return res.bookings || [];
	} catch (error) {
		console.error('[getMyBookings] API error:', error);
		throw error;
	}
}

export async function getAllBookings(): Promise<Booking[]> {
	const res = await apiRequest<{ bookings: Booking[] }>(`/api/bookings`);
	return res.bookings || [];
}

export async function getTurfAvailability(turfId: string, date: string): Promise<string[]> {
	const res = await apiRequest<{ bookedTimes: string[] }>(`/api/turfs/${turfId}/availability?date=${encodeURIComponent(date)}`);
	return res.bookedTimes || [];
}

