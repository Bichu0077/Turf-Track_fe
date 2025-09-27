import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Users,
  Star,
  DollarSign,
  Activity,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { Booking } from '@/types';

interface BookingAnalyticsProps {
  bookings: Booking[];
  onRefresh?: () => void;
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green  
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function BookingAnalytics({ bookings, onRefresh }: BookingAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedTurf, setSelectedTurf] = useState('all');
  
  // Filter data based on selected period and turf
  const filteredData = useMemo(() => {
    let filtered = bookings;
    
    // Filter by date
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case '90days':
        startDate = subDays(now, 90);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        break;
      default:
        startDate = subDays(now, 30);
    }
    
    filtered = filtered.filter(booking => 
      new Date(booking.bookingDate) >= startDate
    );
    
    // Filter by turf
    if (selectedTurf !== 'all') {
      filtered = filtered.filter(booking => booking.turfName === selectedTurf);
    }
    
    return filtered;
  }, [bookings, selectedPeriod, selectedTurf]);
  
  // Get unique turfs for filter
  const turfs = useMemo(() => {
    const uniqueTurfs = Array.from(
      new Set(bookings.map(b => b.turfName).filter(Boolean))
    );
    return uniqueTurfs.map(name => ({ id: name, name }));
  }, [bookings]);
  
  // Calculate analytics
  const analytics = useMemo(() => {
    const total = filteredData.length;
    const confirmed = filteredData.filter(b => b.bookingStatus === 'confirmed').length;
    const pending = filteredData.filter(b => b.paymentStatus === 'pending').length;
    const cancelled = filteredData.filter(b => b.bookingStatus === 'cancelled').length;
    
    const totalRevenue = filteredData
      .filter(b => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const avgBookingValue = total > 0 ? totalRevenue / total : 0;
    
    // Daily bookings chart data
    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 29),
      end: now
    });
    
    const dailyData = days.map(day => {
      const dayBookings = filteredData.filter(b => 
        format(new Date(b.bookingDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      
      return {
        date: format(day, 'MMM dd'),
        bookings: dayBookings.length,
        revenue: dayBookings
          .filter(b => b.paymentStatus === 'completed')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      };
    });
    
    // Hourly distribution
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourBookings = filteredData.filter(b => {
        const bookingHour = parseInt(b.startTime.split(':')[0]);
        return bookingHour === hour;
      }).length;
      
      return {
        hour: `${hour}:00`,
        bookings: hourBookings,
        label: hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`
      };
    });
    
    // Status distribution for pie chart
    const statusData = [
      { name: 'Confirmed', value: confirmed, color: COLORS[1] },
      { name: 'Pending', value: pending, color: COLORS[2] },
      { name: 'Cancelled', value: cancelled, color: COLORS[3] }
    ].filter(item => item.value > 0);
    
    // Turf performance
    const turfPerformance = turfs.map(turf => {
      const turfBookings = filteredData.filter(b => b.turfName === turf.name);
      const turfRevenue = turfBookings
        .filter(b => b.paymentStatus === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      return {
        name: turf.name,
        bookings: turfBookings.length,
        revenue: turfRevenue,
        avgValue: turfBookings.length > 0 ? turfRevenue / turfBookings.length : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);
    
    return {
      total,
      confirmed,
      pending,
      cancelled,
      totalRevenue,
      avgBookingValue,
      dailyData,
      hourlyData,
      statusData,
      turfPerformance,
      confirmationRate: total > 0 ? (confirmed / total) * 100 : 0,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0
    };
  }, [filteredData, turfs]);
  
  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Analytics</h2>
          <p className="text-gray-600">
            Comprehensive insights into your booking performance
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedTurf} onValueChange={setSelectedTurf}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Turfs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Turfs</SelectItem>
              {turfs.map(turf => (
                <SelectItem key={turf.id} value={turf.name}>
                  {turf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{analytics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmation Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.confirmationRate.toFixed(1)}%
                </p>
              </div>
              <div className={cn(
                "p-3 rounded-full",
                analytics.confirmationRate >= 70 ? "bg-green-100" : "bg-yellow-100"
              )}>
                <TrendingUp className={cn(
                  "w-6 h-6",
                  analytics.confirmationRate >= 70 ? "text-green-600" : "text-yellow-600"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{analytics.avgBookingValue.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Booking Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Turf Performance</TabsTrigger>
          <TabsTrigger value="insights">Advanced Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Bookings Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Daily Booking Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart 
                      data={analytics.dailyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        yAxisId="left" 
                        tick={{ fontSize: 12 }}
                        width={60}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 12 }}
                        width={60}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? `₹${value}` : value,
                          name === 'revenue' ? 'Revenue' : 'Bookings'
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="bookings"
                        fill="#3B82F6"
                        stroke="#3B82F6"
                        fillOpacity={0.3}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={3}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Hourly Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Peak Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={analytics.hourlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="label"
                        interval={2}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        width={50}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar 
                        dataKey="bookings" 
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full overflow-hidden flex justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Pie
                        data={analytics.statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={Math.min(120, 80)}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {analytics.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ccc',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{analytics.confirmed}</span>
                    <Badge variant="secondary">
                      {analytics.confirmationRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{analytics.pending}</span>
                    <Badge variant="outline">
                      {((analytics.pending / analytics.total) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{analytics.cancelled}</span>
                    <Badge variant="destructive">
                      {analytics.cancellationRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Bookings</span>
                  <span className="text-xl font-bold">{analytics.total}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Turf Performance Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.turfPerformance.slice(0, 10).map((turf, index) => (
                  <div key={turf.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white",
                        index === 0 ? "bg-yellow-500" :
                        index === 1 ? "bg-gray-400" :
                        index === 2 ? "bg-orange-600" : "bg-blue-500"
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{turf.name}</h4>
                        <p className="text-sm text-gray-600">
                          {turf.bookings} bookings • ₹{turf.avgValue.toFixed(0)} avg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{turf.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.confirmationRate >= 80 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">Excellent Confirmation Rate</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your {analytics.confirmationRate.toFixed(1)}% confirmation rate is outstanding!
                    </p>
                  </div>
                )}
                
                {analytics.cancellationRate > 20 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium">High Cancellation Rate</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Consider reviewing booking policies to reduce {analytics.cancellationRate.toFixed(1)}% cancellation rate.
                    </p>
                  </div>
                )}
                
                {analytics.turfPerformance.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Star className="w-4 h-4" />
                      <span className="font-medium">Top Performer</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {analytics.turfPerformance[0]?.name} is your best performing turf with ₹{analytics.turfPerformance[0]?.revenue.toLocaleString()} revenue.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const peakHour = analytics.hourlyData.reduce((max, curr) => 
                    curr.bookings > max.bookings ? curr : max
                  );
                  
                  const lowHours = analytics.hourlyData
                    .filter(h => h.bookings === 0)
                    .map(h => h.label);
                  
                  return (
                    <div className="space-y-4">
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-800">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">Peak Hour</span>
                        </div>
                        <p className="text-sm text-purple-700 mt-1">
                          Most bookings occur at {peakHour.label} with {peakHour.bookings} bookings.
                        </p>
                      </div>
                      
                      {lowHours.length > 0 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-800">
                            <Activity className="w-4 h-4" />
                            <span className="font-medium">Optimization Opportunity</span>
                          </div>
                          <p className="text-sm text-orange-700 mt-1">
                            Consider promotional offers during low-traffic hours: {lowHours.slice(0, 3).join(', ')}.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}