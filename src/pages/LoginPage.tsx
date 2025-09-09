import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() { 
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormData) {
    login(values.email, values.password)
      .then(() => {
        toast({ title: 'Welcome back', description: 'Logged in successfully' });
        navigate('/');
      })
      .catch((e) => {
        toast({ title: 'Login failed', description: 'Invalid credentials', variant: 'destructive' });
      });
  }

  return (
    <main className="container py-10">
      <Helmet>
        <title>Login</title>
        <meta name="description" content="Login to manage your bookings." />
        <link rel="canonical" href="/login" />
      </Helmet>
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input {...register('email')} />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" variant="hero" className="w-full">Login</Button>
          <div className="text-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
