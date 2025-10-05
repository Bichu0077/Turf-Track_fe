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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyINR } from "@/lib/format";
import { canCancelBooking, calculateRefundAmount } from "@/lib/razorpay";
import { 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  IndianRupee
} from "lucide-react";
import type { Booking } from "@/types";

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  onCancel: (reason: string) => void;
  isProcessing?: boolean;
}

export function CancellationDialog({
  open,
  onOpenChange,
  booking,
  onCancel,
  isProcessing = false
}: CancellationDialogProps) {
  const [reason, setReason] = useState("");
  
  // Check if booking is in the future
  const now = new Date();
  
  // Handle both HH:mm and HH:mm:ss time formats
  const cleanStartTime = booking.startTime.split(':').slice(0, 2).join(':'); // Remove seconds if present
  const bookingDateTime = new Date(`${booking.bookingDate}T${cleanStartTime}:00`);
  
  console.log('[CancellationDialog] Debug time parsing:', {
    originalStartTime: booking.startTime,
    cleanStartTime,
    bookingDate: booking.bookingDate,
    bookingDateTime: bookingDateTime.toISOString(),
    now: now.toISOString(),
    isValid: !isNaN(bookingDateTime.getTime()),
    paymentStatus: booking.paymentStatus
  });
  
  const timeDiff = bookingDateTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // Can only cancel future bookings (not past ones)
  const isInFuture = bookingDateTime > now && !isNaN(bookingDateTime.getTime());
  const canCancel = isInFuture;
  
  // Refunds only apply to completed payments, and only if within refund window
  const isPaymentCompleted = booking.paymentStatus === 'completed';
  const isWithinRefundWindow = hoursDiff >= 2;
  const refundAmount = isPaymentCompleted && isWithinRefundWindow ? booking.totalAmount : 0;
  const willGetRefund = refundAmount > 0;

  // Calculate time until booking
  const getTimeUntilBooking = () => {
    const now = new Date();
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 1) {
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      return `${minutesDiff} minutes`;
    } else {
      return `${Math.floor(hoursDiff)} hours`;
    }
  };

  const handleCancel = () => {
    onCancel(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="w-5 h-5" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this booking?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">{booking.turfName}</h3>
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{booking.bookingDate}</span>
                <span>{booking.startTime} - {booking.endTime}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Total Amount</span>
                <span className="font-medium text-foreground">{formatCurrencyINR(booking.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Time until booking: {getTimeUntilBooking()}</span>
            </div>

            {canCancel ? (
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    {!isPaymentCompleted ? (
                      <p>
                        You can cancel this booking. Since payment is still pending, no refund is applicable.
                      </p>
                    ) : isWithinRefundWindow ? (
                      <p>
                        You can cancel this booking and receive a full refund since it's more than 2 hours away.
                      </p>
                    ) : (
                      <p>
                        You can cancel this booking, but no refund will be provided as it's less than 2 hours away.
                      </p>
                    )}
                    {willGetRefund && (
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          Refund Amount: {formatCurrencyINR(refundAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      This booking has already started or is in the past and cannot be cancelled.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Refund Status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium">Refund Status:</span>
            <Badge variant={willGetRefund ? "default" : "destructive"}>
              {!isPaymentCompleted 
                ? "No Refund - Payment Pending" 
                : willGetRefund 
                  ? "Full Refund" 
                  : "No Refund"}
            </Badge>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please tell us why you're cancelling (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Keep Booking
          </Button>
          <Button 
            variant="destructive"
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>Cancelling...</>
            ) : (
              <>Cancel Booking</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}