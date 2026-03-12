// Profile Page - User profile view and edit
import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Star, 
  TrendingUp, 
  Package, 
  ArrowLeftRight,
  Edit2,
  Save,
  X,
  Camera,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useAppSelector, useAppDispatch } from "@/hooks";
import { authService } from "@/api/services";
import { updateUser } from "@/store/authSlice";

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state) => state.auth.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        company: userData.company || "",
        location: {
          address: userData.location?.address || "",
          city: userData.location?.city || "",
          state: userData.location?.state || "",
          country: userData.location?.country || "",
          postalCode: userData.location?.postalCode || "",
        }
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      const result = await authService.updateProfile(formData);
      if (result.success) {
        dispatch(updateUser(result.data));
        setIsEditing(false);
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("An error occurred while updating your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userData) {
    return (
      <DashboardLayout>
        <div className="h-96 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const impactStats = [
    { label: "Materials Saved", value: userData.stats?.materialsSaved || 0, icon: Package, color: "bg-emerald-500/10 text-emerald-400" },
    { label: "CO₂ (kg) Prevented", value: userData.stats?.co2Prevented || 0, icon: TrendingUp, color: "bg-blue-500/10 text-blue-400" },
    { label: "Total Transactions", value: userData.stats?.totalTransactions || 0, icon: ArrowLeftRight, color: "bg-amber-500/10 text-amber-400" },
    { label: "Community Rating", value: userData.stats?.rating || "N/A", icon: Star, color: "bg-purple-500/10 text-purple-400" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Profile Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900/40 border border-neutral-800/50 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 pointer-events-none"></div>
          
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-neutral-800 overflow-hidden bg-neutral-800 flex items-center justify-center">
                {userData.avatar ? (
                  <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-16 h-16 text-neutral-600" />
                )}
              </div>
              <button className="absolute bottom-1 right-1 p-2.5 bg-emerald-500 text-neutral-950 rounded-full hover:bg-emerald-400 transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white leading-tight">{userData.name}</h1>
                {userData.isVerified && (
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                )}
              </div>
              <p className="text-neutral-400 text-lg mb-4 flex items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-neutral-800 rounded-full text-xs font-bold uppercase tracking-wider text-neutral-300">
                  {userData.role}
                </span>
                <span className="text-neutral-600">•</span>
                <span className="flex items-center gap-1.5 opacity-80">
                  <Calendar className="w-4 h-4" />
                  Member since {new Date(userData.createdAt).getFullYear()}
                </span>
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-neutral-700"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-neutral-700"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {impactStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900/40 border border-neutral-800/50 p-6 rounded-3xl group hover:border-emerald-500/30 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Info */}
          <section className="bg-neutral-900/40 border border-neutral-800/50 p-8 rounded-3xl space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-emerald-500" /> Personal Information
            </h2>
            
            <div className="space-y-6">
              {[
                { label: "Full Name", field: "name", icon: UserIcon, placeholder: "Your Name" },
                { label: "Email Address", field: "email", icon: Mail, type: "email", placeholder: "you@example.com" },
                { label: "Phone Number", field: "phone", icon: Phone, placeholder: "+91 XXXXX XXXXX" },
                { label: "Company / Business", field: "company", icon: Briefcase, placeholder: "Optional business name" },
              ].map((input) => (
                <div key={input.field} className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-1">{input.label}</label>
                  <div className="relative group">
                    <input.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                    <input
                      type={input.type || "text"}
                      disabled={!isEditing}
                      value={formData?.[input.field] || ""}
                      onChange={(e) => setFormData({ ...formData, [input.field]: e.target.value })}
                      placeholder={input.placeholder}
                      className={`w-full bg-black/40 border rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-700 transition-all focus:outline-none ${
                        isEditing 
                          ? "border-emerald-500/30 focus:border-emerald-500/50 bg-emerald-500/5" 
                          : "border-neutral-800 cursor-not-allowed opacity-80"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Location Info */}
          <section className="bg-neutral-900/40 border border-neutral-800/50 p-8 rounded-3xl space-y-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500" /> Location Details
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-1">Street Address</label>
                <textarea
                  disabled={!isEditing}
                  rows={2}
                  value={formData?.location?.address || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                  className={`w-full bg-black/40 border rounded-2xl p-4 text-sm text-white focus:outline-none transition-all ${
                    isEditing ? "border-emerald-500/30 focus:border-emerald-500/50" : "border-neutral-800"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "City", field: "city" },
                  { label: "State", field: "state" },
                  { label: "Country", field: "country" },
                  { label: "Postal Code", field: "postalCode" },
                ].map((loc) => (
                  <div key={loc.field} className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest px-1">{loc.label}</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={formData?.location?.[loc.field] || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, [loc.field]: e.target.value }
                      })}
                      className={`w-full bg-black/40 border rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all ${
                        isEditing ? "border-emerald-500/30 focus:border-emerald-500/50" : "border-neutral-800"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-400 mb-1">Privacy Guarantee</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Your full address is only shared with partners after a transaction is confirmed and scheduled for pickup.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
