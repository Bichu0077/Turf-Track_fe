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
import { getMyBookings, cancelBooking, payLater, verifyPayment } from "@/hooks/useBooking";
import { CancellationDialog } from "@/components/booking/CancellationDialog";
import { canCancelBooking, initiatePayment, validateRazorpayConfig } from "@/lib/razorpay";
import { toast } from "sonner";
import type { Booking, RazorpayResponse } from "@/types";
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
  CreditCard,
  Banknote,
  RefreshCw
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
  doc.text('Payment Method:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.paymentMethod === 'cash' ? 'Pay at Turf' : 'Online Payment'}`, 60, y);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Payment Status:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.paymentStatus}`, 60, y);
  y += 8;
  doc.setFont(undefined, 'bold');
  doc.text('Booking Status:', 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(`${booking.bookingStatus}`, 60, y);
  y += 8;

  // Add cancellation details if cancelled
  if (booking.bookingStatus === 'cancelled') {
    y += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Cancellation Details:', 20, y);
    y += 8;
    if (booking.cancelledAt) {
      doc.setFont(undefined, 'bold');
      doc.text('Cancelled At:', 20, y);
      doc.setFont(undefined, 'normal');
      doc.text(`${format(parseISO(booking.cancelledAt), 'dd/MM/yyyy HH:mm')}`, 60, y);
      y += 8;
    }
    if (booking.refundAmount !== undefined) {
      doc.setFont(undefined, 'bold');
      doc.text('Refund Amount:', 20, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(booking.refundAmount > 0 ? 22 : 220, booking.refundAmount > 0 ? 163 : 38, booking.refundAmount > 0 ? 74 : 38);
      doc.text(`${formatINRForPDF(booking.refundAmount)}`, 60, y);
      doc.setTextColor(0,0,0);
      y += 8;
    }
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for booking with TurfTrack!', 20, y + 10);

  doc.save(`TurfTrack-Receipt-${booking.id}.pdf`);
}

export default function UserBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellationDialog, setCancellationDialog] = useState<{
    open: boolean;
    booking: Booking | null;
  }>({ open: false, booking: null });
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('[UserBookingsPage] Component mounted, starting to load bookings...');
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      console.log('[UserBookingsPage] loadBookings called');
      setLoading(true);
      console.log('[UserBookingsPage] About to call getMyBookings...');
      const data = await getMyBookings();
      console.log('[UserBookingsPage] getMyBookings returned:', data);
      setBookings(data);
    } catch (e) {
      console.error('[UserBookingsPage] Error loading bookings:', e);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (reason: string) => {
    if (!cancellationDialog.booking) return;
    
    const bookingId = cancellationDialog.booking.id;
    setProcessingActions(prev => new Set(prev).add(bookingId));

    try {
      await cancelBooking({ bookingId, reason });
      toast.success("Booking cancelled successfully");
      await loadBookings(); // Reload bookings
    } catch (error) {
      toast.error("Failed to cancel booking");
      console.error("Cancellation error:", error);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
      setCancellationDialog({ open: false, booking: null });
    }
  };

  const handlePayLater = async (booking: Booking) => {
    if (!validateRazorpayConfig()) {
      toast.error("Online payment is currently unavailable");
      return;
    }

    const bookingId = booking.id;
    setProcessingActions(prev => new Set(prev).add(bookingId));

    try {
      // Create payment order
      const paymentDetails = await payLater(bookingId);

      // Initiate Razorpay payment
      await initiatePayment(
        paymentDetails,
        async (response: RazorpayResponse) => {
          // Payment successful, verify on backend
          try {
            await verifyPayment({
              bookingId,
              razorpayResponse: response,
            });
            
            toast.success('Payment successful! Your booking payment is now completed.');
            await loadBookings(); // Reload bookings to update status
          } catch (error) {
            toast.error('Payment verification failed. Please contact support.');
            console.error('Payment verification error:', error);
          }
        },
        (error: Error) => {
          // Payment failed or cancelled
          toast.error(error.message || 'Payment failed. Please try again.');
          console.error('Payment error:', error);
        }
      );
    } catch (error) {
      toast.error('Failed to initiate payment. Please try again.');
      console.error('Payment initiation error:', error);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const handlePayNow = async (booking: Booking) => {
    if (!validateRazorpayConfig()) {
      toast.error("Online payment is currently unavailable");
      return;
    }

    const bookingId = booking.id;
    setProcessingActions(prev => new Set(prev).add(bookingId));

    try {
      // For tentative or pending online bookings, initiate payment directly
      const paymentDetails = {
        orderId: booking.razorpayOrderId || '',
        amount: booking.totalAmount,
        currency: 'INR',
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        name: 'Turf Track',
        description: `Payment for ${booking.turfName}`,
        prefill: {
          name: booking.userName,
          email: booking.userEmail,
          contact: booking.userPhone || '',
        },
        theme: {
          color: '#16a34a',
        },
      };

      // If no order ID, create a new payment order
      if (!booking.razorpayOrderId) {
        const newPaymentDetails = await payLater(bookingId);
        paymentDetails.orderId = newPaymentDetails.orderId;
      }

      // Initiate Razorpay payment
      await initiatePayment(
        paymentDetails,
        async (response: RazorpayResponse) => {
          // Payment successful, verify on backend
          try {
            await verifyPayment({
              bookingId,
              razorpayResponse: response,
            });
            
            toast.success('Payment successful! Your booking is now confirmed.');
            await loadBookings(); // Reload bookings to update status
          } catch (error) {
            toast.error('Payment verification failed. Please contact support.');
            console.error('Payment verification error:', error);
          }
        },
        (error: Error) => {
          // Payment failed or cancelled
          toast.error(error.message || 'Payment failed. Please try again.');
          console.error('Payment error:', error);
        }
      );
    } catch (error) {
      toast.error('Failed to initiate payment. Please try again.');
      console.error('Payment initiation error:', error);
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

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
      // Include tentative bookings in upcoming so users can complete payment
      if (isFuture(bookingDate) || (isToday(bookingDate) && (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'tentative'))) {
        const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.startTime}`);
        if (startDateTime > now || booking.bookingStatus === 'tentative') {
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
      case 'tentative': return <AlertCircle className="w-4 h-4 text-amber-600" />;
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
    try {
      const bookingDate = parseISO(booking.bookingDate);
      if (!isToday(bookingDate) || booking.bookingStatus !== 'confirmed') return false;
      
      const now = new Date();
      
      // Handle both HH:mm and HH:mm:ss time formats
      const cleanStartTime = booking.startTime.split(':').slice(0, 2).join(':');
      const cleanEndTime = booking.endTime.split(':').slice(0, 2).join(':');
      
      const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${cleanStartTime}:00`);
      const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${cleanEndTime}:00`);
      
      return now >= startDateTime && now <= endDateTime;
    } catch (error) {
      console.error('Error in isCurrentlyActive:', error);
      return false;
    }
  };

  const getTimeUntilBooking = (booking: Booking) => {
    try {
      const now = new Date();
      const bookingDate = parseISO(booking.bookingDate);
      
      // Handle both HH:mm and HH:mm:ss time formats
      const cleanStartTime = booking.startTime.split(':').slice(0, 2).join(':');
      const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${cleanStartTime}:00`);
      
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
    } catch (error) {
      console.error('Error in getTimeUntilBooking:', error);
      return 'Invalid time';
    }
  };

  // User-friendly booking card component
  const BookingCard = ({ booking, showCountdown = false }: { booking: Booking, showCountdown?: boolean }) => {
    const isProcessing = processingActions.has(booking.id);
    const canPayLater = booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && booking.bookingStatus === 'confirmed';
    const canPayNow = booking.paymentMethod === 'online' && booking.paymentStatus === 'pending' && (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'tentative');
    
    // Safe date parsing to avoid Invalid Date errors
    let isInFuture = false;
    let showCancelButton = false;
    
    try {
      if (booking.bookingDate && booking.startTime) {
        // Handle both HH:mm and HH:mm:ss time formats
        const cleanStartTime = booking.startTime.split(':').slice(0, 2).join(':');
        const bookingDateTime = new Date(`${booking.bookingDate}T${cleanStartTime}:00`);
        
        if (!isNaN(bookingDateTime.getTime())) {
          isInFuture = bookingDateTime > new Date();
          // Show cancel button ONLY for future bookings that are confirmed or tentative
          showCancelButton = isInFuture && (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'tentative');
        }
      }
    } catch (error) {
      console.error('Error parsing booking date/time:', error);
    }

    return (
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
                  {booking.bookingStatus === 'cancelled' && (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      CANCELLED
                    </Badge>
                  )}
                  {booking.bookingStatus === 'tentative' && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      PAYMENT PENDING
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
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getPaymentStatusColor(booking.paymentStatus) as "default" | "secondary" | "destructive" | "outline"}>
                    <CreditCard className="w-3 h-3 mr-1" />
                    {booking.paymentStatus}
                  </Badge>
                  {booking.paymentMethod && (
                    <Badge variant="outline" className="text-xs">
                      {booking.paymentMethod === 'cash' ? (
                        <>
                          <Banknote className="w-3 h-3 mr-1" />
                          Pay at Turf
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3 h-3 mr-1" />
                          Online
                        </>
                      )}
                    </Badge>
                  )}
                </div>
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
              {showCountdown && !isCurrentlyActive(booking) && booking.bookingStatus === 'confirmed' && (
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

              {/* Cancellation info */}
              {booking.bookingStatus === 'cancelled' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Booking Cancelled
                        {booking.cancelledAt && ` on ${format(parseISO(booking.cancelledAt), 'dd/MM/yyyy')}`}
                      </span>
                    </div>
                    {booking.refundAmount !== undefined && (
                      <div className="text-sm text-red-700">
                        Refund Amount: <span className="font-medium">{formatCurrencyINR(booking.refundAmount)}</span>
                      </div>
                    )}
                    {booking.cancellationReason && (
                      <div className="text-sm text-red-700">
                        Reason: {booking.cancellationReason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment pending info */}
              {booking.paymentStatus === 'pending' && (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'tentative') && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {booking.bookingStatus === 'tentative' 
                        ? 'This booking is tentative. Please complete payment to confirm your booking.'
                        : `Payment pending - Please pay ${booking.paymentMethod === 'cash' ? 'cash at the turf' : 'online'}`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => downloadReceipt(booking)}
                className="flex-1 min-w-0"
                disabled={isProcessing}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              
              {canPayLater && validateRazorpayConfig() && (
                <Button 
                  variant="default"
                  onClick={() => handlePayLater(booking)}
                  disabled={isProcessing}
                  className="flex-1 min-w-0"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Online Now
                    </>
                  )}
                </Button>
              )}
              
              {canPayNow && validateRazorpayConfig() && (
                <Button 
                  variant="default"
                  onClick={() => handlePayNow(booking)}
                  disabled={isProcessing}
                  className="flex-1 min-w-0"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Complete Payment
                    </>
                  )}
                </Button>
              )}
              
              {showCancelButton && (
                <Button 
                  variant="destructive"
                  onClick={() => setCancellationDialog({ open: true, booking })}
                  disabled={isProcessing}
                  className="flex-1 min-w-0"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>

            {/* Booking ID */}
            <div className="text-xs text-muted-foreground">
              Booking ID: <span className="font-mono">{booking.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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

      {/* Cancellation Dialog */}
      {cancellationDialog.booking && (
        <CancellationDialog
          open={cancellationDialog.open}
          onOpenChange={(open) => setCancellationDialog({ open, booking: null })}
          booking={cancellationDialog.booking}
          onCancel={handleCancelBooking}
          isProcessing={processingActions.has(cancellationDialog.booking.id)}
        />
      )}
    </main>
  );
}
