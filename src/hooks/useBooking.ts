import { apiRequest } from '@/lib/auth';
import type { Booking } from '@/types';

export async function createBooking(input: {
	turfId: string;
	date: string; // yyyy-mm-dd
	startTime: string; // HH:mm
	endTime: string;   // HH:mm
	totalAmount?: number;
	userName: string;
	userEmail: string;
	userPhone?: string;
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
		}),
	});
	return res.booking;
}

export async function getMyBookings(): Promise<Booking[]> {
	const res = await apiRequest<{ bookings: Booking[] }>(`/api/bookings/mine`);
	return res.bookings || [];
}

export async function getAllBookings(): Promise<Booking[]> {
	const res = await apiRequest<{ bookings: Booking[] }>(`/api/bookings`);
	return res.bookings || [];
}

export async function getTurfAvailability(turfId: string, date: string): Promise<string[]> {
	const res = await apiRequest<{ bookedTimes: string[] }>(`/api/turfs/${turfId}/availability?date=${encodeURIComponent(date)}`);
	return res.bookedTimes || [];
}

