// Edit Listing Page - Edit existing material listing
import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Save,
  Package, 
  MapPin, 
  Truck, 
  Plus,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useCategories } from "@/hooks";
import { materialsService } from "@/api/services";
import { ROUTES } from "@/config/constants";

interface FormState {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: string;
  circularActionType: string;
  quantity: number;
  unit: string;
  estimatedWeight: number;
  priceType: "free" | "negotiable" | "fixed";
  price: number;
  images: string[];
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  logisticsOptions: {
    selfPickup: boolean;
    deliveryAvailable: boolean;
    deliveryRadius: number;
  };
}

const EditListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];

  useEffect(() => {
    if (!id) return;
    const loadMaterial = async () => {
      try {
        const res = await materialsService.getOne(id);
        const m = res.data?.material || res.data;
        setFormData({
          title: m.title || "",
          description: m.description || "",
          category: m.category?._id || m.category || "",
          subcategory: m.subcategory || "",
          condition: m.condition || "good",
          circularActionType: m.circularActionType || "reuse",
          quantity: m.quantity || 1,
          unit: m.unit || "pieces",
          estimatedWeight: m.estimatedWeight || 0,
          priceType: m.priceType || "free",
          price: m.price || 0,
          images: m.images?.map((img: any) => typeof img === "string" ? img : img.url) || [""],
          address: {
            street: m.address?.street || "",
            city: m.address?.city || "",
            state: m.address?.state || "",
            pincode: m.address?.pincode || "",
          },
          logisticsOptions: {
            selfPickup: m.logisticsOptions?.selfPickup ?? true,
            deliveryAvailable: m.logisticsOptions?.deliveryAvailable ?? false,
            deliveryRadius: m.logisticsOptions?.deliveryRadius ?? 10,
          },
        });
      } catch {
        setError("Failed to load listing details.");
      } finally {
        setIsLoading(false);
      }
    };
    loadMaterial();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof FormState] as any),
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const addImageField = () => {
    if (formData && formData.images.length < 5) {
      setFormData(prev => prev ? { ...prev, images: [...prev.images, ""] } : prev);
    }
  };

  const removeImageField = (index: number) => {
    setFormData(prev => prev ? {
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    } : prev);
  };

  const handleImageChange = (index: number, value: string) => {
    if (!formData) return;
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => prev ? { ...prev, images: newImages } : prev);
  };

  const handleSubmit = async () => {
    if (!formData || !id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const cleanedData = {
        ...formData,
        images: formData.images.filter(img => img.trim() !== "").map((url, i) => ({ url, isPrimary: i === 0 })),
      };
      const result = await materialsService.update(id, cleanedData as any);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => navigate(ROUTES.MATERIAL_DETAILS.replace(":id", id)), 1000);
      } else {
        setError(result.message || "Failed to update listing");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!formData) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-400">{error || "Listing not found."}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-emerald-400 text-sm font-medium hover:underline">Go back</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Listing</h1>
            <p className="text-neutral-400 text-sm mt-1">Update your material listing details.</p>
          </div>
        </div>

        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
            Listing updated successfully! Redirecting...
          </motion.div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <section className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-emerald-400" /> Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Title</label>
            <input type="text" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Category</label>
              <select value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors appearance-none">
                <option value="">Select Category</option>
                {categories.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Subcategory</label>
              <input type="text" value={formData.subcategory} onChange={(e) => handleInputChange('subcategory', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Condition</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['new', 'like_new', 'good', 'fair', 'salvage'].map(c => (
                <button key={c} onClick={() => handleInputChange('condition', c)} className={`px-3 py-2 rounded-lg text-xs font-medium border capitalize transition-all ${formData.condition === c ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-neutral-800 border-neutral-700 text-neutral-500"}`}>{c.replace('_', ' ')}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Circular Action Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { value: 'reuse', label: '♻️ Reuse', desc: 'Use as-is' },
                { value: 'recycle', label: '🔄 Recycle', desc: 'Send for recycling' },
                { value: 'upcycle', label: '⬆️ Upcycle', desc: 'Transform to higher value' },
                { value: 'repair', label: '🔧 Repair', desc: 'Fix & restore' },
                { value: 'compost', label: '🌱 Compost', desc: 'Organic composting' },
                { value: 'donate', label: '🤝 Donate', desc: 'Give to someone in need' },
              ].map(a => (
                <button key={a.value} onClick={() => handleInputChange('circularActionType', a.value)} className={`px-3 py-3 rounded-xl text-left border transition-all ${formData.circularActionType === a.value ? "bg-emerald-500/20 border-emerald-500" : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"}`}>
                  <div className={`text-sm font-medium ${formData.circularActionType === a.value ? 'text-emerald-400' : 'text-neutral-300'}`}>{a.label}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{a.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Description</label>
            <textarea rows={4} value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors resize-none" />
          </div>
        </section>

        {/* Quantity & Pricing */}
        <section className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Quantity & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Quantity</label>
              <div className="flex gap-2">
                <input type="number" min={1} value={formData.quantity} onChange={(e) => handleInputChange('quantity', Number(e.target.value))} className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
                <select value={formData.unit} onChange={(e) => handleInputChange('unit', e.target.value)} className="w-28 px-2 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors">
                  <option value="pieces">Pieces</option>
                  <option value="kg">kg</option>
                  <option value="tons">Tons</option>
                  <option value="liters">Liters</option>
                  <option value="units">Units</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Price Type</label>
              <div className="flex gap-2">
                {(['free', 'negotiable', 'fixed'] as const).map(t => (
                  <button key={t} onClick={() => handleInputChange('priceType', t)} className={`flex-1 px-3 py-3 rounded-xl text-xs font-semibold border capitalize transition-all ${formData.priceType === t ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-neutral-800 border-neutral-700 text-neutral-500"}`}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Estimated Weight (kg)</label>
            <p className="text-xs text-neutral-500 mb-2">Used for environmental impact calculation</p>
            <input type="number" min={0} step={0.1} placeholder="e.g. 50" value={formData.estimatedWeight || ''} onChange={(e) => handleInputChange('estimatedWeight', Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
          </div>
          {formData.priceType !== 'free' && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Price (INR)</label>
              <input type="number" value={formData.price} onChange={(e) => handleInputChange('price', Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
            </div>
          )}
        </section>

        {/* Images */}
        <section className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Images</h2>
          <div className="space-y-3">
            {formData.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" placeholder="https://example.com/image.jpg" value={img} onChange={(e) => handleImageChange(i, e.target.value)} className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
                {formData.images.length > 1 && (
                  <button onClick={() => removeImageField(i)} className="px-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">-</button>
                )}
              </div>
            ))}
            {formData.images.length < 5 && (
              <button onClick={addImageField} className="text-emerald-400 text-sm font-medium flex items-center gap-1 hover:underline"><Plus className="w-4 h-4" /> Add image</button>
            )}
          </div>
        </section>

        {/* Location */}
        <section className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-400" /> Location</h2>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Street Address</label>
            <input type="text" value={formData.address.street} onChange={(e) => handleInputChange('address.street', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">City</label>
              <input type="text" value={formData.address.city} onChange={(e) => handleInputChange('address.city', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">State</label>
              <input type="text" value={formData.address.state} onChange={(e) => handleInputChange('address.state', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">PIN Code</label>
            <input type="text" value={formData.address.pincode} onChange={(e) => handleInputChange('address.pincode', e.target.value)} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors" />
          </div>
        </section>

        {/* Logistics */}
        <section className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Truck className="w-5 h-5 text-emerald-400" /> Logistics</h2>
          <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50">
            <div>
              <p className="text-sm font-medium text-white">Self Pickup</p>
              <p className="text-xs text-neutral-500">Enable users to come and pick up materials</p>
            </div>
            <button onClick={() => handleInputChange('logisticsOptions.selfPickup', !formData.logisticsOptions.selfPickup)} className={`w-12 h-6 rounded-full transition-colors relative ${formData.logisticsOptions.selfPickup ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.logisticsOptions.selfPickup ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50">
            <div>
              <p className="text-sm font-medium text-white">Delivery Available</p>
              <p className="text-xs text-neutral-500">I can provide delivery for these materials</p>
            </div>
            <button onClick={() => handleInputChange('logisticsOptions.deliveryAvailable', !formData.logisticsOptions.deliveryAvailable)} className={`w-12 h-6 rounded-full transition-colors relative ${formData.logisticsOptions.deliveryAvailable ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.logisticsOptions.deliveryAvailable ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          {formData.logisticsOptions.deliveryAvailable && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Delivery Radius (km)</label>
              <input type="range" min={1} max={50} value={formData.logisticsOptions.deliveryRadius} onChange={(e) => handleInputChange('logisticsOptions.deliveryRadius', Number(e.target.value))} className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg" />
              <div className="flex justify-between text-[10px] text-neutral-500 mt-2 uppercase font-bold">
                <span>1 km</span>
                <span>{formData.logisticsOptions.deliveryRadius} km</span>
                <span>50 km</span>
              </div>
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button onClick={() => navigate(-1)} className="px-6 py-3 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-700 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl font-bold flex items-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95 shadow-lg shadow-emerald-900/40 disabled:opacity-50">
            {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>) : (<><Save className="w-5 h-5" /> Save Changes</>)}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditListingPage;
