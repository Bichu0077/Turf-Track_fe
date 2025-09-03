import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useEffect, useState } from "react";
import { getAllBookings } from "@/hooks/useBooking";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import type { Turf } from "@/types";
import type { Booking } from "@/types";

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();
  useEffect(() => {
    (async () => {
      try {
        const allBookings = await getAllBookings();
  const turfsRes = await apiRequest<{ turfs: Turf[] }>("/api/turfs/mine");
  // Support both id and _id for turf IDs
  const myTurfIds = turfsRes.turfs.map((t: Turf & {_id?: string}) => t.id || t._id);
  const filtered = allBookings.filter(b => myTurfIds.includes(b.turfId));
  setBookings(filtered);
      } catch {
        setBookings([]);
      }
    })();
  }, [user]);
  const totalRevenue = bookings.reduce((s: number, b: Booking) => s + (b.totalAmount || 0), 0);
  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8">
        <Helmet>
          <title>Reports</title>
          <meta name="description" content="Revenue and booking insights." />
          <link rel="canonical" href="/admin/reports" />
        </Helmet>
        <h1 className="mb-6 text-2xl font-semibold">Reports</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card-elevated p-4"><div className="text-sm text-muted-foreground">Total Revenue</div><div className="mt-2 text-2xl font-semibold">₹{totalRevenue}</div></div>
          <div className="card-elevated p-4"><div className="text-sm text-muted-foreground">Total Bookings</div><div className="mt-2 text-2xl font-semibold">{bookings.length}</div></div>
          <div className="card-elevated p-4"><div className="text-sm text-muted-foreground">Avg. Order Value</div><div className="mt-2 text-2xl font-semibold">₹{bookings.length ? Math.round(totalRevenue / bookings.length) : 0}</div></div>
        </div>
      </section>
    </main>
  );
}
