import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";

export default function TurfManagementPage() {
  const [loading, setLoading] = useState(false);
  const [turfs, setTurfs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number | "">("");
  const [open, setOpen] = useState("06:00");
  const [close, setClose] = useState("22:00");
  const [amenities, setAmenities] = useState("");
  const [image, setImage] = useState("");

  async function fetchMine() {
    setLoading(true);
    try {
      const data = await apiRequest<{ turfs: any[] }>("/api/turfs/mine");
      setTurfs(data.turfs);
    } catch {
      setTurfs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMine();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !location || !pricePerHour) return;
    setLoading(true);
    try {
      await apiRequest("/api/turfs", {
        method: "POST",
        body: JSON.stringify({
          name,
          location,
          description: "",
          images: image ? [image] : [],
          pricePerHour: Number(pricePerHour),
          operatingHours: { open, close },
          amenities: amenities
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
        }),
      });
      setName("");
      setLocation("");
      setPricePerHour("");
      setOpen("06:00");
      setClose("22:00");
      setAmenities("");
      setImage("");
      setShowForm(false);
      await fetchMine();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8">
        <Helmet>
          <title>Manage Turfs</title>
          <meta name="description" content="Create, edit and delete turfs." />
          <link rel="canonical" href="/admin/turfs" />
        </Helmet>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Turfs</h1>
          <Button variant="hero" onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "Add Turf"}</Button>
        </div>
        {showForm && (
          <form onSubmit={onCreate} className="mb-6 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Price per hour</label>
              <Input type="number" value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Open</label>
                <Input placeholder="06:00" value={open} onChange={(e) => setOpen(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Close</label>
                <Input placeholder="22:00" value={close} onChange={(e) => setClose(e.target.value)} />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Amenities (comma separated)</label>
              <Input placeholder="Parking, Washrooms" value={amenities} onChange={(e) => setAmenities(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Image URL (optional)</label>
              <Input placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="hero" disabled={loading}>
                {loading ? "Saving..." : "Create Turf"}
              </Button>
            </div>
          </form>
        )}
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Price/hr</th>
                <th className="p-3 text-left">Amenities</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="p-3" colSpan={5}>Loading...</td></tr>
              )}
              {!loading && turfs.length === 0 && (
                <tr><td className="p-3" colSpan={5}>No turfs yet. Use "Add Turf" to create your first one.</td></tr>
              )}
              {!loading && turfs.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">{t.location}</td>
                  <td className="p-3">₹{t.pricePerHour}</td>
                  <td className="p-3">{Array.isArray(t.amenities) ? t.amenities.join(', ') : ''}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" disabled>Edit</Button>
                      <Button variant="destructive" disabled>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
