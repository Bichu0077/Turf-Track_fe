import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type ForgotPasswordData = {
  transactionId: string;
  email: string;
  devCode?: string;
};

export default function ForgotPasswordOtpPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { verifyForgotPasswordOtp, resendForgotPasswordOtp } = useAuth();
  const [forgotPasswordData, setForgotPasswordData] = useState<ForgotPasswordData | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("forgotPasswordData");
    if (!raw) {
      navigate("/forgot-password");
      return;
    }
    try {
      setForgotPasswordData(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem("forgotPasswordData");
      navigate("/forgot-password");
    }
  }, [navigate]);

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!forgotPasswordData) return;
    if (!otp.trim()) {
      toast({ 
        title: "Invalid OTP", 
        description: "Enter the OTP sent to your email.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyForgotPasswordOtp(forgotPasswordData.transactionId, otp);
      
      // Store the reset token for the next step
      sessionStorage.setItem("resetPasswordData", JSON.stringify({
        resetToken: result.resetToken,
        email: result.email
      }));

      // Clean up the old data
      sessionStorage.removeItem("forgotPasswordData");
      
      toast({ 
        title: "OTP verified", 
        description: "You can now set a new password." 
      });
      
      navigate("/reset-password");
    } catch (error: any) {
      toast({ 
        title: "Verification failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!forgotPasswordData) return;
    setLoading(true);
    try {
      await resendForgotPasswordOtp(forgotPasswordData.transactionId);
      toast({ 
        title: "OTP resent", 
        description: "Check your email for the new code." 
      });
    } catch (error: any) {
      toast({ 
        title: "Resend failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  if (!forgotPasswordData) return null;

  return (
    <main className="container py-10">
      <Helmet>
        <title>Verify Reset Code</title>
        <meta name="description" content="Verify your password reset code." />
      </Helmet>

      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Verify Reset Code</h1>
          <p className="text-sm text-muted-foreground mt-2">
            A reset code was sent to <strong>{forgotPasswordData.email}</strong>. 
            Enter it below to continue.
          </p>
        </div>

        <form onSubmit={verifyOtp} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Reset Code</label>
            <Input 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={resendOtp} 
              disabled={loading}
            >
              Resend
            </Button>
          </div>

          <div className="text-center">
            <Button 
              type="button" 
              variant="link" 
              onClick={() => navigate("/forgot-password")}
            >
              Change email address
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

