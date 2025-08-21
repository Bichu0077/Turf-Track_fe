import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Pending = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "user" | "admin";
  transactionId?: string;
};

export default function OtpVerifyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pending, setPending] = useState<Pending | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("pendingRegistration");
    if (!raw) {
      navigate("/register");
      return;
    }
    try {
      setPending(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem("pendingRegistration");
      navigate("/register");
    }
  }, [navigate]);

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!pending) return;
    if (!otp.trim()) {
      toast({ title: "Invalid OTP", description: "Enter the OTP sent to your email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload: any = { otp, email: pending.email };
      if (pending.transactionId) payload.transactionId = pending.transactionId;

      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Verification failed", description: data?.message || "Try again", variant: "destructive" });
        return;
      }

      sessionStorage.removeItem("pendingRegistration");
      toast({ title: "Account created", description: "You can now log in." });
      navigate("/login");
    } catch {
      toast({ title: "Verification failed", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!pending) return;
    setLoading(true);
    try {
      const payload: any = { email: pending.email };
      if (pending.transactionId) payload.transactionId = pending.transactionId;

      const res = await fetch("/api/auth/register/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Resend failed", description: data?.message || "Try again", variant: "destructive" });
        return;
      }
      toast({ title: "OTP resent", description: "Check your email." });
    } catch {
      toast({ title: "Resend failed", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (!pending) return null;

  return (
    <main className="container py-10">
      <Helmet>
        <title>Verify account</title>
        <meta name="description" content="Verify your TMS account." />
      </Helmet>

      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Verify your account</h1>
        <p className="text-sm">An OTP was sent to <strong>{pending.email}</strong>. Enter it below to complete registration.</p>

        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">OTP</label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button type="button" variant="ghost" onClick={resendOtp} disabled={loading}>
              Resend
            </Button>
          </div>

          <div>
            <Button type="button" variant="link" onClick={() => navigate("/register")}>Edit details</Button>
          </div>
        </form>
      </div>
    </main>
  );
}


