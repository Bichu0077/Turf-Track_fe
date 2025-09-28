import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import TimeSlotPicker from "@/components/turf/TimeSlotPicker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { format, setHours, setMinutes, isSameDay } from "date-fns";
import { getTurfAvailability } from "@/hooks/useBooking";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Turf } from "@/types";

export default function TurfDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

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
      if (!turf || !date) return;
      try {
        const booked = await getTurfAvailability(turf.id, format(date, 'yyyy-MM-dd'));
        setBookedTimes(booked);
      } catch {
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

  // Only calculate these after turf is loaded
  const openHour = turf.operatingHours.open ? parseInt(turf.operatingHours.open.split(":")[0]) : 6;
  const closeHour = turf.operatingHours.close ? parseInt(turf.operatingHours.close.split(":")[0]) : 22;
  const hours = Array.from({length: closeHour - openHour}, (_, i) => `${(openHour + i).toString().padStart(2, '0')}:00`);

  // Multi-slot selection logic
  let startTime = "";
  let endTime = "";
  let duration = 0;
  if (selectedSlots.length === 1) {
    startTime = selectedSlots[0];
    const s = parseInt(startTime);
    duration = 1;
    endTime = (s + 1).toString().padStart(2, '0') + ":00";
  } else if (selectedSlots.length > 1) {
    // Find the earliest and latest slot
    const slotIdxs = selectedSlots.map(s => hours.indexOf(s)).sort((a, b) => a - b);
    const s = slotIdxs[0];
    const e = slotIdxs[selectedSlots.length - 1];
    startTime = hours[s];
    endTime = hours[e + 1] || ((parseInt(hours[e]) + 1).toString().padStart(2, '0') + ":00");
    duration = e - s + 1;
  }
  const total = duration > 0 ? turf.pricePerHour * duration : 0;

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
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold">Select time slot</h2>
              <TimeSlotPicker
                operatingHours={turf.operatingHours}
                bookedTimes={bookedTimes}
                selectedDate={date}
                onSelect={slots => setSelectedSlots(Array.isArray(slots) ? slots : [slots])}
              />
              {duration > 0 && (
                <div className="mt-2 text-primary font-semibold">Total: ₹{total}</div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">₹{turf.pricePerHour} / hr</div>
            <Button
              variant="hero"
              disabled={!date || !(startTime && endTime && duration > 0)}
              onClick={() => {
                if (!token) {
                  toast({
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
          </div>
        </div>
      </div>
    </main>
  );
}
