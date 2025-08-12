import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormData) {
    localStorage.setItem('user', JSON.stringify({ name: values.name, email: values.email, phone: values.phone }));
    toast({ title: 'Account created', description: 'Welcome to TMS!' });
    navigate('/');
  }

  return (
    <main className="container py-10">
      <Helmet>
        <title>Register | TMS</title>
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
          <Button type="submit" variant="hero" className="w-full">Create account</Button>
        </form>
      </div>
    </main>
  );
}
