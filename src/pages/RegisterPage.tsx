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

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).default("user"),
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

  useEffect(() => {
    if (!debouncedEmail || errors.email) {
      setEmailAvailable(null);
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
  }, [debouncedEmail, errors.email]);

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
                emailAvailable === true ? "pr-9 border-green-500" : emailAvailable === false ? "pr-9 border-red-500" : undefined
              } />
              {checkingEmail && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">…</span>
              )}
              {!checkingEmail && emailAvailable === true && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600" aria-label="email available">✔</span>
              )}
              {!checkingEmail && emailAvailable === false && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600" aria-label="email taken">✖</span>
              )}
            </div>
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            {emailAvailable === false && !errors.email && (
              <p className="text-sm text-red-600 mt-1">Account is already registered</p>
            )}
            {emailAvailable === true && !errors.email && (
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

          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select {...register("role")} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message as string}</p>}
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
            {submitting ? "Sending OTP..." : "Create account"}
          </Button>
        </form>
      </div>
    </main>
  );
}
