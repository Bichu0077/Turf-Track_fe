import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { formatCurrencyINR } from "@/lib/format";
import { jsPDF } from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { getMyBookings } from "@/hooks/useBooking";
import type { Booking } from "@/types";

function downloadReceipt(booking: Booking) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("TMS Booking Receipt", 20, 20);
  doc.setFontSize(12);
  doc.text(`Booking ID: ${booking.id}`, 20, 32);
  doc.text(`Turf: ${booking.turfName}`, 20, 40);
  doc.text(`Date: ${booking.bookingDate}`, 20, 48);
  doc.text(`Time: ${booking.startTime} - ${booking.endTime}`, 20, 56);
  doc.text(`Amount: ${formatCurrencyINR(booking.totalAmount)}`, 20, 64);
  doc.text(`Status: ${booking.bookingStatus} • Payment: ${booking.paymentStatus}`, 20, 72);
  doc.save(`TMS-Receipt-${booking.id}.pdf`);
}

export default function UserBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyBookings();
        setBookings(data);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <main className="container py-12 max-w-2xl mx-auto">
      <Helmet>
        <title>My Bookings</title>
        <meta name="description" content="View and manage your TMS bookings, and download receipts." />
        <link rel="canonical" href="/bookings" />
      </Helmet>
      <h1 className="mb-8 text-3xl font-bold text-primary text-center">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground text-center">No bookings yet. Explore turfs to get started!</p>
      ) : (
        <div className="grid gap-6">
          {bookings.map((b) => (
            <div key={b.id} className="card-elevated p-6 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-lg text-primary">{b.turfName}</div>
                  <div className="text-sm text-muted-foreground">{b.bookingDate} • {b.startTime}-{b.endTime}</div>
                </div>
                <div className="text-base font-semibold">{formatCurrencyINR(b.totalAmount)}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => downloadReceipt(b)}>Download PDF</Button>
                </div>
              </div>
              <div className="flex gap-2 text-xs mt-2">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary">{b.bookingStatus}</span>
                <span className="px-2 py-1 rounded bg-muted text-muted-foreground">{b.paymentStatus}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
