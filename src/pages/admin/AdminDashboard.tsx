import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { getAllBookings } from "@/hooks/useBooking";
import type { Booking, Turf } from "@/types";
import { calculateAnalytics, formatCurrency, formatPercentage, getGrowthColor, type AnalyticsData } from "@/lib/analytics";
import { BookingAnalytics } from "@/components/analytics/BookingAnalytics";
import { RealTimeAnalytics } from "@/components/analytics/RealTimeAnalytics";
import { exportAnalytics, ExportOptions } from "@/lib/export";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Clock, BarChart3, PieChart as PieChartIcon, Download } from "lucide-react";
import { format, subMonths } from "date-fns";

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
  confirmed: {
    label: "Confirmed",
    color: "hsl(var(--chart-1))",
  },
  cancelled: {
    label: "Cancelled",
    color: "hsl(var(--chart-3))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-4))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-5))",
  },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminDashboard() {
  const [activeTurfs, setActiveTurfs] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedMonthValue, setSelectedMonthValue] = useState("0");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch turfs from DB
        const turfsData = await apiRequest<{ turfs: Turf[] }>("/api/turfs/mine");
        setActiveTurfs(Array.isArray(turfsData.turfs) ? turfsData.turfs.length : 0);
        // Fetch bookings from DB
        const allBookings: Booking[] = await getAllBookings();
        // Support both id and _id for turf IDs
        const myTurfIds = turfsData.turfs.map((t: Turf & {_id?: string}) => t.id || t._id);
        const filtered = allBookings.filter(b => myTurfIds.includes(b.turfId));
        setBookings(filtered);
      } catch {
        setActiveTurfs(0);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    if (bookings.length > 0) {
      const analytics = calculateAnalytics(bookings, selectedMonth);
      setAnalyticsData(analytics);
    }
  }, [bookings, selectedMonth]);

  const handleMonthChange = (value: string) => {
    const monthsBack = parseInt(value);
    setSelectedMonthValue(value);
    setSelectedMonth(subMonths(new Date(), monthsBack));
  };

  if (loading) {
    return (
      <main className="flex">
        <AdminSidebar />
        <section className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading analytics...</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8 space-y-8">
        <Helmet>
          <title>Admin Dashboard - Analytics</title>
          <meta name="description" content="Comprehensive analytics for turf bookings, revenue, and performance metrics." />
          <link rel="canonical" href="/admin" />
        </Helmet>
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your turf business performance
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedMonthValue} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">This Month</SelectItem>
                <SelectItem value="1">Last Month</SelectItem>
                <SelectItem value="2">2 Months Ago</SelectItem>
                <SelectItem value="3">3 Months Ago</SelectItem>
                <SelectItem value="4">4 Months Ago</SelectItem>
                <SelectItem value="5">5 Months Ago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData ? formatCurrency(analyticsData.totalRevenue) : "₹0"}
              </div>
              {analyticsData && (
                <p className={`text-xs ${getGrowthColor(analyticsData.monthlyGrowth)}`}>
                  {formatPercentage(analyticsData.monthlyGrowth)} from last month
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData ? analyticsData.totalBookings.toLocaleString() : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Bookings this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Booking Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData ? formatCurrency(analyticsData.averageBookingValue) : "₹0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Per booking average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Turfs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeTurfs !== null ? activeTurfs : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Properties managed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="realtime">Live Data</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Daily Bookings & Revenue</CardTitle>
                  <CardDescription>
                    Daily performance for {format(selectedMonth, 'MMMM yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full overflow-hidden">
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <BarChart 
                        data={analyticsData?.dailyBookings || []}
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
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar yAxisId="left" dataKey="bookings" fill="var(--color-bookings)" name="Bookings" />
                        <Bar yAxisId="right" dataKey="revenue" fill="var(--color-revenue)" name="Revenue" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Top Performing Turfs</CardTitle>
                  <CardDescription>
                    By revenue this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.topTurfs?.slice(0, 5).map((turf, index) => (
                      <div key={turf.turfName} className="flex items-center">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{turf.turfName}</p>
                          <p className="text-sm text-muted-foreground">
                            {turf.bookings} bookings • {formatCurrency(turf.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status</CardTitle>
                  <CardDescription>Distribution of booking statuses</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full overflow-hidden">
                    <div className="flex justify-center">
                      <ChartContainer config={chartConfig} className="h-[180px] w-full max-w-[200px]">
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <Pie
                            data={analyticsData?.bookingStatusDistribution || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData?.bookingStatusDistribution?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [`${value} bookings`, name]}
                          />
                        </PieChart>
                      </ChartContainer>
                    </div>
                    
                    {/* Legend below the chart */}
                    <div className="mt-4 space-y-2">
                      {analyticsData?.bookingStatusDistribution?.map((entry, index) => (
                        <div key={entry.status} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium capitalize">{entry.status}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{entry.count}</span>
                            <span className="text-muted-foreground ml-1">
                              ({entry.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                  <CardDescription>Payment completion rates</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full overflow-hidden">
                    <div className="flex justify-center">
                      <ChartContainer config={chartConfig} className="h-[180px] w-full max-w-[200px]">
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <Pie
                            data={analyticsData?.paymentStatusDistribution || []}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#82ca9d"
                            dataKey="count"
                          >
                          {analyticsData?.paymentStatusDistribution?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          formatter={(value, name) => [`${value} payments`, name]}
                        />
                      </PieChart>
                      </ChartContainer>
                    </div>
                    
                    {/* Legend below the chart */}
                    <div className="mt-4 space-y-2">
                      {analyticsData?.paymentStatusDistribution?.map((entry, index) => (
                        <div key={entry.status} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium capitalize">{entry.status}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{entry.count}</span>
                            <span className="text-muted-foreground ml-1">
                              ({entry.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                  <CardDescription>Most popular booking times</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full overflow-hidden">
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart 
                        data={analyticsData?.hourlyDistribution || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          width={50}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="bookings" fill="var(--color-bookings)" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Monthly Revenue Trend</CardTitle>
                  <CardDescription>Revenue performance over the last 12 months</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full overflow-hidden">
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <AreaChart 
                        data={analyticsData?.monthlyBookings || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          width={60}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="var(--color-revenue)" 
                          fill="var(--color-revenue)" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Revenue by Turf</CardTitle>
                  <CardDescription>Revenue distribution across your turfs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.revenueByTurf?.slice(0, 8).map((turf, index) => (
                      <div key={turf.turfName} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{turf.turfName}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(turf.revenue)} ({turf.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${turf.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                  <CardDescription>Monthly booking volume over time</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full overflow-hidden">
                    <ChartContainer config={chartConfig} className="h-[400px] w-full">
                      <LineChart 
                        data={analyticsData?.monthlyBookings || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          width={60}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="bookings" 
                          stroke="var(--color-bookings)" 
                          strokeWidth={3}
                          dot={{ fill: "var(--color-bookings)" }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Performance</CardTitle>
                  <CardDescription>Week-over-week comparison for current month</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full overflow-hidden">
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart 
                        data={analyticsData?.weeklyBookings || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="week" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          width={50}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="bookings" fill="var(--color-bookings)" />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Real-time Analytics Tab */}
          <TabsContent value="realtime" className="space-y-6">
            <RealTimeAnalytics 
              bookings={bookings}
              onRefresh={() => {
                setBookings([]);
                getAllBookings()
                  .then(setBookings)
                  .catch(console.error);
              }}
            />
          </TabsContent>

          {/* Enhanced Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <BookingAnalytics 
              bookings={bookings}
              onRefresh={() => {
                setBookings([]);
                getAllBookings()
                  .then(setBookings)
                  .catch(console.error);
              }}
            />
            
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  const exportOptions: ExportOptions = {
                    includeCharts: true,
                    includeRawData: false,
                    dateRange: {
                      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      end: new Date()
                    },
                    format: 'pdf'
                  };
                  exportAnalytics(analyticsData, bookings, exportOptions);
                }}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export Analytics
              </Button>
            </div>
          </TabsContent>

        </Tabs>
      </section>
    </main>
  );
}
