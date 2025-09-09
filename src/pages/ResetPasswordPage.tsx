import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const schema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

type ResetPasswordData = {
  resetToken: string;
  email: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  });
  const [loading, setLoading] = useState(false);
  const [resetData, setResetData] = useState<ResetPasswordData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("resetPasswordData");
    if (!raw) {
      navigate("/forgot-password");
      return;
    }
    try {
      setResetData(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem("resetPasswordData");
      navigate("/forgot-password");
    }
  }, [navigate]);

  async function onSubmit(values: FormData) {
    if (!resetData) return;
    
    setLoading(true);
    try {
      await resetPassword(resetData.resetToken, values.newPassword);
      
      // Clean up the reset data
      sessionStorage.removeItem("resetPasswordData");
      
      toast({ 
        title: "Password reset successfully", 
        description: "You can now log in with your new password." 
      });
      
      navigate("/login");
    } catch (error: any) {
      toast({ 
        title: "Failed to reset password", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  if (!resetData) return null;

  return (
    <main className="container py-10">
      <Helmet>
        <title>Reset Password</title>
        <meta name="description" content="Set your new password." />
        <link rel="canonical" href="/reset-password" />
      </Helmet>
      
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your new password for <strong>{resetData.email}</strong>.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <Input 
              {...register('newPassword')} 
              type="password"
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>
            )}
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm Password</label>
            <Input 
              {...register('confirmPassword')} 
              type="password"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            variant="hero" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
          
          <div className="text-center">
            <Button 
              type="button" 
              variant="link" 
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

