import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/types";

export default function BookingManagementPage() {
  const bookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');
  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8">
        <Helmet>
          <title>Manage Bookings | TMS</title>
          <meta name="description" content="View and manage all user bookings." />
          <link rel="canonical" href="/admin/bookings" />
        </Helmet>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Bookings</h1>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="p-3 text-left">Turf</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-3">{b.turfName}</td>
                  <td className="p-3">{b.userName}</td>
                  <td className="p-3">{b.bookingDate}</td>
                  <td className="p-3">{b.startTime} - {b.endTime}</td>
                  <td className="p-3">₹{b.totalAmount}</td>
                  <td className="p-3">{b.bookingStatus}</td>
                  <td className="p-3"><Button variant="secondary">View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
