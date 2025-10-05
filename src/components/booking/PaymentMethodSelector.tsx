import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyINR } from "@/lib/format";
import { 
  CreditCard, 
  Banknote, 
  Shield, 
  AlertTriangle,
  CheckCircle 
} from "lucide-react";

interface PaymentMethodSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turfName: string;
  amount: number;
  date: string;
  time: string;
  onPaymentMethodSelect: (method: 'cash' | 'online') => void;
  isProcessing?: boolean;
}

export function PaymentMethodSelector({
  open,
  onOpenChange,
  turfName,
  amount,
  date,
  time,
  onPaymentMethodSelect,
  isProcessing = false
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'online'>('online');

  const handleContinue = () => {
    onPaymentMethodSelect(selectedMethod);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Choose Payment Method
          </DialogTitle>
          <DialogDescription>
            How would you like to pay for your turf booking?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">{turfName}</h3>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{date} • {time}</span>
              <span className="font-medium text-foreground">{formatCurrencyINR(amount)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as 'cash' | 'online')}
            className="space-y-3"
          >
            {/* Online Payment Option */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="online" id="online" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="online" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Pay Online Now
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Secure payment via Razorpay. Instant confirmation.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-700">256-bit SSL encryption</span>
                  </div>
                </Label>
              </div>
            </div>

            {/* Cash Payment Option */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="cash" id="cash" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="cash" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Banknote className="w-4 h-4 text-orange-600" />
                    Pay at Turf
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay cash when you arrive at the turf.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span className="text-xs text-orange-700">Payment pending until arrival</span>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Payment Method Info */}
          {selectedMethod === 'online' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your booking will be confirmed immediately after successful payment.
                You can always pay later if you choose "Pay at Turf" now.
              </AlertDescription>
            </Alert>
          )}

          {selectedMethod === 'cash' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your booking will be confirmed but payment will be marked as pending.
                Please ensure you have cash ready when you arrive at the turf.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : selectedMethod === 'online' ? (
              <>Pay {formatCurrencyINR(amount)} Now</>
            ) : (
              <>Confirm Booking</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}