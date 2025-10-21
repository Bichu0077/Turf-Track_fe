import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/auth";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Mail, 
  Camera, 
  Edit2, 
  Save, 
  X, 
  Trash2, 
  Shield,
  CheckCircle,
  AlertCircle,
  Calendar,
  Settings,
  Lock,
  Bell,
  Activity,
  MapPin,
  Phone,
  Building
} from "lucide-react";

// Helper function to format field names for display
const formatFieldName = (field: string): string => {
  const fieldMap: { [key: string]: string } = {
    'name': 'Full Name',
    'email': 'Email Address',
    'phone': 'Phone Number',
    'location': 'Location',
    'company': 'Company',
    'avatar': 'Profile Picture',
    'profile_pic': 'Profile Picture'
  };
  
  return fieldMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to get field icon
const getFieldIcon = (field: string) => {
  const iconMap: { [key: string]: any } = {
    'name': User,
    'email': Mail,
    'phone': Phone,
    'location': MapPin,
    'company': Building,
    'avatar': Camera,
    'profile_pic': Camera
  };
  
  return iconMap[field] || User;
};

export default function ProfilePage() {
  const { user, token, logout, refreshMe } = useAuth();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    company: user?.company || "",
    avatar: user?.avatar || user?.profile_pic || ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ originalSize?: string; compressedSize?: string }>({});

  // Change Password modal state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowChangePassword(false), 1200);
    } catch (err) {
      const msg = (err as Error).message || 'Failed to change password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  // Debug: Log user data to see what's available
  console.log('ProfilePage user data:', user);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  async function handleEdit() {
    setLoading(true);
    clearMessages();
    console.log('Profile update token:', token); // Debug log
    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: form.name.trim(), 
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim(),
          company: form.company.trim(),
          avatar: form.avatar
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update form state with the returned profile data to ensure consistency
      if (result.profile) {
        setForm({
          name: result.profile.name || "",
          email: result.profile.email || "",
          phone: result.profile.phone || "",
          location: result.profile.location || "",
          company: result.profile.company || "",
          avatar: result.profile.avatar || result.profile.profile_pic || ""
        });
      }
      
      await refreshMe();
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to delete account: ${response.statusText}`);
      }
      logout();
    } catch (e: any) {
      setError(e.message || "Failed to delete account");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    
    clearMessages();
    setImageUploading(true);
    
    // Create canvas for image compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions (max 300x300 for profile pics)
        const maxSize = 300;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed data URL (JPEG with 0.8 quality)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Check if compressed size is still too large
        const compressedSize = Math.ceil((compressedDataUrl.length * 3) / 4);
        if (compressedSize > 500 * 1024) { // 500KB limit for compressed
          setError("Image is still too large after compression. Please try a smaller image.");
          return;
        }
        
        // Update image info for display
        const formatSize = (bytes: number) => {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };
        
        setImageInfo({
          originalSize: formatSize(file.size),
          compressedSize: formatSize(compressedSize)
        });
        
        setForm(f => ({ ...f, avatar: compressedDataUrl }));
        setSuccess("Profile image updated successfully!");
        // Keep image info visible for a few seconds then clear
        setTimeout(() => setImageInfo({}), 5000);
      } catch (error) {
        setError("Failed to process image. Please try again.");
        setImageInfo({});
      } finally {
        setImageUploading(false);
      }
    };
    
    img.onerror = () => {
      setError("Failed to load image file");
      setImageUploading(false);
    };
    
    // Load image from file
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setError("Failed to read image file");
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      location: user?.location || "",
      company: user?.company || "",
      avatar: user?.avatar || user?.profile_pic || ""
    });
    setEditing(false);
    clearMessages();
    setImageInfo({});
  };

  // Update form when user data changes (e.g., after refreshMe)
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        company: user.company || "",
        avatar: user.avatar || user.profile_pic || ""
      });
    }
  }, [user]);

  async function loadActivities() {
    setActivityError(null);
    setActivityLoading(true);
    try {
      const response = await fetch(`/api/auth/activity?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setActivities(Array.isArray(data.activities) ? data.activities : []);
      setShowActivity(true);
    } catch (e: any) {
      setActivityError(e?.message || 'Failed to load activity');
      setShowActivity(true);
    } finally {
      setActivityLoading(false);
    }
  }

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: 'bg-red-50 text-red-700 border-red-200', icon: Shield };
      case 'moderator':
        return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Shield };
      case 'premium':
        return { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Shield };
      default:
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: User };
    }
  };

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <Helmet>
        <title>Profile Settings - TurfTrack</title>
        <meta name="description" content="Manage your TurfTrack profile and account settings." />
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-green-100 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-green-100 shadow-lg">
                <AvatarImage src={form.avatar} alt={user.name} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-green-100 to-green-200 text-green-700">
                  {user.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="absolute -bottom-1 -right-1 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imageUploading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex items-center space-x-3 mt-3">
                <Badge className={`${roleConfig.color} px-3 py-1 text-sm font-medium border`}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
                <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1 text-sm">
                  <Activity className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: 'Profile Information', icon: User },
              { id: 'security', label: 'Security', icon: Lock },
              { id: 'notifications', label: 'Notifications', icon: Bell }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                      <p className="text-gray-600 mt-1">Update your account details and personal information.</p>
                    </div>
                    {!editing && (
                      <Button 
                        onClick={() => setEditing(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: JPEG/PNG under 5MB. Images will be automatically compressed to 300x300px.
                  </p>
                  {imageUploading && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600 mt-2">
                      <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Processing image...</span>
                    </div>
                  )}
                  {imageInfo.originalSize && imageInfo.compressedSize && (
                    <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      <span className="font-medium">Compression:</span> {imageInfo.originalSize} → {imageInfo.compressedSize}
                    </div>
                  )}
                  {editing ? (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="flex items-center text-sm font-medium text-gray-700">
                            <User className="h-4 w-4 mr-2 text-green-600" />
                            Full Name
                          </label>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center text-sm font-medium text-gray-700">
                            <Mail className="h-4 w-4 mr-2 text-green-600" />
                            Email Address
                          </label>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center text-sm font-medium text-gray-700">
                            <Phone className="h-4 w-4 mr-2 text-green-600" />
                            Phone Number
                          </label>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center text-sm font-medium text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-green-600" />
                            Location
                          </label>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            type="text"
                            value={form.location}
                            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                            placeholder="Enter your location"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="flex items-center text-sm font-medium text-gray-700">
                            <Building className="h-4 w-4 mr-2 text-green-600" />
                            Company/Organization
                          </label>
                          <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            type="text"
                            value={form.company}
                            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                            placeholder="Enter your company or organization"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-6 border-t border-gray-100">
                        <Button 
                          onClick={handleEdit}
                          disabled={loading || !form.name.trim() || !form.email.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                        >
                          {loading ? (
                            <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                          disabled={loading}
                          className="px-8 py-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm font-medium text-gray-500">
                            <User className="h-4 w-4 mr-2" />
                            Full Name
                          </div>
                          <p className="text-lg text-gray-900 font-medium">{user.name}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm font-medium text-gray-500">
                            <Mail className="h-4 w-4 mr-2" />
                            Email Address
                          </div>
                          <p className="text-lg text-gray-900 font-medium">{user.email}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm font-medium text-gray-500">
                            <Phone className="h-4 w-4 mr-2" />
                            Phone Number
                          </div>
                          <p className="text-lg text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm font-medium text-gray-500">
                            <MapPin className="h-4 w-4 mr-2" />
                            Location
                          </div>
                          <p className="text-lg text-gray-900 font-medium">{user.location || 'Not provided'}</p>
                        </div>
                        <div className="space-y-3 md:col-span-2">
                          <div className="flex items-center text-sm font-medium text-gray-500">
                            <Building className="h-4 w-4 mr-2" />
                            Company/Organization
                          </div>
                          <p className="text-lg text-gray-900 font-medium">{user.company || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                  <p className="text-gray-600 mt-1">Manage your account security and privacy settings.</p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Password</h3>
                        <p className="text-gray-600 mt-1">Last updated 30 days ago</p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => setShowChangePassword(true)}
                      >
                        Change Password
                      </Button>
            {/* Change Password Modal */}
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <Input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      minLength={6}
                      required
                    />
                  </div>
                  {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
                  {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowChangePassword(false)} disabled={passwordLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-green-600 text-white" disabled={passwordLoading}>
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-gray-600 mt-1">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                        Enable 2FA
                      </Button>
                    </div>
                    <div className="border-t border-red-100 pt-8">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
                        <p className="text-red-700 mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-gray-600 mt-1">Choose how you want to be notified about updates and activities.</p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {[
                      { title: 'Email Notifications', desc: 'Receive email updates about your account activity' },
                      { title: 'SMS Notifications', desc: 'Get text message alerts for important updates' },
                      { title: 'Push Notifications', desc: 'Browser notifications for real-time updates' },
                      { title: 'Marketing Emails', desc: 'Receive promotional emails and product updates' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Account Summary</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium text-gray-900">
                    {(() => {
                      try {
                        const dateStr = user.memberSince || user.createdAt;
                        if (!dateStr) return 'N/A';
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return 'N/A';
                        return date.toLocaleDateString();
                        } catch (error) {
                        console.error('Error formatting member since date:', error);
                        return 'N/A';
                      }
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Account Type</span>
                  <Badge className={roleConfig.color}>{user.role}</Badge>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <Badge className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Last Login</span>
                  <span className="font-medium text-gray-900">
                    {(() => {
                      try {
                        if (!user.lastLoginAt) return 'Today';
                        const date = new Date(user.lastLoginAt);
                        if (isNaN(date.getTime())) return 'Today';
                        return date.toLocaleDateString();
                      } catch (error) {
                        console.error('Error formatting last login date:', error);
                        return 'Today';
                      }
                    })()}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={loadActivities}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Activity
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <Trash2 className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
                    <p className="text-gray-600">
                      Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be removed.
                    </p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loading ? (
                        <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      {/* Activity Modal */}
      <Dialog open={showActivity} onOpenChange={setShowActivity}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Recent Activity</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-auto pr-2" style={{scrollbarWidth: 'thin'}}>
            {activityLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-600">Loading activity...</span>
              </div>
            )}
            {activityError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{activityError}</AlertDescription>
              </Alert>
            )}
            {!activityLoading && !activityError && activities.length === 0 && (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 text-sm font-medium text-gray-900">No recent activity</div>
                <div className="mt-2 text-sm text-gray-600">
                  Your profile changes and account updates will appear here.
                </div>
              </div>
            )}
            {!activityLoading && activities.map((a) => (
              <div key={a.id} className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-full flex-shrink-0 ${
                        a.type === 'profile_update' ? 'bg-blue-100' : 
                        a.type === 'email_update' ? 'bg-green-100' : 
                        a.type === 'password_change' ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        {a.type === 'profile_update' && <Edit2 className="h-3 w-3 text-blue-600" />}
                        {a.type === 'email_update' && <Mail className="h-3 w-3 text-green-600" />}
                        {a.type === 'password_change' && <Lock className="h-3 w-3 text-orange-600" />}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{a.message}</div>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0 ml-4 bg-white px-2 py-1 rounded-full">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                {a.type === 'profile_update' && a.details?.changed && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(a.details.changed).map(([field, diff]: any) => (
                      <div key={field} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        {(() => {
                          const IconComponent = getFieldIcon(field);
                          return <IconComponent className="h-4 w-4 text-gray-600" />;
                        })()}
                        <div className="text-xs font-semibold text-gray-800">
                          {formatFieldName(field)}
                        </div>
                      </div>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded flex-shrink-0">
                              Before
                            </span>
                            <div className="text-xs text-gray-700 bg-white px-3 py-2 rounded border flex-1 min-w-0">
                              {diff.from ? String(diff.from) : <span className="italic text-gray-400">Empty</span>}
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded flex-shrink-0">
                              After
                            </span>
                            <div className="text-xs text-gray-700 bg-white px-3 py-2 rounded border flex-1 min-w-0">
                              {diff.to ? String(diff.to) : <span className="italic text-gray-400">Empty</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {a.type === 'email_update' && (
                  <div className="mt-3">
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <div className="text-xs font-semibold text-gray-800">
                          Email Address
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded flex-shrink-0">
                            Before
                          </span>
                          <div className="text-xs text-gray-700 bg-white px-3 py-2 rounded border flex-1 min-w-0">
                            {a.details?.from ? String(a.details.from) : <span className="italic text-gray-400">Empty</span>}
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded flex-shrink-0">
                            After
                          </span>
                          <div className="text-xs text-gray-700 bg-white px-3 py-2 rounded border flex-1 min-w-0">
                            {a.details?.to ? String(a.details.to) : <span className="italic text-gray-400">Empty</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {a.type === 'password_change' && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-orange-600" />
                      <div className="text-sm text-orange-800 font-medium">
                        Password was successfully updated for security
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivity(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
