export interface OperatingHours {
  open: string; // "06:00"
  close: string; // "22:00"
}

export interface Turf {
  id: string;
  name: string;
  location: string;
  description?: string;
  images: string[];
  pricePerHour: number;
  operatingHours: OperatingHours;
  amenities: string[];
}

export interface Booking {
  id: string;
  turfId: string;
  turfName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookingDate: string; // ISO Date (yyyy-mm-dd)
  startTime: string; // "14:00"
  endTime: string;   // "15:00"
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'online' | null;
  bookingStatus: 'confirmed' | 'cancelled' | 'tentative';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  canCancel?: boolean;
  createdAt: string; // ISO datetime
  // Owner settlement fields (matching your database schema)
  ownerSettlementStatus?: 'pending' | 'completed' | 'failed';
  payoutAmount?: number;
  settledAt?: string;
}

export interface PaymentDetails {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface FundTransfer {
  id?: string;
  turfOwnerId: string;
  turfOwnerName: string;
  turfOwnerEmail: string;
  totalEarnings: number;
  netAmount: number;
  weekStart?: string;
  weekEnd?: string;
  status?: string;
  bookings?: {
    id: string;
    userName: string;
    userEmail: string;
    turfName: string;
    amount: number;
    payoutAmount: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    settlementStatus: string;
  }[];
}

export interface OwnerSettlement {
  booking_id: string;
  turf_id: string;
  turf_name: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  user_name: string;
  user_email: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  owner_settlement_amount: number;
  owner_settlement_status: string;
  booking_created_at: string;
  days_since_booking: number;
}

export interface OwnerSettlementSummary {
  owner_id: string;
  owner_name: string;
  owner_email: string;
  pending_bookings: number;
  total_pending_amount: number;
  oldest_pending_booking: string;
  newest_pending_booking: string;
}