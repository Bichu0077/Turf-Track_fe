import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Clock, MapPin } from 'lucide-react';
import type { BookingType, OwnerBookingData } from '@/types';

interface OwnerBookingFormProps {
  turfId: string;
  turfName: string;
  date: string;
  startTime: string;
  endTime: string;
  onSubmit: (data: OwnerBookingData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function OwnerBookingForm({ 
  turfId, 
  turfName, 
  date, 
  startTime, 
  endTime, 
  onSubmit, 
  onCancel,
  isLoading 
}: OwnerBookingFormProps) {
  const [bookingType, setBookingType] = useState<BookingType>('owner');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      bookingType,
      notes,
      userName: 'Owner',
      userEmail: 'owner@turf.com',
      userPhone: ''
    });
  };

  const getBookingTypeLabel = (type: BookingType) => {
    switch (type) {
      case 'owner': return 'Personal Use';
      case 'maintenance': return 'Maintenance Work';
      case 'event': return 'Special Event';
      default: return 'Personal Use';
    }
  };

  const getBookingTypeDescription = (type: BookingType) => {
    switch (type) {
      case 'owner': return 'Reserve the turf for your personal use';
      case 'maintenance': return 'Block time for maintenance and repairs';
      case 'event': return 'Special events or private functions';
      default: return 'Reserve the turf for your personal use';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Owner Booking
          </CardTitle>
          <p className="text-green-100 text-sm">No payment required</p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          {/* Booking Summary */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Booking Summary
            </h4>
            <div className="text-sm text-green-700 space-y-1">
              <p className="font-medium">{turfName}</p>
              <p className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {date} • {startTime} - {endTime}
              </p>
              <p className="text-lg font-bold text-green-600">FREE (Owner)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Booking Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Purpose
              </label>
              <Select value={bookingType} onValueChange={(value: BookingType) => setBookingType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">
                    <div>
                      <div className="font-medium">Personal Use</div>
                      <div className="text-xs text-muted-foreground">For your personal activities</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div>
                      <div className="font-medium">Maintenance Work</div>
                      <div className="text-xs text-muted-foreground">Repairs and upkeep</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="event">
                    <div>
                      <div className="font-medium">Special Event</div>
                      <div className="text-xs text-muted-foreground">Private functions</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {getBookingTypeDescription(bookingType)}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Add any notes about this ${bookingType} booking...`}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}