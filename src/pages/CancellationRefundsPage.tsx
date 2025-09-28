import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CreditCard, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CancellationRefundsPage() {
  const navigate = useNavigate();

  return (
    <main className="container py-8">
      <Helmet>
        <title>Cancellation & Refunds Policy - TurfTrack</title>
        <meta name="description" content="Cancellation and refund policy for TurfTrack booking services." />
        <link rel="canonical" href="/cancellation-refunds" />
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
          <h1 className="text-3xl font-bold mb-2">Cancellation & Refunds Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="card-elevated p-8 space-y-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800 mb-1">Important Notice</h3>
                <p className="text-sm text-amber-700">
                  Please read this policy carefully before making a booking. Cancellation terms vary based on timing and circumstances.
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                1. Cancellation Timeline
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">24+ Hours Before</h3>
                  <p className="text-sm text-green-700 mb-2">Full refund available</p>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• 100% refund of booking amount</li>
                    <li>• Processing fee: ₹0</li>
                    <li>• Refund timeline: 3-5 business days</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <h3 className="font-medium text-yellow-800 mb-2">6-24 Hours Before</h3>
                  <p className="text-sm text-yellow-700 mb-2">Partial refund available</p>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    <li>• 75% refund of booking amount</li>
                    <li>• Processing fee: ₹25</li>
                    <li>• Refund timeline: 5-7 business days</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                  <h3 className="font-medium text-orange-800 mb-2">2-6 Hours Before</h3>
                  <p className="text-sm text-orange-700 mb-2">Limited refund available</p>
                  <ul className="text-sm text-orange-600 space-y-1">
                    <li>• 50% refund of booking amount</li>
                    <li>• Processing fee: ₹50</li>
                    <li>• Refund timeline: 7-10 business days</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <h3 className="font-medium text-red-800 mb-2">Less than 2 Hours</h3>
                  <p className="text-sm text-red-700 mb-2">No refund available</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    <li>• 0% refund</li>
                    <li>• Booking amount forfeited</li>
                    <li>• Reschedule options may be available</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. How to Cancel Your Booking</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Online Cancellation</h3>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Log in to your TurfTrack account</li>
                    <li>Go to "My Bookings" section</li>
                    <li>Find your booking and click "Cancel"</li>
                    <li>Confirm cancellation and select refund method</li>
                    <li>You'll receive a confirmation email</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Contact Support</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground mb-2">If you're unable to cancel online, contact our support team:</p>
                    <ul className="space-y-1 text-sm">
                      <li><strong>Phone:</strong> +91 98765 43210</li>
                      <li><strong>Email:</strong> support@turftrack.com</li>
                      <li><strong>WhatsApp:</strong> +91 98765 43210</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                3. Refund Processing
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Refund Methods</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Credit/Debit Cards:</strong> Refunded to original payment method within 5-7 business days</li>
                    <li><strong>UPI/Digital Wallets:</strong> Refunded to original payment method within 3-5 business days</li>
                    <li><strong>Net Banking:</strong> Refunded to original account within 5-7 business days</li>
                    <li><strong>TurfTrack Wallet:</strong> Instant credit for future bookings (additional 5% bonus)</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Faster Refunds</h4>
                  <p className="text-sm text-blue-700">
                    Choose TurfTrack Wallet for instant refunds plus a 5% bonus. 
                    Wallet credits never expire and can be used for any future bookings.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Special Circumstances</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Weather-Related Cancellations</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground mb-2">
                      In case of severe weather conditions (heavy rain, storms, etc.):
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>100% refund or free rescheduling available</li>
                      <li>Weather conditions are verified through official sources</li>
                      <li>Facility owner confirmation required</li>
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Facility-Related Issues</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground mb-2">
                      If the facility is unavailable due to maintenance or other issues:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>100% refund guaranteed</li>
                      <li>Alternative slots offered when possible</li>
                      <li>Compensation credits may be provided</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. No-Show Policy</h2>
              <div className="border-l-4 border-red-500 bg-red-50 p-4">
                <p className="text-red-800 font-medium mb-2">No-Show = No Refund</p>
                <p className="text-red-700 text-sm">
                  If you don't show up for your booking without prior cancellation, 
                  the full booking amount is forfeited. Please cancel in advance if your plans change.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Rescheduling Options</h2>
              <p className="text-muted-foreground mb-4">
                Can't make it to your booking? Consider rescheduling instead of cancelling:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Free rescheduling available up to 6 hours before booking</li>
                <li>Subject to availability at your preferred new slot</li>
                <li>One free reschedule per booking allowed</li>
                <li>Additional rescheduling may incur charges</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Dispute Resolution</h2>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-muted-foreground mb-4">
                  For any disputes regarding cancellations or refunds:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Step 1:</strong> Contact our support team with your booking details</p>
                  <p><strong>Step 2:</strong> We'll review your case within 24-48 hours</p>
                  <p><strong>Step 3:</strong> If unresolved, escalate to our grievance officer</p>
                  <p><strong>Email:</strong> grievance@turftrack.com</p>
                  <p><strong>Response time:</strong> 3-5 business days</p>
                </div>
              </div>
            </section>

            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This cancellation and refund policy is integrated with our payment processing system 
                and complies with Indian consumer protection laws. All refunds are processed through 
                Razorpay's secure refund system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}