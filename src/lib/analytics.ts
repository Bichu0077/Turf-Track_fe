// Analytics utility functions for admin dashboard
import { Booking } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval, startOfWeek, endOfWeek, subMonths, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  monthlyGrowth: number;
  topTurfs: Array<{ turfName: string; bookings: number; revenue: number }>;
  dailyBookings: Array<{ date: string; bookings: number; revenue: number }>;
  monthlyBookings: Array<{ month: string; bookings: number; revenue: number }>;
  weeklyBookings: Array<{ week: string; bookings: number; revenue: number }>;
  hourlyDistribution: Array<{ hour: string; bookings: number }>;
  bookingStatusDistribution: Array<{ status: string; count: number; percentage: number }>;
  paymentStatusDistribution: Array<{ status: string; count: number; percentage: number }>;
  revenueByTurf: Array<{ turfName: string; revenue: number; percentage: number }>;
}

export function calculateAnalytics(bookings: Booking[], selectedMonth?: Date): AnalyticsData {
  const now = new Date();
  const currentMonth = selectedMonth || now;
  const previousMonth = subMonths(currentMonth, 1);
  
  // Filter bookings based on selected month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const currentMonthBookings = bookings.filter(booking => {
    const bookingDate = parseISO(booking.bookingDate);
    return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd }) && booking.bookingStatus !== 'cancelled';
  });
  
  const previousMonthStart = startOfMonth(previousMonth);
  const previousMonthEnd = endOfMonth(previousMonth);
  
  const previousMonthBookings = bookings.filter(booking => {
    const bookingDate = parseISO(booking.bookingDate);
    return isWithinInterval(bookingDate, { start: previousMonthStart, end: previousMonthEnd }) && booking.bookingStatus !== 'cancelled';
  });

  // Basic metrics
  const totalBookings = currentMonthBookings.length;
  const totalRevenue = currentMonthBookings
    .filter(booking => booking.paymentStatus === 'completed')
    .reduce((sum, booking) => sum + booking.totalAmount, 0);
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  
  // Monthly growth calculation
  const previousTotal = previousMonthBookings.length;
  const monthlyGrowth = previousTotal > 0 ? ((totalBookings - previousTotal) / previousTotal) * 100 : 0;

  // Top turfs by bookings and revenue
  const turfStats = currentMonthBookings.reduce((acc, booking) => {
    const turfName = booking.turfName;
    if (!acc[turfName]) {
      acc[turfName] = { bookings: 0, revenue: 0 };
    }
    acc[turfName].bookings += 1;
    // Only count revenue from completed payments
    if (booking.paymentStatus === 'completed') {
      acc[turfName].revenue += booking.totalAmount;
    }
    return acc;
  }, {} as Record<string, { bookings: number; revenue: number }>);

  const topTurfs = Object.entries(turfStats)
    .map(([turfName, stats]) => ({ turfName, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Daily bookings for the month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyBookings = daysInMonth.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    
    const dayBookings = currentMonthBookings.filter(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      return isWithinInterval(bookingDate, { start: dayStart, end: dayEnd });
    });
    
    return {
      date: format(day, 'MMM dd'),
      bookings: dayBookings.length,
      revenue: dayBookings
        .filter(booking => booking.paymentStatus === 'completed')
        .reduce((sum, booking) => sum + booking.totalAmount, 0)
    };
  });

  // Monthly bookings for the last 12 months
  const monthlyBookings = Array.from({ length: 12 }, (_, i) => {
    const monthDate = subMonths(currentMonth, 11 - i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    const monthBookings = bookings.filter(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      return isWithinInterval(bookingDate, { start, end }) && booking.bookingStatus !== 'cancelled';
    });
    
    return {
      month: format(monthDate, 'MMM yyyy'),
      bookings: monthBookings.length,
      revenue: monthBookings
        .filter(booking => booking.paymentStatus === 'completed')
        .reduce((sum, booking) => sum + booking.totalAmount, 0)
    };
  });

  // Weekly bookings for the current month
  const weeksInMonth = [];
  let currentWeek = startOfWeek(monthStart);
  while (currentWeek <= monthEnd) {
    const weekEnd = endOfWeek(currentWeek);
    const weekBookings = currentMonthBookings.filter(booking => {
      const bookingDate = parseISO(booking.bookingDate);
      return isWithinInterval(bookingDate, { start: currentWeek, end: weekEnd });
    });
    
    weeksInMonth.push({
      week: `Week ${format(currentWeek, 'MMM dd')}`,
      bookings: weekBookings.length,
      revenue: weekBookings
        .filter(booking => booking.paymentStatus === 'completed')
        .reduce((sum, booking) => sum + booking.totalAmount, 0)
    });
    
    currentWeek = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  // Hourly distribution
  const hourlyStats = currentMonthBookings.reduce((acc, booking) => {
    try {
      // Handle both HH:mm and HH:mm:ss time formats
      const hour = parseInt(booking.startTime.split(':')[0]);
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      acc[hourKey] = (acc[hourKey] || 0) + 1;
      return acc;
    } catch (error) {
      console.error('Error parsing hour from booking time:', error);
      return acc;
    }
  }, {} as Record<string, number>);

  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
    const hourKey = `${i.toString().padStart(2, '0')}:00`;
    return {
      hour: hourKey,
      bookings: hourlyStats[hourKey] || 0
    };
  }).filter(item => item.bookings > 0);

  // Booking status distribution (including cancelled for complete picture)
  const allMonthBookings = bookings.filter(booking => {
    const bookingDate = parseISO(booking.bookingDate);
    return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd });
  });
  
  const statusStats = allMonthBookings.reduce((acc, booking) => {
    acc[booking.bookingStatus] = (acc[booking.bookingStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bookingStatusDistribution = Object.entries(statusStats).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: (count / allMonthBookings.length) * 100
  }));

  // Payment status distribution (exclude cancelled bookings)
  const paymentStats = currentMonthBookings.reduce((acc, booking) => {
    acc[booking.paymentStatus] = (acc[booking.paymentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paymentStatusDistribution = Object.entries(paymentStats).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: (count / totalBookings) * 100
  }));

  // Revenue by turf with percentages
  const revenueByTurf = Object.entries(turfStats)
    .map(([turfName, stats]) => ({
      turfName,
      revenue: stats.revenue,
      percentage: (stats.revenue / totalRevenue) * 100
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalBookings,
    totalRevenue,
    averageBookingValue,
    monthlyGrowth,
    topTurfs,
    dailyBookings,
    monthlyBookings,
    weeklyBookings: weeksInMonth,
    hourlyDistribution,
    bookingStatusDistribution,
    paymentStatusDistribution,
    revenueByTurf
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function getGrowthColor(growth: number): string {
  if (growth > 0) return 'text-green-600';
  if (growth < 0) return 'text-red-600';
  return 'text-gray-600';
}