import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, CreditCard, Truck } from "lucide-react";

export default function PolicyLinksCard() {
  const policies = [
    {
      title: "Terms & Conditions",
      description: "Our platform usage terms and service agreements",
      icon: FileText,
      path: "/terms-conditions",
      color: "text-blue-600"
    },
    {
      title: "Cancellation & Refunds",
      description: "Booking cancellation policies and refund procedures",
      icon: CreditCard,
      path: "/cancellation-refunds", 
      color: "text-green-600"
    },
    {
      title: "Shipping Policy",
      description: "Service delivery and digital booking information",
      icon: Truck,
      path: "/shipping-policy",
      color: "text-purple-600"
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Important Policies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {policies.map((policy) => (
            <div key={policy.path} className="text-center">
              <div className="mb-3">
                <policy.icon className={`w-8 h-8 mx-auto ${policy.color}`} />
              </div>
              <h3 className="font-medium text-sm mb-2">{policy.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 px-2">
                {policy.description}
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={policy.path}>
                  View Policy
                </Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-6 p-3 bg-muted/30 rounded text-xs text-center text-muted-foreground">
          These policies are powered by Razorpay and comply with Indian regulations
        </div>
      </CardContent>
    </Card>
  );
}