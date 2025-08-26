import { Helmet } from "react-helmet-async";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import TurfCard from "@/components/turf/TurfCard";
import { useEffect, useMemo, useState, useRef } from "react";
import { apiRequest } from "@/lib/auth";
import type { Turf } from "@/types";
import React from "react";
import GreenScreenBackgroundOrig from "@/components/visual/GreenScreenBackground";
const GreenScreenBackground = React.memo(GreenScreenBackgroundOrig);

const Index = () => {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<number[]>([500, 2000]);
  const SLIDER_MIN = 500;
  const SLIDER_MAX = 2000;
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const turfsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest<{ turfs: any[] }>("/api/turfs/public");
        const mapped: Turf[] = (data.turfs || []).map((t) => ({
          id: t._id ?? t.id,
          name: t.name,
          location: t.location,
          description: t.description ?? "",
          images: Array.isArray(t.images) && t.images.length > 0 ? t.images : ["/placeholder.svg"],
          pricePerHour: Number(t.pricePerHour ?? 0),
          operatingHours: { open: t.operatingHours?.open ?? "06:00", close: t.operatingHours?.close ?? "22:00" },
          amenities: Array.isArray(t.amenities) ? t.amenities : [],
        }));
        setTurfs(mapped);
      } catch {
        setTurfs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return turfs.filter((t) => {
      const matchQ = `${t.name} ${t.location} ${t.amenities.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchP = t.pricePerHour >= price[0] && t.pricePerHour <= price[1];
      return matchQ && matchP;
    });
  }, [turfs, query, price]);

  // Memoize sources so the array reference doesn't change on every render
  const bgSources = React.useMemo(() => [
    { src: "/videos/ronaldhino_clip.mp4", fit: "cover" as const, scale: 1, dxPercent: 0, dyPercent: 0 },
    { src: "/videos/messi_clip.mp4", fit: "cover" as const, scale: 1, dxPercent: 0, dyPercent: 0 },
  ], []);

  return (
    <main className="relative overflow-hidden">
      <Helmet>
        <title>TurfTrack</title>
        <meta name="description" content="Discover, compare, and book premium sports turf slots near you with TurfTrack." />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: filtered.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `/turfs/${t.id}` }))
        })}</script>
      </Helmet>

      {/* Background video (high quality) */}
     
      <div className="absolute inset-0 -z-10 pixel-grid mix-blend-soft-light opacity-30 pointer-events-none" />
      <div className="absolute inset-0 -z-10 scanlines pointer-events-none" />

      {/* Hero */}
      <section className="relative">
        <div className="hero-glow" aria-hidden />
        <div className="container grid gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center gap-6">
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl pixel-shadow">
              Book premium sports turfs in minutes
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time availability, transparent pricing, and a smooth checkout experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" onClick={() => turfsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                Explore turfs
              </Button>
              <Button variant="premium">How it works</Button>
            </div>
          </div>
          <div className="relative w-[300px] h-[600px] md:w-[800px] md:h-[460px] rounded-xl overflow-hidden ">
            {/* Inline chroma-key video (high quality) */}
            <GreenScreenBackground
              className="absolute border-0 inset-2 md:inset-4 rounded-lg overflow-hidden"
              highQuality
              pixelSize={1}
              fps={30}
              disableOnMobile={false}
              carousel
              carouselIntervalMs={7000}
              sources={bgSources}
              edgeSmooth
              soften
            />
            <div className="absolute inset-0 pixel-grid opacity-20 mix-blend-soft-light" />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="section-soft border-t">
        <div className="container py-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Search</label>
              <Input
                placeholder="Search by name, location or amenity"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Price</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col items-center max-w-[400px] w-full">
                  {/* Value labels above thumbs */}
                  <div className="relative w-full flex justify-between mb-1" style={{height: '18px'}}>
                    <span className="absolute left-0 text-xs font-semibold bg-white px-1 rounded shadow-sm" style={{transform: 'translateY(-8px)'}}>
                      ₹{price[0]}
                    </span>
                    <span className="absolute right-0 text-xs font-semibold bg-white px-1 rounded shadow-sm" style={{transform: 'translateY(-8px)'}}>
                      {price[1] === SLIDER_MAX ? `₹${SLIDER_MAX}+` : `₹${price[1]}`}
                    </span>
                  </div>
                  <Slider
                    value={price}
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={50}
                    onValueChange={([min, max]) => setPrice([Math.min(min, max), Math.max(min, max)])}
                    className="h-1 w-56 max-w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary [&_[role=slider]]:shadow-sm"
                  />
                </div>
                <Button variant="outline" size="sm">Go</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="container py-10" ref={turfsRef}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <div className="text-sm text-muted-foreground">Loading turfs...</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-sm text-muted-foreground">No turfs found.</div>
          )}
          {!loading && filtered.map((t) => (
            <TurfCard key={t.id} turf={t} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
