import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Users,
  TrendingUp,
  Clock,
  Zap,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Booking } from '@/types';
import { format, isToday, parseISO } from 'date-fns';

interface RealTimeAnalyticsProps {
  bookings: Booking[];
  refreshInterval?: number; // in milliseconds
  onRefresh?: () => void;
}

export function RealTimeAnalytics({ bookings, refreshInterval = 30000, onRefresh }: RealTimeAnalyticsProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  // Real-time calculations
  const todayBookings = bookings.filter(booking => {
    try {
      // Handle both date string formats
      const bookingDate = typeof booking.bookingDate === 'string' 
        ? new Date(booking.bookingDate) 
        : parseISO(booking.bookingDate);
      
      return isToday(bookingDate) && booking.bookingStatus !== 'cancelled';
    } catch (error) {
      console.error('Error parsing booking date:', error);
      return false;
    }
  });
  
  const activeBookings = todayBookings.filter(booking => {
    try {
      const now = new Date();
      const bookingDate = typeof booking.bookingDate === 'string' 
        ? new Date(booking.bookingDate) 
        : parseISO(booking.bookingDate);
      
      // Handle both HH:mm and HH:mm:ss time formats
      const cleanStartTime = booking.startTime.split(':').slice(0, 2).join(':');
      const cleanEndTime = booking.endTime.split(':').slice(0, 2).join(':');
      
      const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${cleanStartTime}:00`);
      const endDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${cleanEndTime}:00`);
      
      return now >= startDateTime && now <= endDateTime && booking.bookingStatus === 'confirmed';
    } catch (error) {
      console.error('Error calculating active bookings:', error);
      return false;
    }
  });
  
  const upcomingBookings = todayBookings.filter(booking => {
    try {
      const now = new Date();
      const bookingDate = typeof booking.bookingDate === 'string' 
        ? new Date(booking.bookingDate) 
        : parseISO(booking.bookingDate);
      
      // Handle both HH:mm and HH:mm:ss time formats
      const cleanStartTime = booking.startTime.split(':').slice(0, 2).join(':');
      const startDateTime = new Date(`${format(bookingDate, 'yyyy-MM-dd')}T${cleanStartTime}:00`);
      
      return startDateTime > now && booking.bookingStatus === 'confirmed';
    } catch (error) {
      console.error('Error calculating upcoming bookings:', error);
      return false;
    }
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  const pendingPayments = todayBookings.filter(booking => 
    booking.paymentStatus === 'pending' && booking.bookingStatus !== 'cancelled'
  );
  
  const todayRevenue = todayBookings
    .filter(booking => booking.paymentStatus === 'completed' && booking.bookingStatus !== 'cancelled')
    .reduce((sum, booking) => sum + booking.totalAmount, 0);
  
  const hourlyBookings = Array.from({ length: 24 }, (_, hour) => {
    const count = todayBookings.filter(booking => {
      try {
        // Handle both HH:mm and HH:mm:ss time formats
        const cleanStartTime = booking.startTime.split(':')[0];
        const bookingHour = parseInt(cleanStartTime);
        return bookingHour === hour && booking.bookingStatus !== 'cancelled';
      } catch (error) {
        console.error('Error parsing hour from booking time:', error);
        return false;
      }
    }).length;
    
    return { hour, count };
  });
  
  const currentHour = new Date().getHours();
  const currentHourBookings = hourlyBookings.find(h => h.hour === currentHour)?.count || 0;
  
  const nextHourBookings = hourlyBookings.find(h => h.hour === (currentHour + 1) % 24)?.count || 0;
  
  return (
    <div className="space-y-4">
      {/* Live Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
          )}></div>
          <span className="text-sm font-medium">
            {isLive ? 'Live Data' : 'Offline'}
          </span>
          <Badge variant="outline" className="text-xs">
            Updated {format(lastUpdate, 'HH:mm:ss')}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Auto-refresh every {refreshInterval / 1000}s</span>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Bookings */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Now</p>
                <p className="text-2xl font-bold text-green-900">{activeBookings.length}</p>
                <p className="text-xs text-green-600">
                  {activeBookings.length === 1 ? 'turf in use' : 'turfs in use'}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Today's Bookings */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Today's Total</p>
                <p className="text-2xl font-bold text-blue-900">{todayBookings.length}</p>
                <p className="text-xs text-blue-600">
                  +{todayBookings.filter(b => b.bookingStatus === 'confirmed').length} confirmed
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Today's Revenue */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Today's Revenue</p>
                <p className="text-2xl font-bold text-purple-900">₹{todayRevenue.toLocaleString()}</p>
                <p className="text-xs text-purple-600">
                  ₹{(todayRevenue / Math.max(todayBookings.length, 1)).toFixed(0)} avg
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Hour Activity */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">This Hour</p>
                <p className="text-2xl font-bold text-orange-900">{currentHourBookings}</p>
                <p className="text-xs text-orange-600">
                  Next hour: {nextHourBookings}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 5).map((booking, index) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.turfName}</p>
                      <p className="text-sm text-gray-600">{booking.userName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {booking.startTime} - {booking.endTime}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        ₹{booking.totalAmount}
                      </p>
                    </div>
                  </div>
                ))}
                
                {upcomingBookings.length > 5 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-600">
                      +{upcomingBookings.length - 5} more bookings today
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming bookings today</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Alerts & Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Pending Payments</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    {pendingPayments.length} booking{pendingPayments.length !== 1 ? 's' : ''} waiting for payment
                  </p>
                  <div className="mt-2 space-y-1">
                    {pendingPayments.slice(0, 3).map(booking => (
                      <div key={booking.id} className="text-xs text-yellow-600">
                        {booking.turfName} - {booking.startTime} (₹{booking.totalAmount})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeBookings.length === 0 && todayBookings.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Activity className="w-4 h-4" />
                    <span className="font-medium">No Active Sessions</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    All turfs are currently available
                  </p>
                </div>
              )}
              
              {todayBookings.length === 0 && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">No Bookings Today</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Consider promotional activities to increase bookings
                  </p>
                </div>
              )}
              
              {pendingPayments.length === 0 && activeBookings.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">All Systems Good</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    No pending issues requiring attention
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Stats Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{activeBookings.length}</p>
              <p className="text-sm text-gray-600">Active Sessions</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{upcomingBookings.length}</p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
              <p className="text-sm text-gray-600">Pending Payments</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((todayRevenue / 1000) * 10) / 10}K
              </p>
              <p className="text-sm text-gray-600">Revenue (₹)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}