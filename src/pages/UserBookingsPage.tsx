import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { formatCurrencyINR } from "@/lib/format";
import { jsPDF } from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { getMyBookings } from "@/hooks/useBooking";
import type { Booking } from "@/types";

// TurfTrack green: #16a34a
// To embed your logo, convert logo.png to base64 PNG (data:image/png;base64,...) and paste below:
const TURFTRACK_LOGO = "/logo.png"; // <-- Paste your PNG base64 string here

function formatINRForPDF(n: number) {
  // Format as INR 1,600 (no ₹ symbol)
  return 'INR ' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function downloadReceipt(booking: Booking) {
  const doc = new jsPDF();
  // Header bar
  doc.setFillColor(22, 163, 74); // #16a34a
  doc.rect(0, 0, 210, 30, 'F');
  // Logo (if available)
  if (TURFTRACK_LOGO) {
    doc.addImage(TURFTRACK_LOGO, 'PNG', 12, 7, 16, 16);
  } else {
    // Placeholder circle logo
    doc.setFillColor(255,255,255);
    doc.circle(20, 15, 8, 'F');
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(14);
    doc.text('TT', 16.5, 19);
  }
  // TurfTrack name
  doc.setTextColor(255,255,255);
  doc.setFontSize(20);
  doc.text('TurfTrack', 40, 19);

  // Receipt title
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74);
  doc.text('Booking Receipt', 20, 42);

  // Details
  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  let y = 52;
  doc.setFont(undefined, 'bold');
  doc.text('Booking ID:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.id}`, 60, y);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Turf:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.turfName}`, 60, y);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Date:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.bookingDate}`, 60, y);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Time:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.startTime} - ${booking.endTime}`, 60, y);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Amount:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(22, 163, 74);
  doc.text(`${formatINRForPDF(booking.totalAmount)}`, 60, y);
  doc.setTextColor(0,0,0);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Status:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.bookingStatus} • Payment: ${booking.paymentStatus}`, 60, y);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for booking with TurfTrack!', 20, 120);

  doc.save(`TurfTrack-Receipt-${booking.id}.pdf`);
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
