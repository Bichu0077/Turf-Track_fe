// Razorpay configuration and utilities
import type { PaymentDetails, RazorpayResponse } from '@/types';

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Initialize Razorpay payment
export const initiatePayment = async (
  paymentDetails: PaymentDetails,
  onSuccess: (response: RazorpayResponse) => void,
  onFailure: (error: Error) => void
): Promise<void> => {
  const isLoaded = await loadRazorpayScript();
  
  if (!isLoaded) {
    throw new Error('Failed to load Razorpay SDK');
  }

  const options = {
    key: paymentDetails.key,
    amount: paymentDetails.amount, // Amount in paise
    currency: paymentDetails.currency,
    order_id: paymentDetails.orderId,
    name: paymentDetails.name,
    description: paymentDetails.description,
    image: paymentDetails.image,
    prefill: paymentDetails.prefill,
    theme: paymentDetails.theme,
    handler: (response: RazorpayResponse) => {
      onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        onFailure(new Error('Payment cancelled by user'));
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

// Calculate cancellation eligibility
export const canCancelBooking = (bookingDate: string, startTime: string): boolean => {
  try {
    if (!bookingDate || !startTime) return false;
    
    const now = new Date();
    
    // Handle both HH:mm and HH:mm:ss time formats
    const cleanStartTime = startTime.split(':').slice(0, 2).join(':'); // Remove seconds if present
    const bookingDateTime = new Date(`${bookingDate}T${cleanStartTime}:00`);
    
    // Check if date is valid
    if (isNaN(bookingDateTime.getTime())) return false;
    
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 2; // Can cancel if more than 2 hours before booking
  } catch (error) {
    console.error('Error in canCancelBooking:', error);
    return false;
  }
};

// Calculate refund amount
export const calculateRefundAmount = (
  totalAmount: number, 
  bookingDate: string, 
  startTime: string
): number => {
  try {
    if (!bookingDate || !startTime) return 0;
    
    const now = new Date();
    
    // Handle both HH:mm and HH:mm:ss time formats
    const cleanStartTime = startTime.split(':').slice(0, 2).join(':'); // Remove seconds if present
    const bookingDateTime = new Date(`${bookingDate}T${cleanStartTime}:00`);
    
    // Check if date is valid
    if (isNaN(bookingDateTime.getTime())) return 0;
    
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    console.log('[calculateRefundAmount] Debug:', {
      bookingDate,
      originalStartTime: startTime,
      cleanStartTime,
      now: now.toISOString(),
      bookingDateTime: bookingDateTime.toISOString(),
      hoursDiff,
      willGetRefund: hoursDiff >= 2,
      refundAmount: hoursDiff >= 2 ? totalAmount : 0
    });
    
    // More generous refund policy:
    // - Full refund if more than 2 hours before booking
    // - No refund if less than 2 hours before or in the past
    return hoursDiff >= 2 ? totalAmount : 0;
  } catch (error) {
    console.error('Error calculating refund amount:', error);
    return 0;
  }
};

// Validate Razorpay configuration
export const validateRazorpayConfig = (): boolean => {
  return !!RAZORPAY_KEY;
};