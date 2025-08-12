import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminDashboard() {
  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8">
        <Helmet>
          <title>Admin Dashboard | TMS</title>
          <meta name="description" content="Overview of turfs, bookings, and revenue." />
          <link rel="canonical" href="/admin" />
        </Helmet>
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card-elevated p-4"><div className="text-sm text-muted-foreground">Total Bookings</div><div className="mt-2 text-2xl font-semibold">{JSON.parse(localStorage.getItem('bookings')||'[]').length}</div></div>
          <div className="card-elevated p-4"><div className="text-sm text-muted-foreground">Total Revenue</div><div className="mt-2 text-2xl font-semibold">₹{JSON.parse(localStorage.getItem('bookings')||'[]').reduce((s: number, b: any)=>s+b.totalAmount,0)}</div></div>
          <div className="card-elevated p-4"><div className="text-sm text-muted-foreground">Active Turfs</div><div className="mt-2 text-2xl font-semibold">2</div></div>
        </div>
      </section>
    </main>
  );
}
