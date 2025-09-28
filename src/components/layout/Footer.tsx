import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <img src="/favicon.ico" alt="" className="h-full w-full object-contain" />
              </span>
              <span className="font-semibold text-lg">TurfTrack</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              Discover, compare, and book premium sports turf slots near you. 
              Real-time availability, transparent pricing, and seamless booking experience.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> mrturfer100@gmail.com</p>
              <p><strong>Phone:</strong> +91 99473 59758</p>
              <p><strong>Hours:</strong> 9:00 AM - 9:00 PM (7 days)</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/bookings" className="block text-muted-foreground hover:text-foreground transition-colors">
                My Bookings
              </Link>
              <Link to="/profile" className="block text-muted-foreground hover:text-foreground transition-colors">
                Profile
              </Link>
              <Link to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
            </div>
          </div>

          {/* Legal & Policies */}
          <div>
            <h3 className="font-semibold mb-4">Legal & Policies</h3>
            <div className="space-y-2">
              <Link 
                to="https://merchant.razorpay.com/policy/R79q4kLa6kKUWD/terms" 
                target="_blank"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link 
                to="https://merchant.razorpay.com/policy/R79q4kLa6kKUWD/refund" 
                target="_blank"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancellation & Refunds
              </Link>
              <Link 
                to="https://merchant.razorpay.com/policy/R79q4kLa6kKUWD/shipping" 
                target="_blank"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Shipping Policy
              </Link>
              <Link 
                to="https://merchant.razorpay.com/policy/R79q4kLa6kKUWD/privacy" 
                target="_blank"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>

              <Link 
                to="https://merchant.razorpay.com/policy/R79q4kLa6kKUWD/contact_us" 
                target="_blank"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} TurfTrack. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}