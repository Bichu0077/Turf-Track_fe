import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Booking } from "@/types";
import { useState } from "react";

export default function BookingManagementPage() {
  const bookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);

  const handleView = (booking: Booking) => {
    setSelected(booking);
    setOpen(true);
  };

  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8">
        <Helmet>
          <title>Manage Bookings</title>
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
                  <td className="p-3"><Button variant="secondary" onClick={() => handleView(b)}>View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Booking Details Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-2">
                <div><strong>Turf:</strong> {selected.turfName}</div>
                <div><strong>User:</strong> {selected.userName}</div>
                <div><strong>Email:</strong> {selected.userEmail}</div>
                <div><strong>Phone:</strong> {selected.userPhone}</div>
                <div><strong>Date:</strong> {selected.bookingDate}</div>
                <div><strong>Time:</strong> {selected.startTime} - {selected.endTime}</div>
                <div><strong>Amount:</strong> ₹{selected.totalAmount}</div>
                <div><strong>Status:</strong> {selected.bookingStatus}</div>
                <div><strong>Payment:</strong> {selected.paymentStatus}</div>
                <div><strong>Created At:</strong> {selected.createdAt}</div>
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}
