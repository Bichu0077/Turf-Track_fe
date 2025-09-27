import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyINR } from "@/lib/format";
import { jsPDF } from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { getMyBookings } from "@/hooks/useBooking";
import type { Booking } from "@/types";
import { format, parseISO, isToday, isFuture, isPast, isAfter, isBefore } from "date-fns";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  History,
  Receipt,
  User,
  CreditCard
} from "lucide-react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getMyBookings();
        setBookings(data);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Categorize bookings for user perspective
  const { upcomingBookings, pastBookings, activeBookings } = useMemo(() => {
    const now = new Date();
    
    const upcoming: Booking[] = [];
    const past: Booking[] = [];
    const active: Booking[] = [];
    
    bookings.forEach(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      
      // Check if booking is currently active (happening right now)
      if (isToday(bookingDate) && booking.bookingStatus === 'confirmed') {
        const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.startTime}`);
        const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.endTime}`);
        
        if (now >= startDateTime && now <= endDateTime) {
          active.push(booking);
          return;
        }
      }
      
      // Check if booking is upcoming (future or today but not started)
      if (isFuture(bookingDate) || (isToday(bookingDate) && booking.bookingStatus === 'confirmed')) {
        const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.startTime}`);
        if (startDateTime > now) {
          upcoming.push(booking);
          return;
        }
      }
      
      // Everything else is past
      past.push(booking);
    });
    
    // Sort upcoming by date/time (earliest first)
    upcoming.sort((a, b) => {
      const dateA = parseISO(a.bookingDate);
      const dateB = parseISO(b.bookingDate);
      if (dateA.getTime() === dateB.getTime()) {
        return a.startTime.localeCompare(b.startTime);
      }
      return dateA.getTime() - dateB.getTime();
    });
    
    // Sort past by date/time (most recent first)
    past.sort((a, b) => {
      const dateA = parseISO(a.bookingDate);
      const dateB = parseISO(b.bookingDate);
      if (dateA.getTime() === dateB.getTime()) {
        return b.startTime.localeCompare(a.startTime);
      }
      return dateB.getTime() - dateA.getTime();
    });
    
    return { upcomingBookings: upcoming, pastBookings: past, activeBookings: active };
  }, [bookings]);

  // Helper functions
  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const isCurrentlyActive = (booking: Booking) => {
    const bookingDate = parseISO(booking.bookingDate);
    if (!isToday(bookingDate) || booking.bookingStatus !== 'confirmed') return false;
    
    const now = new Date();
    const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.startTime}`);
    const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.endTime}`);
    
    return now >= startDateTime && now <= endDateTime;
  };

  const getTimeUntilBooking = (booking: Booking) => {
    const now = new Date();
    const bookingDate = parseISO(booking.bookingDate);
    const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.startTime}`);
    
    const diffInHours = Math.floor((startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((startDateTime.getTime() - now.getTime()) / (1000 * 60));
        return `${diffInMinutes} minutes`;
      }
      return `${diffInHours} hours`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days`;
    }
  };

  // User-friendly booking card component
  const BookingCard = ({ booking, showCountdown = false }: { booking: Booking, showCountdown?: boolean }) => (
    <Card className={`transition-shadow hover:shadow-md ${isCurrentlyActive(booking) ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with turf name and status */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {booking.turfName}
                {isCurrentlyActive(booking) && (
                  <Badge className="bg-green-600 hover:bg-green-700">
                    <Play className="w-3 h-3 mr-1" />
                    LIVE NOW
                  </Badge>
                )}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getBookingStatusIcon(booking.bookingStatus)}
                <span className="capitalize">{booking.bookingStatus}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{formatCurrencyINR(booking.totalAmount)}</div>
              <Badge variant={getPaymentStatusColor(booking.paymentStatus) as "default" | "secondary" | "destructive" | "outline"} className="mt-1">
                <CreditCard className="w-3 h-3 mr-1" />
                {booking.paymentStatus}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Date and time details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{format(parseISO(booking.bookingDate), 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
              </div>
            </div>

            {/* Countdown for upcoming bookings */}
            {showCountdown && !isCurrentlyActive(booking) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Starts in {getTimeUntilBooking(booking)}
                  </span>
                </div>
              </div>
            )}

            {/* Live session indicator */}
            {isCurrentlyActive(booking) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Your session is live! Enjoy your game!</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => downloadReceipt(booking)}
              className="flex-1"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </div>

          {/* Booking ID */}
          <div className="text-xs text-muted-foreground">
            Booking ID: <span className="font-mono">{booking.id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="container py-8 max-w-4xl mx-auto">
      <Helmet>
        <title>My Bookings</title>
        <meta name="description" content="View and manage your TurfTrack bookings, and download receipts." />
        <link rel="canonical" href="/bookings" />
      </Helmet>
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">
          Track your turf bookings and download receipts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="w-4 h-4 text-green-600" />
              Active Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeBookings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingBookings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="w-4 h-4 text-gray-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{pastBookings.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-6 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start exploring amazing turfs and book your first session!
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Explore Turfs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming & Live ({upcomingBookings.length + activeBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Past Bookings ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {/* Active bookings first */}
            {activeBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showCountdown={false} />
            ))}
            
            {/* Then upcoming bookings */}
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showCountdown={true} />
            ))}
            
            {upcomingBookings.length === 0 && activeBookings.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No upcoming bookings</h3>
                  <p className="text-muted-foreground text-center">
                    Book a turf to see your upcoming sessions here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <History className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No past bookings</h3>
                  <p className="text-muted-foreground text-center">
                    Your completed bookings will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
