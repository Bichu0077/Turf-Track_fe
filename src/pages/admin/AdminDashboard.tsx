import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";


export default function AdminDashboard() {
  const { token } = useAuth();
  const [activeTurfs, setActiveTurfs] = useState<number | null>(null);

  useEffect(() => {
    async function fetchTurfs() {
      try {
        const res = await fetch("/api/turfs/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch turfs");
        const data = await res.json();
        setActiveTurfs(Array.isArray(data.turfs) ? data.turfs.length : 0);
      } catch {
        setActiveTurfs(0);
      }
    }
    if (token) fetchTurfs();
  }, [token]);

  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8">
        <Helmet>
          <title>Admin Dashboard</title>
          <meta name="description" content="Overview of turfs, bookings, and revenue." />
          <link rel="canonical" href="/admin" />
        </Helmet>
        <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card-elevated p-4">
            <div className="text-sm text-muted-foreground">Total Bookings</div>
            <div className="mt-2 text-2xl font-semibold">{JSON.parse(localStorage.getItem('bookings')||'[]').length}</div>
          </div>
          <div className="card-elevated p-4">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="mt-2 text-2xl font-semibold">₹{JSON.parse(localStorage.getItem('bookings')||'[]').reduce((s: number, b: any)=>s+b.totalAmount,0)}</div>
          </div>
          <div className="card-elevated p-4">
            <div className="text-sm text-muted-foreground">Active Turfs</div>
            <div className="mt-2 text-2xl font-semibold">
              {activeTurfs === null ? "..." : activeTurfs}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
