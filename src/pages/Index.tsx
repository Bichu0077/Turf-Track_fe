import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-turf.jpg";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import TurfCard from "@/components/turf/TurfCard";
import { turfs } from "@/data/mockTurfs";
import { useMemo, useState } from "react";

const Index = () => {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<number[]>([600, 2000]);

  const filtered = useMemo(() => {
    return turfs.filter((t) => {
      const matchQ = `${t.name} ${t.location} ${t.amenities.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchP = t.pricePerHour >= price[0] && t.pricePerHour <= price[1];
      return matchQ && matchP;
    });
  }, [query, price]);

  return (
    <main>
      <Helmet>
        <title>TurfTrack</title>
        <meta name="description" content="Discover, compare, and book premium sports turf slots near you with TurfTrack." />
        <link rel="canonical" href="/" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: turfs.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `/turfs/${t.id}` }))
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative">
        <div className="hero-glow" aria-hidden />
        <div className="container grid gap-8 py-12 md:grid-cols-2 md:py-16">
          <div className="flex flex-col justify-center gap-6">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Book premium sports turfs in minutes
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time availability, transparent pricing, and a smooth checkout experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero">Explore turfs</Button>
              <Button variant="premium">How it works</Button>
            </div>
          </div>
          <div className="relative">
            <img src={heroImage} alt="Premium football turf at golden hour" className="w-full rounded-xl shadow-[var(--shadow-card)]" />
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
              <label className="mb-2 block text-sm font-medium">Price per hour (₹{price[0]} - ₹{price[1]})</label>
              <Slider value={price} min={500} max={2500} step={100} onValueChange={setPrice} />
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="container py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TurfCard key={t.id} turf={t} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
