import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  useRegistered: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { state } = useLocation() as { state?: any };
  const navigate = useNavigate();
  const { user } = useAuth();
  const [useRegisteredEmail, setUseRegisteredEmail] = useState(false);
  const [useRegisteredPhone, setUseRegisteredPhone] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

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

  function onSubmit(values: FormData) {
    // Simulate payment and booking confirmation
    navigate("/profile");
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
          <Button type="submit" variant="hero" className="w-full">Pay & Confirm</Button>
        </form>
      </div>
    </main>
  );
}
