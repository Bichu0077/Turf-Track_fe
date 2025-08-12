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
  paymentStatus: 'pending' | 'completed' | 'failed';
  bookingStatus: 'confirmed' | 'cancelled';
  createdAt: string; // ISO datetime
}