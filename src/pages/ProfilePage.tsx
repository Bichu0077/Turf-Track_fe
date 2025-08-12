import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { formatCurrencyINR } from "@/lib/format";
import { jsPDF } from "jspdf";
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

export default function ProfilePage() {
  const bookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');

  return (
    <main className="container py-10">
      <Helmet>
        <title>My Bookings | TMS</title>
        <meta name="description" content="View and manage your TMS bookings, and download receipts." />
        <link rel="canonical" href="/profile" />
      </Helmet>

      <h1 className="mb-6 text-2xl font-semibold">My bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings yet. Explore turfs to get started!</p>
      ) : (
        <div className="grid gap-4">
          {bookings.map((b) => (
            <div key={b.id} className="card-elevated p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{b.turfName}</div>
                  <div className="text-sm text-muted-foreground">{b.bookingDate} • {b.startTime}-{b.endTime}</div>
                </div>
                <div className="text-sm font-medium">{formatCurrencyINR(b.totalAmount)}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => downloadReceipt(b)}>Download PDF</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
