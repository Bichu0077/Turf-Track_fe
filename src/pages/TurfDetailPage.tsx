import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import TimeSlotPicker from "@/components/turf/TimeSlotPicker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { format, setHours, setMinutes, isSameDay } from "date-fns";
import { getTurfAvailability, createBooking } from "@/hooks/useBooking";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import OwnerBookingForm from "@/components/owner/OwnerBookingForm";
import { Crown } from "lucide-react";
import type { Turf, OwnerBookingData } from "@/types";

export default function TurfDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast: reactToast } = useToast();
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [showOwnerBooking, setShowOwnerBooking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clear selected slots when date changes
  useEffect(() => {
    setSelectedSlots([]);
  }, [date]);

  useEffect(() => {
    (async () => {
      if (!id) {
        console.log("No turf ID provided");
        return;
      }
      try {
        console.log("Fetching turf with ID:", id);
        const data = await apiRequest<{ turf: Record<string, unknown> }>(`/api/turfs/${id}`);
        console.log("Received turf data:", data);
        const t = data.turf;
        
        // Handle location safely - could be string or object
        let locationString = "";
        if (typeof t.location === "string") {
          locationString = t.location;
        } else if (t.location && typeof t.location === "object" && 'address' in t.location) {
          locationString = String((t.location as Record<string, unknown>).address);
        } else if (t.location) {
          locationString = String(t.location);
        }
        
        const mapped: Turf = {
          id: String(t._id || t.id || ""),
          name: String(t.name || ""),
          location: locationString,
          description: String(t.description || ""),
          images: Array.isArray(t.images) && t.images.length > 0 ? t.images as string[] : ["/placeholder.svg"],
          pricePerHour: Number(t.pricePerHour) || 0,
          operatingHours: { 
            open: String(((t.operatingHours as Record<string, unknown>)?.open) || "06:00"), 
            close: String(((t.operatingHours as Record<string, unknown>)?.close) || "22:00") 
          },
          amenities: Array.isArray(t.amenities) ? t.amenities as string[] : [],
          owner: String(t.owner || ""),

        };
        console.log("Mapped turf data:", mapped);
        setTurf(mapped);
      } catch (error) {
        console.error("Error fetching turf:", error);
        setTurf(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Fetch unavailable slots when turf and date are selected
  useEffect(() => {
    async function fetchBookedTimes() {
      if (!turf || !date) {
        setBookedTimes([]);
        return;
      }
      try {
        console.log('Fetching availability for:', turf.id, format(date, 'yyyy-MM-dd'));
        const booked = await getTurfAvailability(turf.id, format(date, 'yyyy-MM-dd'));
        console.log('Booked times:', booked);
        setBookedTimes(booked);
      } catch (error) {
        console.error('Error fetching booked times:', error);
        setBookedTimes([]);
      }
    }
    fetchBookedTimes();
  }, [turf, date]);

  if (!id) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-semibold">Invalid turf ID</h1>
        <p className="text-muted-foreground">No turf ID provided in URL.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-semibold">Loading turf...</h1>
      </main>
    );
  }

  if (!turf) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-semibold">Turf not found</h1>
        <p className="text-muted-foreground">Please check the URL and try again.</p>
      </main>
    );
  }

  // Multi-slot selection logic
  let startTime = "";
  let endTime = "";
  let duration = 0;
  
  if (selectedSlots.length > 0) {
    // Sort selected slots to get proper start and end times
    const sortedSlots = [...selectedSlots].sort((a, b) => {
      const aMinutes = parseInt(a.split(':')[0]) * 60 + parseInt(a.split(':')[1]);
      const bMinutes = parseInt(b.split(':')[0]) * 60 + parseInt(b.split(':')[1]);
      return aMinutes - bMinutes;
    });
    
    startTime = sortedSlots[0];
    duration = sortedSlots.length;
    
    // Calculate end time by adding duration hours to start time
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = startHour + duration;
    const endMinute = startMinute;
    
    if (endHour >= 24) {
      endTime = `${(endHour - 24).toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    } else {
      endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    }
  }
  const isOwner = user && turf && turf.owner === user.id;
  const total = duration > 0 ? turf.pricePerHour * duration : 0;

  // Owner booking handler
  const handleOwnerBooking = async (data: OwnerBookingData) => {
    if (!turf || !date) return;
    
    try {
      setIsProcessing(true);
      
      const booking = await createBooking({
        turfId: turf.id,
        date: format(date, 'yyyy-MM-dd'),
        startTime,
        endTime,
        totalAmount: 0,
        userName: data.userName,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        paymentMethod: 'owner',
        bookingType: data.bookingType,
        notes: data.notes
      });

      toast('Owner booking confirmed successfully! No payment required.');
      setShowOwnerBooking(false);
      navigate('/bookings');
    } catch (error) {
      toast('Failed to create owner booking');
      console.error('Owner booking error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to format time as 12-hour with AM/PM
  function format12HourRange(start: string, end: string) {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startDate = setMinutes(setHours(new Date(), sh), sm);
    const endDate = setMinutes(setHours(new Date(), eh), em);
    return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
  }

  // For disabling past slots
  const now = new Date();
  const isToday = date && isSameDay(date, now);

  return (
    <main className="container py-8">
      <Helmet>
        <title>{turf.name}</title>
        <meta name="description" content={`Book ${turf.name} located at ${turf.location}. Available hourly slots and amenities.`} />
        <link rel="canonical" href={`/turfs/${turf.id}`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Product', name: turf.name, description: turf.description, offers: { '@type': 'Offer', priceCurrency: 'INR', price: turf.pricePerHour }
        })}</script>
      </Helmet>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <img src={turf.images[0]} alt={`${turf.name} hero image`} className="w-full rounded-xl shadow-[var(--shadow-card)]" />
          <div className="flex flex-wrap gap-2">
            {turf.amenities.map((a) => (
              <span key={a} className="rounded-full bg-secondary px-2 py-1 text-xs">{a}</span>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{turf.name}</h1>
            <p className="text-muted-foreground">{turf.location}</p>
          </div>
          <p className="text-muted-foreground">{turf.description}</p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold">Pick a date</h2>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  setDate(newDate);
                  setSelectedSlots([]); // Clear slots when date changes
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold">Select time slot</h2>
              <TimeSlotPicker
                operatingHours={turf.operatingHours}
                bookedTimes={bookedTimes}
                selectedDate={date || new Date()}
                onSelect={slots => setSelectedSlots(Array.isArray(slots) ? slots : [slots])}
              />
              {duration > 0 && (
                <div className="mt-2 text-primary font-semibold">
                  Total: {isOwner ? 'Free (Owner)' : `₹${total}`}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold flex items-center gap-2">
              {isOwner && <Crown className="h-5 w-5 text-yellow-500" />}
              {isOwner ? 'Free for Owner' : `₹${turf.pricePerHour} / hr`}
            </div>
            
            {isOwner ? (
              <Button
                variant="hero"
                disabled={!date || !(startTime && endTime && duration > 0)}
                onClick={() => {
                  if (!token) {
                    reactToast({
                      title: 'Login Required',
                      description: 'You must be logged in to make a booking.',
                      variant: 'destructive'
                    });
                    navigate('/login');
                    return;
                  }
                  setShowOwnerBooking(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Book Slot (Free)
              </Button>
            ) : (
              <Button
                variant="hero"
                disabled={!date || !(startTime && endTime && duration > 0)}
                onClick={() => {
                  if (!token) {
                    reactToast({
                      title: 'Login Required',
                      description: 'You must be logged in to make a booking.',
                      variant: 'destructive'
                    });
                    navigate('/login');
                    return;
                  }
                  
                  navigate("/checkout", {
                    state: {
                      turfId: turf.id,
                      turfName: turf.name,
                      pricePerHour: turf.pricePerHour,
                      date: date ? format(date, 'yyyy-MM-dd') : null,
                      startTime,
                      endTime,
                      total,
                    },
                  });
                }}
              >
                Proceed to Checkout
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Owner Booking Form Modal */}
      {showOwnerBooking && isOwner && date && (
        <OwnerBookingForm
          turfId={turf.id}
          turfName={turf.name}
          date={format(date, 'yyyy-MM-dd')}
          startTime={startTime}
          endTime={endTime}
          onSubmit={handleOwnerBooking}
          onCancel={() => setShowOwnerBooking(false)}
          isLoading={isProcessing}
        />
      )}
    </main>
  );
}
