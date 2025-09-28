import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ShippingPolicyPage() {
  const navigate = useNavigate();

  return (
    <main className="container py-8">
      <Helmet>
        <title>Shipping Policy - TurfTrack</title>
        <meta name="description" content="Shipping policy and delivery information for TurfTrack services." />
        <link rel="canonical" href="/shipping-policy" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Shipping Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="card-elevated p-8 space-y-6">
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Digital Service Notice</h2>
              <p className="text-muted-foreground">
                As TurfTrack is a digital platform for booking sports turfs, 
                traditional shipping policies do not apply to our core services.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-4">Service Delivery</h2>
              <p className="text-muted-foreground mb-4">
                Our primary service is providing digital booking confirmations and access to sports facilities:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Booking confirmations are delivered instantly via email</li>
                <li>SMS notifications are sent to registered mobile numbers</li>
                <li>Digital receipts are available in your account dashboard</li>
                <li>QR codes for facility access are provided immediately upon booking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Physical Items (If Applicable)</h2>
              <p className="text-muted-foreground mb-4">
                In case we offer any physical products or merchandise in the future:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Standard delivery time: 3-7 business days</li>
                <li>Express delivery: 1-2 business days (additional charges apply)</li>
                <li>Free shipping on orders above ₹999</li>
                <li>Delivery is available across major cities in India</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-muted-foreground">
                  For digital services, delivery is instant upon successful payment processing. 
                  You will receive confirmation via email and SMS within 2-3 minutes of booking.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <p className="text-muted-foreground mb-4">
                For any questions regarding our services or this policy, please contact us:
              </p>
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <p><strong>Email:</strong> support@turftrack.com</p>
                <p><strong>Phone:</strong> +91 98765 43210</p>
                <p><strong>Hours:</strong> Monday to Sunday, 9:00 AM - 9:00 PM IST</p>
              </div>
            </section>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This shipping policy is integrated with our payment processing through Razorpay 
                and complies with Indian e-commerce regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}