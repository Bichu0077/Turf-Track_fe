import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormData) {
    registerUser(values.name, values.email, values.phone, values.password, values.role)
      .then(() => {
        toast({ title: 'Account created', description: 'Welcome to TMS!' });
        navigate('/');
      })
      .catch(() => {
        toast({ title: 'Registration failed', description: 'Please try again', variant: 'destructive' });
      });
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
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select {...register('role')} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message as string}</p>}
          </div>
          <Button type="submit" variant="hero" className="w-full">Create account</Button>
        </form>
      </div>
    </main>
  );
}
