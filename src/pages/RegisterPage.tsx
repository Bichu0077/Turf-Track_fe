import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/auth";

/**
 * Registration Page - Security Note:
 * All user registrations are restricted to 'user' role only.
 * Admin privileges must be assigned manually via Supabase dashboard.
 */

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  role: z.enum(["user"]).default("user"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [submitting, setSubmitting] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<null | boolean>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const emailValue = watch("email");

  // Basic debounce
  const debouncedEmail = useMemo(() => emailValue, [emailValue]);

  // Validate email format live (independent of submit-time RHF validation)
  const emailFormatOk = useMemo(() => {
    const value = (debouncedEmail || '').trim();
    if (!value) return false;
    return z.string().email().safeParse(value).success;
  }, [debouncedEmail]);

  useEffect(() => {
    if (!debouncedEmail || !emailFormatOk) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }
    let ignore = false;
    const ctrl = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setCheckingEmail(true);
        const q = encodeURIComponent(debouncedEmail.trim());
        const res = await fetch(`/api/auth/email-available?email=${q}`, { signal: ctrl.signal });
        const data = await res.json().catch(() => ({}));
        if (!ignore) setEmailAvailable(Boolean(data?.available));
      } catch {
        if (!ignore) setEmailAvailable(null);
      } finally {
        if (!ignore) setCheckingEmail(false);
      }
    }, 400);
    return () => {
      ignore = true;
      ctrl.abort();
      clearTimeout(timeout);
    };
  }, [debouncedEmail, emailFormatOk]);

  async function onSubmit(values: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Registration failed",
          description: data?.message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      // server should return a transactionId (or similar) — include it in pending storage
      const pending = { ...values, transactionId: (data && data.transactionId) ? data.transactionId : undefined, email: data?.email ?? values.email };
      sessionStorage.setItem("pendingRegistration", JSON.stringify(pending));
      toast({ title: "OTP sent", description: "Check your email for the verification code." });
      navigate("/verify-otp");
    } catch (err) {
      toast({ title: "Registration failed", description: "Please try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-10">
      <Helmet>
        <title>Register</title>
        <meta name="description" content="Create your TMS account to book turfs." />
        <link rel="canonical" href="/register" />
      </Helmet>

      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Create account</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input {...register("name")} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <div className="relative">
              <Input {...register("email")} className={
                debouncedEmail && !emailFormatOk ? "pr-9 border-red-500" :
                emailAvailable === true ? "pr-9 border-green-500" :
                emailAvailable === false ? "pr-9 border-red-500" : undefined
              } />
              {checkingEmail && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">…</span>
              )}
              {!checkingEmail && emailFormatOk && emailAvailable === true && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600" aria-label="email available">✔</span>
              )}
              {!checkingEmail && (!emailFormatOk || emailAvailable === false) && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600" aria-label="email taken">✖</span>
              )}
            </div>
            {debouncedEmail && !emailFormatOk && (
              <p className="text-sm text-red-600 mt-1">Incorrect email format</p>
            )}
            {emailAvailable === false && emailFormatOk && (
              <p className="text-sm text-red-600 mt-1">Account is already registered</p>
            )}
            {emailAvailable === true && emailFormatOk && (
              <p className="text-sm text-green-600 mt-1">Email is valid</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <Input {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>

          {/* Role is automatically set to "user" - Admin privileges assigned manually via Supabase */}
          <input {...register("role")} type="hidden" value="user" />

          <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
            {submitting ? "Sending OTP..." : "Create account"}
          </Button>
          

        </form>
      </div>
    </main>
  );
}
