import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/lib/auth";

// Declare Leaflet on window for TypeScript
declare global {
  interface Window {
    L: any;
  }
}

// Types for better type safety
interface TurfLocation {
  address: string;
  latitude: number;
  longitude: number;
}

interface Turf {
  _id: string;
  name: string;
  location: string | TurfLocation; // Support both old string and new object format
  pricePerHour: number;
  amenities: string[];
  operatingHours: {
    open: string;
    close: string;
  };
  images?: string[];
  description?: string;
}

export default function TurfManagementPage() {
  const [loading, setLoading] = useState(false);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [pricePerHour, setPricePerHour] = useState<number | "">("");
  const [open, setOpen] = useState("06:00");
  const [close, setClose] = useState("22:00");
  const [amenities, setAmenities] = useState("");
  const [image, setImage] = useState("");
  
  // Map states
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Leaflet dynamically and ensure it's available before using
  const loadLeaflet = async () => {
    if (typeof window !== 'undefined') {
      if (!('L' in window)) {
        // Load Leaflet CSS only if not already loaded
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(link);
        }
        // Load Leaflet JS only if not already loaded
        if (!document.querySelector('script[src*="leaflet"]')) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
          script.onload = () => {
            setMapLoaded(true);
          };
          document.head.appendChild(script);
        }
      } else {
        setMapLoaded(true);
      }
    }
  };

  // Initialize map
  const initializeMap = () => {
    if (!mapLoaded || !mapRef.current || !(window as any).L) return;

    // Default to India center
    const defaultLat = 20.5937;
    const defaultLng = 78.9629;

    // Remove previous map instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const L = (window as any).L;
    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add click event to map
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      setSelectedCoords({ lat, lng });

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // Add new marker
      markerRef.current = L.marker([lat, lng]).addTo(map);

      // Reverse geocode to get address
      reverseGeocode(lat, lng);
    });

    // If editing, show marker at selectedCoords
    if (selectedCoords) {
      map.setView([selectedCoords.lat, selectedCoords.lng], 15);
      markerRef.current = L.marker([selectedCoords.lat, selectedCoords.lng]).addTo(map);
    }

    mapInstanceRef.current = map;
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocation(data.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  // Search and center map on location
  const searchLocation = async (query: string) => {
    if (!query.trim() || !mapInstanceRef.current) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=IN`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const coords = { lat: parseFloat(lat), lng: parseFloat(lon) };
        
        // Center map and add marker
        mapInstanceRef.current.setView([coords.lat, coords.lng], 15);
        setSelectedCoords(coords);
        
        // Remove existing marker
        if (markerRef.current) {
          mapInstanceRef.current.removeLayer(markerRef.current);
        }
        
        // Add new marker
        markerRef.current = window.L.marker([coords.lat, coords.lng]).addTo(mapInstanceRef.current);
        setLocation(data[0].display_name);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  useEffect(() => {
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (mapLoaded && showForm) {
      // Small delay to ensure the map container is rendered
      setTimeout(initializeMap, 100);
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, showForm]);

  const resetForm = () => {
    setName("");
    setLocation("");
    setSelectedCoords(null);
    setPricePerHour("");
    setOpen("06:00");
    setClose("22:00");
    setAmenities("");
    setImage("");
    setEditingTurf(null);
    // Remove marker and reset map view
    if (mapInstanceRef.current) {
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      mapInstanceRef.current.setView([20.5937, 78.9629], 5);
    }
  };

  const populateForm = (turf: Turf) => {
    setName(turf.name);
    // Handle both old string format and new object format
    if (typeof turf.location === 'string') {
      setLocation(turf.location);
      setSelectedCoords(null);
    } else {
      setLocation(turf.location.address);
      setSelectedCoords({ lat: turf.location.latitude, lng: turf.location.longitude });
    }
    setPricePerHour(turf.pricePerHour);
    setOpen(turf.operatingHours.open);
    setClose(turf.operatingHours.close);
    setAmenities(Array.isArray(turf.amenities) ? turf.amenities.join(', ') : '');
    setImage(turf.images?.[0] || '');
    setEditingTurf(turf);
    // If map is loaded and ref exists, show marker at turf location
    if (mapLoaded && mapInstanceRef.current && selectedCoords) {
      const L = (window as any).L;
      mapInstanceRef.current.setView([selectedCoords.lat, selectedCoords.lng], 15);
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker([selectedCoords.lat, selectedCoords.lng]).addTo(mapInstanceRef.current);
    }
  };

  async function fetchMine() {
    setLoading(true);
    try {
      const data = await apiRequest<{ turfs: Turf[] }>("/api/turfs/mine");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !location || !pricePerHour) return;
    
    setLoading(true);
    try {
      const payload = {
        name,
        location: selectedCoords ? {
          address: location,
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng
        } : location, // Fallback to string if no coordinates
        description: "",
        images: image ? [image] : [],
        pricePerHour: Number(pricePerHour),
        operatingHours: { open, close },
        amenities: amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };

      if (editingTurf) {
        await apiRequest(`/api/turfs/${editingTurf._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/turfs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      
      resetForm();
      setShowForm(false);
      await fetchMine();
    } finally {
      setLoading(false);
    }
  }

  async function deleteTurf(turfId: string) {
    if (!confirm('Are you sure you want to delete this turf?')) return;
    
    setLoading(true);
    try {
      await apiRequest(`/api/turfs/${turfId}`, {
        method: "DELETE",
      });
      await fetchMine();
    } catch (error) {
      console.error('Error deleting turf:', error);
      alert('Error deleting turf');
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (turf: Turf) => {
    populateForm(turf);
    setShowForm(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(!showForm);
  };

  // Get location display text
  const getLocationDisplay = (turfLocation: string | TurfLocation): string => {
    if (typeof turfLocation === 'string') {
      return turfLocation;
    }
    return turfLocation.address;
  };

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
          <Button variant="hero" onClick={handleAddNew}>
            {showForm ? "Close" : "Add Turf"}
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {editingTurf ? "Edit Turf" : "Add New Turf"}
            </h2>
            
            <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">Price per hour *</label>
                <Input 
                  type="number" 
                  value={pricePerHour} 
                  onChange={(e) => setPricePerHour(e.target.value === "" ? "" : Number(e.target.value))} 
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Open</label>
                  <Input type="time" value={open} onChange={(e) => setOpen(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Close</label>
                  <Input type="time" value={close} onChange={(e) => setClose(e.target.value)} />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Amenities (comma separated)</label>
                <Input placeholder="Parking, Washrooms, Floodlights" value={amenities} onChange={(e) => setAmenities(e.target.value)} />
              </div>
              
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Image URL (optional)</label>
                <Input placeholder="https://..." value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
              
              {/* Location Section */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Location *</label>
                <div className="mb-2 flex gap-2">
                  <Input 
                    placeholder="Search location or click on map"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => searchLocation(location)}
                  >
                    Search
                  </Button>
                </div>
                
                {/* Map Container */}
                <div className="h-64 w-full rounded border">
                  {mapLoaded ? (
                    <div ref={mapRef} className="h-full w-full rounded"></div>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-100 text-gray-500">
                      Loading map...
                    </div>
                  )}
                </div>
                
                {selectedCoords && (
                  <p className="mt-2 text-sm text-green-600">
                    Selected coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                  </p>
                )}
                
                <p className="mt-1 text-sm text-gray-500">
                  Click on the map to select the exact location of your turf
                </p>
              </div>
              
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? "Saving..." : (editingTurf ? "Update Turf" : "Create Turf")}
                </Button>
                {editingTurf && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Price/hr</th>
                <th className="p-3 text-left">Hours</th>
                <th className="p-3 text-left">Amenities</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="p-3" colSpan={6}>Loading...</td></tr>
              )}
              {!loading && turfs.length === 0 && (
                <tr><td className="p-3" colSpan={6}>No turfs yet. Use "Add Turf" to create your first one.</td></tr>
              )}
              {!loading && turfs.map((turf) => (
                <tr key={turf._id} className="border-t">
                  <td className="p-3 font-medium">{turf.name}</td>
                  <td className="p-3">
                    <div className="max-w-xs">
                      <div className="truncate" title={getLocationDisplay(turf.location)}>
                        {getLocationDisplay(turf.location)}
                      </div>
                      {typeof turf.location === 'object' && (
                        <div className="text-xs text-gray-500">
                          {turf.location.latitude.toFixed(4)}, {turf.location.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">₹{turf.pricePerHour}</td>
                  <td className="p-3">
                    {turf.operatingHours.open} - {turf.operatingHours.close}
                  </td>
                  <td className="p-3">
                    <div className="max-w-xs truncate">
                      {Array.isArray(turf.amenities) ? turf.amenities.join(', ') : ''}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleEdit(turf)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteTurf(turf._id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
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