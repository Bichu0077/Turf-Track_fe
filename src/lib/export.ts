import jsPDF from 'jspdf';
import { AnalyticsData } from './analytics';
import { Booking } from '@/types';
import { format } from 'date-fns';

export interface ExportOptions {
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'csv' | 'json';
}

export function exportAnalyticsPDF(
  analyticsData: AnalyticsData, 
  bookings: Booking[], 
  options: ExportOptions
): void {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Header
  doc.setFontSize(20);
  doc.text('Turf Analytics Report', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, yPosition);
  yPosition += 10;
  
  doc.text(`Period: ${format(options.dateRange.start, 'PP')} - ${format(options.dateRange.end, 'PP')}`, 20, yPosition);
  yPosition += 20;
  
  // Key Metrics
  doc.setFontSize(16);
  doc.text('Key Performance Indicators', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  const metrics = [
    `Total Revenue: ₹${analyticsData.totalRevenue.toLocaleString()}`,
    `Total Bookings: ${analyticsData.totalBookings.toLocaleString()}`,
    `Average Booking Value: ₹${analyticsData.averageBookingValue.toFixed(0)}`,
    `Monthly Growth: ${analyticsData.monthlyGrowth >= 0 ? '+' : ''}${analyticsData.monthlyGrowth.toFixed(1)}%`,
  ];
  
  metrics.forEach(metric => {
    doc.text(metric, 20, yPosition);
    yPosition += 8;
  });
  
  yPosition += 10;
  
  // Top Performing Turfs
  doc.setFontSize(16);
  doc.text('Top Performing Turfs', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  analyticsData.topTurfs.slice(0, 5).forEach((turf, index) => {
    doc.text(
      `${index + 1}. ${turf.turfName} - ${turf.bookings} bookings, ₹${turf.revenue.toLocaleString()}`,
      25,
      yPosition
    );
    yPosition += 8;
  });
  
  // Add new page if needed
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Booking Status Distribution
  yPosition += 15;
  doc.setFontSize(16);
  doc.text('Booking Status Distribution', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  analyticsData.bookingStatusDistribution.forEach(status => {
    doc.text(
      `${status.status}: ${status.count} (${status.percentage.toFixed(1)}%)`,
      25,
      yPosition
    );
    yPosition += 8;
  });
  
  // Payment Status Distribution
  yPosition += 15;
  doc.setFontSize(16);
  doc.text('Payment Status Distribution', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  analyticsData.paymentStatusDistribution.forEach(status => {
    doc.text(
      `${status.status}: ${status.count} (${status.percentage.toFixed(1)}%)`,
      25,
      yPosition
    );
    yPosition += 8;
  });
  
  // Revenue by Turf
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }
  
  yPosition += 15;
  doc.setFontSize(16);
  doc.text('Revenue by Turf', 20, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  analyticsData.revenueByTurf.slice(0, 10).forEach(turf => {
    doc.text(
      `${turf.turfName}: ₹${turf.revenue.toLocaleString()} (${turf.percentage.toFixed(1)}%)`,
      25,
      yPosition
    );
    yPosition += 8;
  });
  
  // Save the PDF
  doc.save(`turf-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportAnalyticsCSV(
  analyticsData: AnalyticsData,
  bookings: Booking[],
  options: ExportOptions
): void {
  const csvData = [];
  
  // Header
  csvData.push(['Turf Analytics Report']);
  csvData.push(['Generated on:', format(new Date(), 'PPP')]);
  csvData.push(['Period:', `${format(options.dateRange.start, 'PP')} - ${format(options.dateRange.end, 'PP')}`]);
  csvData.push([]);
  
  // Key metrics
  csvData.push(['Key Metrics']);
  csvData.push(['Metric', 'Value']);
  csvData.push(['Total Revenue', `₹${analyticsData.totalRevenue.toLocaleString()}`]);
  csvData.push(['Total Bookings', analyticsData.totalBookings.toString()]);
  csvData.push(['Average Booking Value', `₹${analyticsData.averageBookingValue.toFixed(0)}`]);
  csvData.push(['Monthly Growth', `${analyticsData.monthlyGrowth.toFixed(1)}%`]);
  csvData.push([]);
  
  // Daily bookings
  csvData.push(['Daily Performance']);
  csvData.push(['Date', 'Bookings', 'Revenue']);
  analyticsData.dailyBookings.forEach(day => {
    csvData.push([day.date, day.bookings.toString(), `₹${day.revenue.toLocaleString()}`]);
  });
  csvData.push([]);
  
  // Top turfs
  csvData.push(['Top Performing Turfs']);
  csvData.push(['Rank', 'Turf Name', 'Bookings', 'Revenue']);
  analyticsData.topTurfs.forEach((turf, index) => {
    csvData.push([
      (index + 1).toString(),
      turf.turfName,
      turf.bookings.toString(),
      `₹${turf.revenue.toLocaleString()}`
    ]);
  });
  csvData.push([]);
  
  // Hourly distribution
  csvData.push(['Hourly Booking Distribution']);
  csvData.push(['Hour', 'Bookings']);
  analyticsData.hourlyDistribution.forEach(hour => {
    csvData.push([hour.hour, hour.bookings.toString()]);
  });
  
  // Convert to CSV format
  const csvContent = csvData.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
  
  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `turf-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function exportAnalyticsJSON(
  analyticsData: AnalyticsData,
  bookings: Booking[],
  options: ExportOptions
): void {
  const exportData = {
    metadata: {
      generatedOn: new Date().toISOString(),
      period: {
        start: options.dateRange.start.toISOString(),
        end: options.dateRange.end.toISOString()
      },
      includeRawData: options.includeRawData
    },
    analytics: analyticsData,
    ...(options.includeRawData && { rawBookings: bookings })
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `turf-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function exportAnalytics(
  analyticsData: AnalyticsData,
  bookings: Booking[],
  options: ExportOptions
): void {
  switch (options.format) {
    case 'pdf':
      exportAnalyticsPDF(analyticsData, bookings, options);
      break;
    case 'csv':
      exportAnalyticsCSV(analyticsData, bookings, options);
      break;
    case 'json':
      exportAnalyticsJSON(analyticsData, bookings, options);
      break;
    default:
      throw new Error('Unsupported export format');
  }
}