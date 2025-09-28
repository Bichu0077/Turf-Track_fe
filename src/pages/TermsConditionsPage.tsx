import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsConditionsPage() {
  const navigate = useNavigate();

  return (
    <main className="container py-8">
      <Helmet>
        <title>Terms and Conditions - TurfTrack</title>
        <meta name="description" content="Terms and conditions for using TurfTrack platform services." />
        <link rel="canonical" href="/terms-conditions" />
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
          <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="card-elevated p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using TurfTrack ("the Platform"), you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Platform Services</h2>
              <p className="text-muted-foreground mb-4">
                TurfTrack provides a digital platform that allows users to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Browse and search for available sports turfs</li>
                <li>Make online bookings for turf slots</li>
                <li>Process secure payments through integrated payment gateways</li>
                <li>Manage booking history and preferences</li>
                <li>Receive notifications and updates about bookings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">3.1 Account Creation</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Provide accurate and complete information during registration</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">3.2 Booking Conduct</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Arrive on time for confirmed bookings</li>
                    <li>Respect facility rules and regulations</li>
                    <li>Report any issues or damages immediately</li>
                    <li>Use facilities only for their intended purpose</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Booking and Payment Terms</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">4.1 Booking Confirmation</h3>
                  <p className="text-muted-foreground">
                    Bookings are confirmed only after successful payment processing. 
                    We reserve the right to cancel bookings in case of payment failures or facility unavailability.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">4.2 Payment Processing</h3>
                  <p className="text-muted-foreground">
                    All payments are processed securely through Razorpay and other integrated payment gateways. 
                    TurfTrack does not store your payment information.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Cancellation Policy</h2>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-muted-foreground">
                  Detailed cancellation terms are outlined in our separate 
                  <Button variant="link" className="p-0 h-auto font-normal text-primary" onClick={() => navigate('/cancellation-refunds')}>
                    Cancellation & Refunds Policy
                  </Button>
                  . Please review this policy before making bookings.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                TurfTrack acts as an intermediary platform connecting users with turf facilities. We are not liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Quality or condition of turf facilities</li>
                <li>Injuries or accidents occurring at facilities</li>
                <li>Disputes between users and facility owners</li>
                <li>Loss or damage of personal property</li>
                <li>Service interruptions due to technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Privacy and Data Protection</h2>
              <p className="text-muted-foreground">
                Your privacy is important to us. We collect and use personal information in accordance with our 
                Privacy Policy. By using our services, you consent to the collection and use of your information 
                as outlined in our privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, trademarks, and intellectual property on the TurfTrack platform are owned by 
                TurfTrack or our licensors. You may not use, reproduce, or distribute any content without 
                explicit permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Modifications to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Changes will be effective immediately 
                upon posting on the platform. Continued use of our services constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Contact Information</h2>
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <p><strong>Email:</strong> legal@turftrack.com</p>
                <p><strong>Phone:</strong> +91 98765 43210</p>
                <p><strong>Address:</strong> TurfTrack Technologies Pvt Ltd, Bangalore, Karnataka, India</p>
              </div>
            </section>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                These terms and conditions are governed by the laws of India and any disputes will be 
                subject to the jurisdiction of courts in Bangalore, Karnataka.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}