import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/auth';
import { 
  Users, 
  MapPin, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Download,
  Search,
  RefreshCw,
  Send,
  DollarSign
} from 'lucide-react';

interface SuperAdminStats {
  totalBookings: number;
  todayBookings: number;
  totalRevenue: string;
  todayRevenue: string;
  activeTurfs: number;
  totalUsers: number;
  turfOwners: number;
  regularUsers: number;
}

interface SuperAdminOverview {
  stats: SuperAdminStats;
}

interface Booking {
  id: string;
  turfName: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  bookingStatus: string;
  createdAt: string;
}

interface Payment {
  id: string;
  bookingId: string;
  userName: string;
  userEmail: string;
  turfName: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

interface Turf {
  _id: string;
  name: string;
  location: { address: string; latitude?: number; longitude?: number };
  pricePerHour: number;
  ownerName: string;
  ownerEmail: string;
  ownerId: string;
  createdAt: string;
}

interface FundTransfer {
  id: string;
  turfOwnerId: string;
  turfOwnerName: string;
  turfOwnerEmail: string;
  totalEarnings: number;
  platformFee: number;
  netAmount: number;
  weekStart: string;
  weekEnd: string;
  status: 'pending' | 'transferred' | 'failed';
  transferDate?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  company: string;
  createdAt: string;
  lastSignIn: string;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fundTransfers, setFundTransfers] = useState<FundTransfer[]>([]);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Fund transfer date range
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Security check - Ensure user is superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      window.location.href = '/';
      return;
    }
    
    if (user?.role === 'superadmin') {
      loadOverview();
    }
  }, [user]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<SuperAdminOverview>('/api/superadmin/overview');
      setOverview(data);
    } catch (error) {
      console.error('Error loading super admin overview:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard overview.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      
      const data = await apiRequest<{ bookings: Booking[] }>(`/api/superadmin/bookings?${params}`);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings.",
        variant: "destructive",
      });
    }
  }, [searchTerm, statusFilter, dateFilter]);

  const loadPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const data = await apiRequest<{ payments: Payment[] }>(`/api/superadmin/payments?${params}`);
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payments.",
        variant: "destructive",
      });
    }
  }, [searchTerm]);

  const loadTurfs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const data = await apiRequest<{ turfs: Turf[] }>(`/api/superadmin/turfs?${params}`);
      setTurfs(data.turfs || []);
    } catch (error) {
      console.error('Error loading turfs:', error);
      toast({
        title: "Error",
        description: "Failed to load turfs.",
        variant: "destructive",
      });
    }
  }, [searchTerm]);

  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      
      const data = await apiRequest<{ users: User[] }>(`/api/superadmin/users?${params}`);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  }, [searchTerm, roleFilter]);

  const loadPendingTransfers = useCallback(async () => {
    try {
      const data = await apiRequest<{ transfers: any[], message?: string, debug?: any }>('/api/superadmin/pending-transfers');
      setFundTransfers(data.transfers || []);
      
      // Show debug info if available
      if (data.debug) {
        console.log('Debug info:', data.debug);
        toast({
          title: "Debug Info",
          description: `Found ${data.debug.totalBookings} total bookings, ${data.debug.paidBookings} paid bookings, ${data.debug.ownersWithTransfers} owners with transfers`,
        });
      }
      
      if (data.message) {
        toast({
          title: "Info",
          description: data.message,
        });
      }
    } catch (error: any) {
      console.error('Error loading pending transfers:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load pending transfers.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, []);

  const markOwnerAsPaid = async (ownerId: string, amount: number) => {
    try {
      setLoading(true);
      await apiRequest('/api/superadmin/mark-owner-paid', {
        method: 'POST',
        body: JSON.stringify({ ownerId, amount })
      });
      
      // Reload transfers to show updated status
      await loadPendingTransfers();
      
      toast({
        title: "Success",
        description: "Owner marked as paid successfully.",
      });
    } catch (error: any) {
      console.error('Error marking owner as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark owner as paid.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/superadmin/export/${type}`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('tms_auth') || '{}').token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `${type} data exported successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export ${type} data.`,
        variant: "destructive",
      });
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (user?.role !== 'superadmin') return;
    
    switch (activeTab) {
      case 'bookings':
        loadBookings();
        break;
      case 'payments':
        loadPayments();
        break;
      case 'turfs':
        loadTurfs();
        break;
      case 'users':
        loadUsers();
        break;
      case 'fund-transfers':
        loadPendingTransfers();
        break;
    }
  }, [activeTab, searchTerm, statusFilter, dateFilter, roleFilter, user, loadBookings, loadPayments, loadTurfs, loadUsers, loadPendingTransfers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading && activeTab === 'overview') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-red-500" />
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        </div>
        <p className="text-gray-600">Complete platform overview and management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="turfs">Turfs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="fund-transfers">Fund Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {overview && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overview.stats.totalBookings}</div>
                    <p className="text-xs text-muted-foreground">
                      +{overview.stats.todayBookings} today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{overview.stats.totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">
                      +₹{overview.stats.todayRevenue} today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Turfs</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overview.stats.activeTurfs}</div>
                    <p className="text-xs text-muted-foreground">
                      Managed by {overview.stats.turfOwners} owners
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overview.stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {overview.stats.regularUsers} users, {overview.stats.turfOwners} owners
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="tentative">Tentative</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
            />
            <Button onClick={() => exportData('bookings')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Turf</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.userName}</div>
                          <div className="text-sm text-gray-500">{booking.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.turfName}</TableCell>
                      <TableCell>
                        <div>
                          <div>{formatDate(booking.bookingDate)}</div>
                          <div className="text-sm text-gray-500">
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={booking.bookingStatus === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.bookingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                          {booking.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={() => exportData('payments')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Turf</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.userName}</div>
                          <div className="text-sm text-gray-500">{payment.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.turfName}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                          {payment.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turfs" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search turfs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={() => exportData('turfs')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turf Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Price/Hour</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turfs.map((turf) => (
                    <TableRow key={turf._id}>
                      <TableCell className="font-medium">{turf.name}</TableCell>
                      <TableCell>{turf.location.address}</TableCell>
                      <TableCell>{formatCurrency(turf.pricePerHour)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{turf.ownerName}</div>
                          <div className="text-sm text-gray-500">{turf.ownerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(turf.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="admin">Turf Owners</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => exportData('users')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Sign In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Turf Owner' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{user.lastSignIn !== 'N/A' ? formatDateTime(user.lastSignIn) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fund-transfers" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                Fund Transfers
              </h2>
              <p className="text-gray-600">View and manage payments to turf owners</p>
            </div>
            <Button 
              onClick={loadPendingTransfers} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Payments to Turf Owners</CardTitle>
              <CardDescription>
                All paid bookings that need to be paid to turf owners
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turf Owner</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Platform Fee (10%)</TableHead>
                    <TableHead>Net Amount to Pay</TableHead>
                    <TableHead>Bookings Count</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundTransfers.map((transfer, index) => (
                    <TableRow key={transfer.turfOwnerId || index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transfer.turfOwnerName}</div>
                          <div className="text-sm text-gray-500">{transfer.turfOwnerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(transfer.totalEarnings)}</TableCell>
                      <TableCell>{formatCurrency(transfer.platformFee)}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(transfer.netAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transfer.bookings?.length || 0} bookings</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => markOwnerAsPaid(transfer.turfOwnerId, transfer.netAmount)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark as Paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}