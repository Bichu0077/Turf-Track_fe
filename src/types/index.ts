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