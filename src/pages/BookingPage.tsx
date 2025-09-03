import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyINR } from "@/lib/format";
import type { Booking } from "@/types";
import { createBooking } from "@/hooks/useBooking";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

type BookingState = {
  turfId: string;
  turfName: string;
  pricePerHour: number;
  operatingHours?: { open: string; close: string };
};

export default function BookingPage() {
  const { state } = useLocation() as { state?: BookingState };
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  // Booking state
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  // Assume turf opens at 06:00 and closes at 22:00 if not provided
  const openHour = state?.operatingHours?.open ? parseInt(state.operatingHours.open.split(":")[0]) : 6;
  const closeHour = state?.operatingHours?.close ? parseInt(state.operatingHours.close.split(":")[0]) : 22;
  const hours = Array.from({length: closeHour - openHour}, (_, i) => `${(openHour + i).toString().padStart(2, '0')}:00`);

  if (!state) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-semibold">No booking data</h1>
        <p className="text-muted-foreground">Please select a turf and slot first.</p>
      </main>
    );
  }

  // Calculate total based on hours selected
  const duration = startTime && endTime ? parseInt(endTime) - parseInt(startTime) : 0;
  const total = duration > 0 ? state.pricePerHour * duration : 0;

  async function onSubmit(values: FormData) {
    if (!selectedDate || !startTime || !endTime) {
      toast({ title: 'Please select date, start time, and end time.' });
      return;
    }
    try {
      const dateStr = selectedDate.toISOString().slice(0, 10);
      const booking = await createBooking({
        turfId: state.turfId,
        date: dateStr,
        startTime,
        endTime,
        totalAmount: total,
        userName: values.name,
        userEmail: values.email,
        userPhone: values.phone,
      });
      toast({ title: 'Booking confirmed', description: `${state.turfName} on ${booking.bookingDate} from ${startTime} to ${endTime}` });
      navigate('/profile');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create booking';
      toast({ title: 'Booking failed', description: msg });
    }
  }

  return (
    <main className="container py-8">
      <Helmet>
        <title>Confirm Booking</title>
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
            <div>
              <label className="mb-1 block text-sm font-medium">Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={date => date < today}
                className="mb-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Select Time Slot</label>
              <div className="flex flex-wrap gap-2">
                {hours.map((h, idx) => {
                  const hourNum = parseInt(h);
                  const startNum = startTime ? parseInt(startTime) : null;
                  const endNum = endTime ? parseInt(endTime) : null;
                  let state: 'available' | 'selected' | 'disabled' = 'available';
                  if (startNum !== null && endNum !== null && hourNum >= startNum && hourNum < endNum) {
                    state = 'selected';
                  } else if (startNum !== null && endNum === null && hourNum < startNum) {
                    state = 'disabled';
                  } else if (startNum !== null && endNum === null && hourNum === startNum) {
                    state = 'selected';
                  }
                  return (
                    <button
                      type="button"
                      key={h}
                      className={
                        state === 'selected'
                          ? 'bg-primary text-white border-primary border rounded px-4 py-2 font-semibold'
                          : state === 'disabled'
                          ? 'bg-gray-200 text-gray-400 border border-gray-200 rounded px-4 py-2 cursor-not-allowed'
                          : 'bg-white text-primary border border-primary rounded px-4 py-2 hover:bg-primary hover:text-white transition'
                      }
                      disabled={state === 'disabled'}
                      onClick={() => {
                        if (startNum === null) {
                          setStartTime(h);
                        } else if (endNum === null) {
                          if (h === startTime) {
                            setStartTime("");
                            setEndTime("");
                          } else if (hourNum > startNum) {
                            setEndTime(h);
                          }
                        } else {
                          setStartTime("");
                          setEndTime("");
                        }
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
              {duration > 0 && (
                <div className="mt-2 text-primary font-semibold">Total: {formatCurrencyINR(total)}</div>
              )}
            </div>
            <Button type="submit" variant="hero" className="w-full mt-4" disabled={!(startTime && endTime && duration > 0)}>Pay & Confirm (Stub)</Button>
          </form>
        </div>

        <div className="card-elevated p-6">
          <h2 className="mb-4 text-lg font-semibold">Booking summary</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between"><span>Turf</span><span>{state.turfName}</span></div>
            <div className="flex justify-between"><span>Date</span><span>{selectedDate ? selectedDate.toISOString().slice(0,10) : '-'}</span></div>
            <div className="flex justify-between"><span>Time</span><span>{startTime && endTime ? `${startTime} - ${endTime}` : '-'}</span></div>
            <div className="mt-2 flex justify-between font-medium"><span>Total</span><span>{formatCurrencyINR(total)}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
