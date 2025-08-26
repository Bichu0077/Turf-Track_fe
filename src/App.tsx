import { Helmet, HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TurfDetailPage from "./pages/TurfDetailPage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OtpVerifyPage from "./pages/OtpVerifyPage";
import ProfilePage from "./pages/ProfilePage";
import UserBookingsPage from "./pages/UserBookingsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TurfManagementPage from "./pages/admin/TurfManagementPage";
import BookingManagementPage from "./pages/admin/BookingManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import CheckoutPage from "./pages/CheckoutPage";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Helmet>
          <title>Turf Management System (TMS)</title>
          <meta name="description" content="Book sports turfs by the hour. Smart scheduling, secure payments, and admin dashboard." />
          <link rel="canonical" href="/" />
        </Helmet>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/turfs/:id" element={<TurfDetailPage />} />
              <Route path="/booking" element={<BookingPage />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<OtpVerifyPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              <Route element={<ProtectedRoute roles={["user", "admin"]} />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/bookings" element={<UserBookingsPage />} />
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute roles={["admin"]} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/turfs" element={<TurfManagementPage />} />
                <Route path="/admin/bookings" element={<BookingManagementPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
