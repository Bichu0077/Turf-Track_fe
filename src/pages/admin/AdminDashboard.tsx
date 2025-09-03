import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { getAllBookings } from "@/hooks/useBooking";
import type { Booking, Turf } from "@/types";


export default function AdminDashboard() {
  const [activeTurfs, setActiveTurfs] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch turfs from DB
        const turfsData = await apiRequest<{ turfs: Turf[] }>("/api/turfs/mine");
        setActiveTurfs(Array.isArray(turfsData.turfs) ? turfsData.turfs.length : 0);
        // Fetch bookings from DB
        const allBookings: Booking[] = await getAllBookings();
  // Support both id and _id for turf IDs
  const myTurfIds = turfsData.turfs.map((t: Turf & {_id?: string}) => t.id || t._id);
  const filtered = allBookings.filter(b => myTurfIds.includes(b.turfId));
  setBookings(filtered);
      } catch {
        setActiveTurfs(0);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const totalRevenue = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0);

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
            <div className="mt-2 text-2xl font-semibold">{loading ? "..." : bookings.length}</div>
          </div>
          <div className="card-elevated p-4">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
              <div className="mt-2 text-2xl font-semibold">{loading ? "..." : totalRevenue}</div>
          </div>
          <div className="card-elevated p-4">
            <div className="text-sm text-muted-foreground">Active Turfs</div>
            <div className="mt-2 text-2xl font-semibold">
              {loading || activeTurfs === null ? "..." : activeTurfs}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
