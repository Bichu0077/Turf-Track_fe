import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import TimeSlotPicker from "@/components/turf/TimeSlotPicker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { format, setHours, setMinutes, isBefore, isSameDay } from "date-fns";
import { getTurfAvailability } from "@/hooks/useBooking";
import { apiRequest } from "@/lib/auth";
import type { Turf } from "@/types";

export default function TurfDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await apiRequest<{ turf: any }>(`/api/turfs/${id}`);
        const t = data.turf;
        const mapped: Turf = {
          id: t._id ?? t.id,
          name: t.name,
          location: t.location,
          description: t.description ?? "",
          images: Array.isArray(t.images) && t.images.length > 0 ? t.images : ["/placeholder.svg"],
          pricePerHour: Number(t.pricePerHour ?? 0),
          operatingHours: { open: t.operatingHours?.open ?? "06:00", close: t.operatingHours?.close ?? "22:00" },
          amenities: Array.isArray(t.amenities) ? t.amenities : [],
        };
        setTurf(mapped);
      } catch {
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
        <meta name="description" content={`Book ${turf.name} located at ${turf.location.address}. Available hourly slots and amenities.`} />
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
            <p className="text-muted-foreground">{turf.location.address}</p>
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
