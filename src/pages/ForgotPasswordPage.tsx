import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { forgotPassword } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ 
    resolver: zodResolver(schema) 
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: FormData) {
    setLoading(true);
    try {
      const result = await forgotPassword(values.email);
      
      // Store the transaction details for the next step
      sessionStorage.setItem("forgotPasswordData", JSON.stringify({
        transactionId: result.transactionId,
        email: result.email,
        devCode: result.devCode
      }));

      toast({ 
        title: "Reset code sent", 
        description: `A reset code has been sent to ${values.email}` 
      });
      
      navigate("/forgot-password/verify");
    } catch (error: any) {
      toast({ 
        title: "Failed to send reset code", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-10">
      <Helmet>
        <title>Forgot Password</title>
        <meta name="description" content="Reset your password." />
        <link rel="canonical" href="/forgot-password" />
      </Helmet>
      
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your email address and we'll send you a code to reset your password.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input 
              {...register('email')} 
              type="email"
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            variant="hero" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Code"}
          </Button>
          
          <div className="text-center">
            <Link 
              to="/login" 
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

