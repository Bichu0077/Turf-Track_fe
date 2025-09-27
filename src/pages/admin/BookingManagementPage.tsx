import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Booking } from "@/types";
import type { Turf } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { getAllBookings } from "@/hooks/useBooking";
import { apiRequest } from "@/lib/auth";
import { format, parseISO, isToday, isFuture, isPast, isAfter, isBefore } from "date-fns";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Search, 
  Filter,
  Eye,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users
} from "lucide-react";

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { user } = useAuth();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const handleView = (booking: Booking) => {
    setSelected(booking);
    setOpen(true);
  };

  useEffect(() => {
    (async () => {
      try {
        const allBookings = await getAllBookings();
        // Fetch turfs created by this admin
        const turfsRes = await apiRequest<{ turfs: Turf[] }>("/api/turfs/mine");
        // Support both id and _id for turf IDs
        const myTurfIds = turfsRes.turfs.map((t: Turf & {_id?: string}) => t.id || t._id);
        // Only show bookings for turfs created by this admin
        const filtered = allBookings.filter(b => myTurfIds.includes(b.turfId));
        setBookings(filtered);
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  // Filter and categorize bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.turfName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.bookingStatus === statusFilter;
      const matchesPayment = paymentFilter === "all" || booking.paymentStatus === paymentFilter;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const liveBookings = useMemo(() => {
    return filteredBookings.filter(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      const now = new Date();
      
      // Check if booking is happening right now
      if (isToday(bookingDate)) {
        const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.startTime}`);
        const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.endTime}`);
        return now >= startDateTime && now <= endDateTime && booking.bookingStatus === 'confirmed';
      }
      
      // Check if booking is upcoming (today or future)
      return (isToday(bookingDate) || isFuture(bookingDate)) && booking.bookingStatus !== 'cancelled';
    }).sort((a, b) => {
      const dateA = parseISO(a.bookingDate);
      const dateB = parseISO(b.bookingDate);
      if (dateA.getTime() === dateB.getTime()) {
        return a.startTime.localeCompare(b.startTime);
      }
      return dateA.getTime() - dateB.getTime();
    });
  }, [filteredBookings]);

  const pastBookings = useMemo(() => {
    return filteredBookings.filter(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      const now = new Date();
      
      // Check if booking is completed (past end time) or cancelled
      if (isToday(bookingDate)) {
        const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.endTime}`);
        return now > endDateTime || booking.bookingStatus === 'cancelled';
      }
      
      return isPast(bookingDate);
    }).sort((a, b) => {
      const dateA = parseISO(a.bookingDate);
      const dateB = parseISO(b.bookingDate);
      if (dateA.getTime() === dateB.getTime()) {
        return b.startTime.localeCompare(a.startTime);
      }
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredBookings]);

  // Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.bookingStatus === 'confirmed').length;
    const cancelled = bookings.filter(b => b.bookingStatus === 'cancelled').length;
    const pendingPayments = bookings.filter(b => b.paymentStatus === 'pending').length;
    const revenue = bookings
      .filter(b => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    return { total, confirmed, cancelled, pendingPayments, revenue };
  }, [bookings]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: "default",
      cancelled: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isCurrentlyActive = (booking: Booking) => {
    const bookingDate = parseISO(booking.bookingDate);
    if (!isToday(bookingDate) || booking.bookingStatus !== 'confirmed') return false;
    
    const now = new Date();
    const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.startTime}`);
    const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${booking.endTime}`);
    
    return now >= startDateTime && now <= endDateTime;
  };

  const BookingCard = ({ booking, showActiveIndicator = false }: { booking: Booking, showActiveIndicator?: boolean }) => (
    <Card className={`${isCurrentlyActive(booking) && showActiveIndicator ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{booking.turfName}</span>
              {isCurrentlyActive(booking) && showActiveIndicator && (
                <Badge variant="default" className="bg-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{booking.userName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(parseISO(booking.bookingDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{booking.startTime} - {booking.endTime}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(booking.bookingStatus)}
                {getPaymentBadge(booking.paymentStatus)}
              </div>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => handleView(booking)}>
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8 space-y-6">
        <Helmet>
          <title>Manage Bookings</title>
          <meta name="description" content="View and manage all user bookings." />
          <link rel="canonical" href="/admin/bookings" />
        </Helmet>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Booking Management</h1>
            <p className="text-muted-foreground">Monitor and manage all turf bookings</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Confirmed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">₹{stats.revenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by turf, user, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Booking Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Payment Status</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Tabs */}
        <Tabs defaultValue="live" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live & Upcoming Bookings ({liveBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Past Bookings ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {liveBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active or Upcoming Bookings</h3>
                  <p className="text-muted-foreground text-center">
                    There are no live sessions or upcoming bookings at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {liveBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} showActiveIndicator />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Past Bookings</h3>
                  <p className="text-muted-foreground text-center">
                    No completed or cancelled bookings found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced Booking Details Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-5 h-5" />
                Booking Details
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-6">
                {/* Status Indicators */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex gap-2">
                    {getStatusBadge(selected.bookingStatus)}
                    {getPaymentBadge(selected.paymentStatus)}
                    {isCurrentlyActive(selected) && (
                      <Badge variant="default" className="bg-green-600">
                        <Activity className="w-3 h-3 mr-1" />
                        CURRENTLY ACTIVE
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-primary">₹{selected.totalAmount.toLocaleString()}</div>
                </div>

                {/* Turf Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Turf Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Turf Name</label>
                      <p className="font-medium">{selected.turfName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Turf ID</label>
                      <p className="font-mono text-sm">{selected.turfId}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="font-medium">{selected.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <p className="font-medium">{selected.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                        <p className="font-medium">{selected.userPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Schedule */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Schedule Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date</label>
                      <p className="font-medium">{format(parseISO(selected.bookingDate), 'EEEE, MMMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Time Slot</label>
                      <p className="font-medium">{selected.startTime} - {selected.endTime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <p className="font-medium">
                        {(() => {
                          const start = new Date(`2000-01-01T${selected.startTime}`);
                          const end = new Date(`2000-01-01T${selected.endTime}`);
                          const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          return `${diff} hour${diff !== 1 ? 's' : ''}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="font-medium">
                        {isCurrentlyActive(selected) ? (
                          <span className="text-green-600 font-semibold">Currently Active</span>
                        ) : isFuture(parseISO(selected.bookingDate)) ? (
                          <span className="text-blue-600 font-semibold">Upcoming</span>
                        ) : (
                          <span className="text-gray-600 font-semibold">Completed</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                      <p className="font-bold text-xl">₹{selected.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                      <div className="mt-1">
                        {getPaymentBadge(selected.paymentStatus)}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-xs text-muted-foreground">Booking ID</label>
                      <p className="font-mono">{selected.id}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Created At</label>
                      <p>{format(parseISO(selected.createdAt), 'MMM dd, yyyy \'at\' hh:mm a')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              {selected && selected.paymentStatus === 'pending' && (
                <Button variant="default">
                  Follow up Payment
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}
