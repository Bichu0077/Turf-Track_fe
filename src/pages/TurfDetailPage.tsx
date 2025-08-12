import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { turfs } from "@/data/mockTurfs";
import TimeSlotPicker from "@/components/turf/TimeSlotPicker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format } from "date-fns";

export default function TurfDetailPage() {
  const { id } = useParams();
  const turf = turfs.find((t) => t.id === id);
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string | null>(null);

  if (!turf) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-semibold">Turf not found</h1>
      </main>
    );
  }

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
              <h2 className="mb-3 text-sm font-semibold">Available time</h2>
              <TimeSlotPicker
                operatingHours={turf.operatingHours}
                bookedTimes={[]}
                onSelect={setTime}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">₹{turf.pricePerHour} / hr</div>
            <Button
              variant="hero"
              disabled={!date || !time}
              onClick={() => {
                navigate("/booking", {
                  state: {
                    turfId: turf.id,
                    turfName: turf.name,
                    pricePerHour: turf.pricePerHour,
                    date: date ? format(date, 'yyyy-MM-dd') : null,
                    time,
                  },
                });
              }}
            >
              Book now
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
