import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyINR } from "@/lib/format";
import type { Booking } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export default function BookingPage() {
  const { state } = useLocation() as { state?: any };
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!state) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-semibold">No booking data</h1>
        <p className="text-muted-foreground">Please select a turf and slot first.</p>
      </main>
    );
  }

  const total = state.pricePerHour;

  function onSubmit(values: FormData) {
    // Simulate successful payment and booking creation
    const booking: Booking = {
      id: crypto.randomUUID(),
      turfId: state.turfId,
      turfName: state.turfName,
      userName: values.name,
      userEmail: values.email,
      userPhone: values.phone,
      bookingDate: state.date,
      startTime: state.time,
      endTime: `${parseInt(state.time.split(':')[0]) + 1}:00`.padStart(5, '0'),
      totalAmount: total,
      paymentStatus: 'completed',
      bookingStatus: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('bookings') || '[]');
    existing.unshift(booking);
    localStorage.setItem('bookings', JSON.stringify(existing));

    toast({ title: 'Booking confirmed', description: `${state.turfName} on ${state.date} at ${state.time}` });
    navigate('/profile');
  }

  return (
    <main className="container py-8">
      <Helmet>
        <title>Confirm Booking | TMS</title>
        <meta name="description" content="Confirm booking details and complete payment." />
        <link rel="canonical" href="/booking" />
      </Helmet>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input {...register('email')} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <Input {...register('phone')} />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
            </div>
            <Button type="submit" variant="hero" className="w-full">Pay & Confirm (Stub)</Button>
          </form>
        </div>

        <div className="card-elevated p-6">
          <h2 className="mb-4 text-lg font-semibold">Booking summary</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between"><span>Turf</span><span>{state.turfName}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{state.date}</span></div>
            <div className="flex justify-between"><span>Time</span><span>{state.time} - {(parseInt(state.time.split(':')[0]) + 1).toString().padStart(2,'0')}:00</span></div>
            <div className="mt-2 flex justify-between font-medium"><span>Total</span><span>{formatCurrencyINR(total)}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
