import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Star,
  Users,
  Calendar,
  Image as ImageIcon,
  Activity
} from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
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
  
  // New states for enhanced UI
  const [viewTurf, setViewTurf] = useState<Turf | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [pricePerHour, setPricePerHour] = useState<number | "">("");
  const [open, setOpen] = useState("06:00");
  const [close, setClose] = useState("22:00");
  const [amenities, setAmenities] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
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
    setImageFile(null);
    // Clean up blob URL if it exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
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
    // For existing turfs, show the current image as preview (URL-based)
    setImageFile(null);
    setImagePreview(turf.images?.[0] || '');
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

  // Cleanup image preview URL on component unmount or when image changes
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Get location display text - moved here to be available for useMemo hooks
  const getLocationDisplay = (turfLocation: string | TurfLocation): string => {
    if (typeof turfLocation === 'string') {
      return turfLocation;
    }
    return turfLocation.address;
  };

  // Filter turfs based on search
  const filteredTurfs = useMemo(() => {
    return turfs.filter(turf => {
      const locationText = getLocationDisplay(turf.location);
      const amenitiesText = Array.isArray(turf.amenities) ? turf.amenities.join(' ') : '';
      
      return (
        turf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        locationText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amenitiesText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [turfs, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const totalTurfs = turfs.length;
    const avgPrice = turfs.length > 0 ? turfs.reduce((sum, turf) => sum + turf.pricePerHour, 0) / turfs.length : 0;
    const mostExpensive = turfs.length > 0 ? Math.max(...turfs.map(t => t.pricePerHour)) : 0;
    const cheapest = turfs.length > 0 ? Math.min(...turfs.map(t => t.pricePerHour)) : 0;
    
    return { totalTurfs, avgPrice, mostExpensive, cheapest };
  }, [turfs]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !location || !pricePerHour) return;
    
    setLoading(true);
    try {
      let imageUrl = '';
      
      // Use base64 image data if available
      if (imagePreview) {
        imageUrl = imagePreview; // This is already base64 data URL
      }
      
      const payload = {
        name,
        location: selectedCoords ? {
          address: location,
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng
        } : location, // Fallback to string if no coordinates
        description: "",
        images: imageUrl ? [imageUrl] : [],
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

  // Handle image file selection and convert to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
        alert('Please select a JPG file only');
        return;
      }
      
      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setImageFile(file);
        setImagePreview(base64String); // This will be the base64 data URL
      };
      reader.onerror = () => {
        alert('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  // No upload function needed - we store base64 directly in the database

  // Helper component for turf cards
  const TurfCard = ({ turf }: { turf: Turf }) => (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{turf.name}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[200px]" title={getLocationDisplay(turf.location)}>
                {getLocationDisplay(turf.location)}
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg font-semibold">
            ₹{turf.pricePerHour}/hr
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Turf Image */}
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          {turf.images?.[0] ? (
            <img 
              src={turf.images[0]} 
              alt={turf.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Operating Hours */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{turf.operatingHours.open} - {turf.operatingHours.close}</span>
        </div>
        
        {/* Amenities */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Amenities:</div>
          <div className="flex flex-wrap gap-1">
            {Array.isArray(turf.amenities) && turf.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {amenity.trim()}
              </Badge>
            ))}
            {Array.isArray(turf.amenities) && turf.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{turf.amenities.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewTurf(turf)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleEdit(turf)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteTurf(turf._id)}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8 space-y-6">
        <Helmet>
          <title>Manage Turfs</title>
          <meta name="description" content="Create, edit and delete turfs." />
          <link rel="canonical" href="/admin/turfs" />
        </Helmet>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Turf Management</h1>
            <p className="text-muted-foreground">Manage your turf facilities and settings</p>
          </div>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {showForm ? "Close Form" : "Add New Turf"}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Total Turfs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTurfs}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Average Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.round(stats.avgPrice)}</div>
              <p className="text-xs text-muted-foreground">per hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-600" />
                Highest Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.mostExpensive}</div>
              <p className="text-xs text-muted-foreground">per hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                Lowest Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.cheapest}</div>
              <p className="text-xs text-muted-foreground">per hour</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, location, or amenities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                disabled={!searchTerm}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Turf Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingTurf ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingTurf ? "Edit Turf" : "Add New Turf"}
              </CardTitle>
            </CardHeader>
            <CardContent>
            
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
                <label className="mb-1 block text-sm font-medium">Turf Image (JPG only)</label>
                <Input 
                  type="file" 
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleImageChange}
                  className="mb-2"
                />
                <p className="text-sm text-gray-500 mb-2">
                  Upload a JPG image. Maximum size: 5MB. Image will be stored in the database.
                </p>
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                    <img 
                      src={imagePreview} 
                      alt="Turf preview" 
                      className="h-32 w-48 object-cover rounded border"
                    />
                  </div>
                )}
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
            </CardContent>
          </Card>
        )}

        {/* Turfs Display */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTurfs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No matching turfs found" : "No turfs yet"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms"
                  : "Create your first turf to get started with bookings"
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Turf
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTurfs.map((turf) => (
              <TurfCard key={turf._id} turf={turf} />
            ))}
          </div>
        )}

        {/* Turf Details Modal */}
        <Dialog open={!!viewTurf} onOpenChange={(open) => !open && setViewTurf(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <MapPin className="w-5 h-5" />
                {viewTurf?.name}
              </DialogTitle>
            </DialogHeader>
            {viewTurf && (
              <div className="space-y-6">
                {/* Turf Image */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {viewTurf.images?.[0] ? (
                    <img 
                      src={viewTurf.images[0]} 
                      alt={viewTurf.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">No image available</span>
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Turf Name</label>
                    <p className="font-medium text-lg">{viewTurf.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price per Hour</label>
                    <p className="font-bold text-xl text-green-600">₹{viewTurf.pricePerHour}</p>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Details
                  </h3>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="font-medium">{getLocationDisplay(viewTurf.location)}</p>
                    </div>
                    {typeof viewTurf.location === 'object' && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                        <p className="font-mono text-sm">
                          {viewTurf.location.latitude.toFixed(6)}, {viewTurf.location.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Operating Hours
                  </h3>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Daily Hours:</span>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {viewTurf.operatingHours.open} - {viewTurf.operatingHours.close}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Available Amenities
                  </h3>
                  <div className="p-4 border rounded-lg">
                    {Array.isArray(viewTurf.amenities) && viewTurf.amenities.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {viewTurf.amenities.map((amenity, index) => (
                          <Badge key={index} variant="secondary" className="justify-center">
                            {amenity.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No amenities listed</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* System Information */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
                  <div className="text-sm">
                    <div>
                      <span className="text-muted-foreground">Turf ID: </span>
                      <span className="font-mono">{viewTurf._id}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewTurf(null)}>
                Close
              </Button>
              <Button onClick={() => {
                setViewTurf(null);
                handleEdit(viewTurf!);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Turf
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
}