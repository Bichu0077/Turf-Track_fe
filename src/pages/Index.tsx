// ...existing code...
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

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

const Index = () => {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<number[]>([500, 2000]);
  const SLIDER_MIN = 500;
  const SLIDER_MAX = 2000;
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const turfsRef = useRef<HTMLDivElement>(null);

  // Location search states
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lon: number, address: string} | null>(null);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce for location search
  useEffect(() => {
    if (locationQuery.trim().length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingLocations(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=5&countrycodes=IN&addressdetails=1`
        );
        const data = await response.json();
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Location search error:', error);
        setLocationSuggestions([]);
      } finally {
        setSearchingLocations(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setSelectedLocation({
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon),
      address: suggestion.display_name.split(',').slice(0, 2).join(', ')
    });
    setLocationQuery(suggestion.display_name.split(',').slice(0, 2).join(', '));
    setShowSuggestions(false);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setLocationQuery("");
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  // Fetch turfs with optional location filtering
  useEffect(() => {
    (async () => {
      setLoading(true);
      let url = "/api/turfs/public";
      if (selectedLocation) {
        url += `?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}&radius=10`;
      }
      try {
        const data = await apiRequest<{ turfs: any[] }>(url);
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
  }, [selectedLocation]);

  const filtered = useMemo(() => {
    return turfs.filter((t) => {
      let locationText = "";
      if (t.location && typeof t.location === "object" && t.location !== null && (t.location as any).address) {
        locationText = (t.location as any).address;
      } else if (t.location) {
        locationText = String(t.location);
      }
      
      const matchQ = `${t.name} ${locationText} ${t.amenities.join(" ")}` // <-- use backticks here
  .toLowerCase()
  .includes(query.toLowerCase());
      const matchP = t.pricePerHour >= price[0] && t.pricePerHour <= price[1];
      return matchQ && matchP;
    });
  }, [turfs, query, price]);

  // Memoize video sources for carousel
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

      {/* Background effects */}
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
          <div className="relative w-[300px] h-[600px] md:w-[800px] md:h-[460px] rounded-xl overflow-hidden">
            {/* High quality video carousel */}
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
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium">Search</label>
              <Input
                placeholder="Search by name, location or amenity"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium">
                Location {selectedLocation && <span className="text-xs text-muted-foreground">(10km radius)</span>}
              </label>
              <div className="relative">
                <Input
                  ref={locationInputRef}
                  placeholder="Start typing city name..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                />
                {searchingLocations && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm border-b border-border last:border-b-0"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <div className="truncate">
                          {suggestion.display_name.split(',').slice(0, 2).join(', ')}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.display_name.split(',').slice(2).join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedLocation && (
                <Button variant="ghost" size="sm" onClick={clearLocation} className="h-6 text-xs mt-1">
                  Clear location
                </Button>
              )}
            </div>

            {/* Price Filter */}
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
                    className="h-1 w-56 max-w-full [&[role=slider]]:h-3 [&[role=slider]]:w-3 [&[role=slider]]:border-2 [&[role=slider]]:border-primary [&[role=slider]]:bg-primary [&[role=slider]]:shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="container py-10" ref={turfsRef}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
           {selectedLocation ? `Turfs near ${selectedLocation.address}` : 'All Turfs'} 
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filtered.length} found)
            </span>
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-sm text-muted-foreground">Loading turfs...</span>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No turfs found matching your criteria.</p>
              {selectedLocation && (
                <Button variant="outline" onClick={clearLocation} className="mt-4">
                  Clear location filter
                </Button>
              )}
            </div>
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