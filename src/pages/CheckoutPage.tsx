import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { createBooking, createBookingWithPayment, verifyPayment } from "@/hooks/useBooking";
import { PaymentMethodSelector } from "@/components/booking/PaymentMethodSelector";
import { initiatePayment, validateRazorpayConfig } from "@/lib/razorpay";
import { toast } from "sonner";
import type { RazorpayResponse } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  useRegistered: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type CheckoutState = {
  turfId: string;
  turfName: string;
  date: string; // yyyy-mm-dd
  startTime: string;
  endTime: string;
  total: number;
};

export default function CheckoutPage() {
  const { state } = useLocation() as { state?: CheckoutState };
  const navigate = useNavigate();
  const { user } = useAuth();
  const [useRegisteredEmail, setUseRegisteredEmail] = useState(false);
  const [useRegisteredPhone, setUseRegisteredPhone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<FormData | null>(null);
  
  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  });

  useEffect(() => {
    if (useRegisteredEmail && user) {
      setValue('email', user.email || '');
    } else if (!useRegisteredEmail) {
      setValue('email', '');
    }
  }, [useRegisteredEmail, user, setValue]);

  useEffect(() => {
    if (useRegisteredPhone && user && user.phone) {
      setValue('phone', user.phone);
    } else if (!useRegisteredPhone) {
      setValue('phone', '');
    }
  }, [useRegisteredPhone, user, setValue]);

  if (!state) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-semibold">No booking data</h1>
        <p className="text-muted-foreground">Please select a turf and slot first.</p>
      </main>
    );
  }

  // Check if Razorpay is configured
  const isRazorpayConfigured = validateRazorpayConfig();

  async function onSubmit(values: FormData) {
    if (!state) return;
    setErrorMsg(null);
    setBookingData(values);
    
    // If Razorpay is not configured, default to cash payment
    if (!isRazorpayConfigured) {
      await handlePaymentMethod('cash', values);
    } else {
      setIsPaymentDialogOpen(true);
    }
  }

  async function handlePaymentMethod(method: 'cash' | 'online', formData?: FormData) {
    if (!state) return;
    const values = formData || bookingData;
    if (!values) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (method === 'cash') {
        // For cash payment, create booking directly
        const booking = await createBooking({
          turfId: state.turfId,
          date: state.date,
          startTime: state.startTime,
          endTime: state.endTime,
          totalAmount: state.total,
          userName: values.name,
          userEmail: useRegisteredEmail && user?.email ? user.email : values.email,
          userPhone: useRegisteredPhone && user?.phone ? user.phone : values.phone,
          paymentMethod: method,
        });

        toast.success('Booking confirmed! Please pay cash when you arrive at the turf.');
        navigate("/profile");
      } else {
        // For online payment, create payment order directly (no booking yet)
        await handleOnlinePayment(values);
      }
    } catch (e) {
      setErrorMsg((e as Error)?.message || "Booking failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
    }
  }

  async function handleOnlinePayment(values: FormData) {
    try {
      // Create payment order with booking details (no booking record created yet)
      const paymentDetails = await createBookingWithPayment({
        turfId: state.turfId,
        date: state.date,
        startTime: state.startTime,
        endTime: state.endTime,
        totalAmount: state.total,
        userName: values.name,
        userEmail: useRegisteredEmail && user?.email ? user.email : values.email,
        userPhone: useRegisteredPhone && user?.phone ? user.phone : values.phone,
      });

      // Initiate Razorpay payment
      await initiatePayment(
        paymentDetails,
        async (response: RazorpayResponse) => {
          // Payment successful, verify on backend and create booking
          try {
            const booking = await verifyPayment({
              // No bookingId needed for new bookings
              razorpayResponse: response,
            });
            toast.success('Payment successful! Your booking is confirmed.');
            navigate("/bookings");
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        (error: Error) => {
          console.error('Payment failed:', error);
          toast.error('Payment failed. Please try again.');
        }
      );
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error('Failed to initiate payment. Please try again.');
    }
  }

  return (
    <main className="container py-8">
      <Helmet>
        <title>Checkout</title>
        <meta name="description" content="Confirm booking and pay." />
        <link rel="canonical" href="/checkout" />
      </Helmet>
      <div className="max-w-lg mx-auto card-elevated p-6 mt-8">
        <h2 className="mb-4 text-lg font-semibold">Booking Summary</h2>
        <div className="grid gap-2 text-sm mb-6">
          <div className="flex justify-between"><span>Turf</span><span>{state.turfName}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{state.date}</span></div>
          <div className="flex justify-between"><span>Time</span><span>{state.startTime} - {state.endTime}</span></div>
          <div className="mt-2 flex justify-between font-medium"><span>Total</span><span>₹{state.total}</span></div>
        </div>
        {errorMsg && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm border border-red-300">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input {...register('email')} disabled={useRegisteredEmail} />
            {user && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="useRegisteredEmail"
                  checked={useRegisteredEmail}
                  onChange={e => setUseRegisteredEmail(e.target.checked)}
                  className="accent-primary h-4 w-4"
                />
                <label htmlFor="useRegisteredEmail" className="text-sm select-none cursor-pointer">
                  Use registered email ({user.email})
                </label>
              </div>
            )}
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <Input {...register('phone')} disabled={useRegisteredPhone} />
            {user && user.phone && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="useRegisteredPhone"
                  checked={useRegisteredPhone}
                  onChange={e => setUseRegisteredPhone(e.target.checked)}
                  className="accent-primary h-4 w-4"
                />
                <label htmlFor="useRegisteredPhone" className="text-sm select-none cursor-pointer">
                  Use registered mobile ({user.phone})
                </label>
              </div>
            )}
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
          </div>
          
          {!isRazorpayConfigured && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Online payment is currently unavailable. You can pay cash at the turf.
            </div>
          )}
          
          <div className="mt-4 p-3 bg-muted/30 rounded text-xs text-muted-foreground text-center">
            By proceeding with payment, you agree to our{" "}
            <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => window.open('/terms-conditions', '_blank')}>
              Terms & Conditions
            </Button>
            {", "}
            <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => window.open('/cancellation-refunds', '_blank')}>
              Cancellation Policy
            </Button>
            {" and "}
            <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => window.open('/shipping-policy', '_blank')}>
              Shipping Policy
            </Button>
            .
          </div>
          <Button 
            type="submit" 
            variant="hero" 
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : isRazorpayConfigured ? "Continue to Payment" : "Confirm Booking (Pay at Turf)"}
          </Button>
        </form>
      </div>

      {/* Payment Method Selector Dialog */}
      <PaymentMethodSelector
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        turfName={state.turfName}
        amount={state.total}
        date={state.date}
        time={`${state.startTime} - ${state.endTime}`}
        onPaymentMethodSelect={handlePaymentMethod}
        isProcessing={isProcessing}
      />
    </main>
  );
}
