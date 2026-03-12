// Create Listing Page - Multi-step form for listing new materials
import React, { useState, useEffect } from "react";
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  Package, 
  Tag, 
  MapPin, 
  Truck, 
  Check,
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  quantity: number;
  unit: string;
  priceType: "free" | "negotiable" | "fixed";
  price: number;
  images: string[];
  tags: string[];
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  logisticsOptions: {
    selfPickup: boolean;
    deliveryAvailable: boolean;
    deliveryRadius: number;
  };
}

const INITIAL_FORM_STATE: FormState = {
  title: "",
  description: "",
  category: "",
  subcategory: "",
  condition: "good",
  circularActionType: "reuse",
  quantity: 1,
  unit: "pieces",
  estimatedWeight: 0,
  priceType: "free",
  price: 0,
  images: [""],
  tags: [],
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
  },
  location: {
    type: "Point",
    coordinates: [72.8777, 19.0760], // Default Mumbai
  },
  logisticsOptions: {
    selfPickup: true,
    deliveryAvailable: false,
    deliveryRadius: 10,
  },
};

const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: categoriesData, loading: loadingCategories } = useCategories();
  const categories = categoriesData?.categories || [];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
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
    if (formData.images.length < 5) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ""] }));
    }
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Filter out empty image URLs
      const cleanedData = {
        ...formData,
        images: formData.images.filter(img => img.trim() !== "").map(url => ({ url, isPrimary: false })),
        // Set first image as primary if exists
      };
      if (cleanedData.images.length > 0) cleanedData.images[0].isPrimary = true;

      const result = await materialsService.create(cleanedData as any);
      if (result.success) {
        navigate(ROUTES.LISTINGS);
      } else {
        setError(result.message || "Failed to create listing");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Basic validation
    if (step === 1 && (!formData.title || !formData.category)) {
      alert("Please enter a title and select a category");
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const STEPS = [
    { title: "Basic Info", icon: Info },
    { title: "Details", icon: Package },
    { title: "Location", icon: MapPin },
    { title: "Logistics", icon: Truck },
    { title: "Confirm", icon: Check },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Listing</h1>
            <p className="text-neutral-400">Join the circular economy by giving your surplus materials a second life.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between relative mb-12">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                step > i + 1 ? "bg-emerald-500 text-neutral-950" : 
                step === i + 1 ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400" : 
                "bg-neutral-800 text-neutral-500 border border-neutral-700"
              }`}>
                {step > i + 1 ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] mt-2 font-medium uppercase tracking-wider ${
                step === i + 1 ? "text-emerald-400" : "text-neutral-500"
              }`}>
                {s.title}
              </span>
            </div>
          ))}
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-[1px] bg-neutral-800 -z-0" />
          <div 
            className="absolute top-5 left-0 h-[1px] bg-emerald-500 transition-all duration-500 -z-0" 
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-6 md:p-8 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Material Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Industrial Grade Wooden Pallets"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors appearance-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Subcategory (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Shipping Pallets"
                        value={formData.subcategory}
                        onChange={(e) => handleInputChange('subcategory', e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Condition</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {['new', 'like_new', 'good', 'fair', 'salvage'].map(c => (
                        <button
                          key={c}
                          onClick={() => handleInputChange('condition', c)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border capitalize transition-all ${
                            formData.condition === c 
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                              : "bg-neutral-800 border-neutral-700 text-neutral-500"
                          }`}
                        >
                          {c.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Circular Action Type</label>
                    <p className="text-xs text-neutral-500 mb-3">How will this material contribute to the circular economy?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'reuse', label: '♻️ Reuse', desc: 'Use as-is' },
                        { value: 'recycle', label: '🔄 Recycle', desc: 'Send for recycling' },
                        { value: 'upcycle', label: '⬆️ Upcycle', desc: 'Transform to higher value' },
                        { value: 'repair', label: '🔧 Repair', desc: 'Fix & restore' },
                        { value: 'compost', label: '🌱 Compost', desc: 'Organic composting' },
                        { value: 'donate', label: '🤝 Donate', desc: 'Give to someone in need' },
                      ].map(a => (
                        <button
                          key={a.value}
                          onClick={() => handleInputChange('circularActionType', a.value)}
                          className={`px-3 py-3 rounded-xl text-left border transition-all ${
                            formData.circularActionType === a.value
                              ? "bg-emerald-500/20 border-emerald-500"
                              : "bg-neutral-800 border-neutral-700 hover:border-neutral-600"
                          }`}
                        >
                          <div className={`text-sm font-medium ${formData.circularActionType === a.value ? 'text-emerald-400' : 'text-neutral-300'}`}>{a.label}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">{a.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Description</label>
                    <textarea
                      rows={4}
                      placeholder="Describe the material, its quality, previous use, and any other relevant details..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Quantity</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          value={formData.quantity}
                          onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                          className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                        />
                        <select
                          value={formData.unit}
                          onChange={(e) => handleInputChange('unit', e.target.value)}
                          className="w-28 px-2 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                        >
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
                        {['free', 'negotiable', 'fixed'].map(t => (
                          <button
                            key={t}
                            onClick={() => handleInputChange('priceType', t)}
                            className={`flex-1 px-3 py-3 rounded-xl text-xs font-semibold border capitalize transition-all ${
                              formData.priceType === t 
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                                : "bg-neutral-800 border-neutral-700 text-neutral-500"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Estimated Weight (kg)</label>
                    <p className="text-xs text-neutral-500 mb-2">Used for environmental impact calculation. Enter total weight in kilograms.</p>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      placeholder="e.g. 50"
                      value={formData.estimatedWeight || ''}
                      onChange={(e) => handleInputChange('estimatedWeight', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {formData.priceType !== 'free' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Price (INR)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Image URLs (Max 5)</label>
                    <div className="space-y-3">
                      {formData.images.map((img, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://example.com/image.jpg"
                            value={img}
                            onChange={(e) => handleImageChange(i, e.target.value)}
                            className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                          />
                          {formData.images.length > 1 && (
                            <button 
                              onClick={() => removeImageField(i)}
                              className="px-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                      {formData.images.length < 5 && (
                        <button 
                          onClick={addImageField}
                          className="text-emerald-400 text-sm font-medium flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-4 h-4" /> Add another image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Location */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 123 Industrial Estate"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">City</label>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">State</label>
                      <input
                        type="text"
                        placeholder="Maharashtra"
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">PIN Code</label>
                    <input
                      type="text"
                      placeholder="400001"
                      value={formData.address.pincode}
                      onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex gap-3">
                    <Info className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Your precise location will be shared with the seeker only after you approve their material request.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Logistics */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50">
                      <div className="flex gap-3">
                        <Package className="w-6 h-6 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Self Pickup</p>
                          <p className="text-xs text-neutral-500">Enable users to come and pick up materials</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleInputChange('logisticsOptions.selfPickup', !formData.logisticsOptions.selfPickup)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.logisticsOptions.selfPickup ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.logisticsOptions.selfPickup ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50">
                      <div className="flex gap-3">
                        <Truck className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Delivery Available</p>
                          <p className="text-xs text-neutral-500">I can provide delivery for these materials</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleInputChange('logisticsOptions.deliveryAvailable', !formData.logisticsOptions.deliveryAvailable)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.logisticsOptions.deliveryAvailable ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.logisticsOptions.deliveryAvailable ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  {formData.logisticsOptions.deliveryAvailable && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">Delivery Radius (km)</label>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={formData.logisticsOptions.deliveryRadius}
                        onChange={(e) => handleInputChange('logisticsOptions.deliveryRadius', Number(e.target.value))}
                        className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-neutral-500 mt-2 uppercase font-bold tracking-widest">
                        <span>1 km</span>
                        <span>{formData.logisticsOptions.deliveryRadius} km</span>
                        <span>50 km</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 5: Confirm */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
                    <Check className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-white">Almost Ready!</h3>
                    <p className="text-sm text-neutral-400">Review your listing details before publishing.</p>
                  </div>

                  <div className="space-y-4 px-2">
                    <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                      <span className="text-sm text-neutral-500">Title</span>
                      <span className="text-sm text-white font-medium">{formData.title}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                      <span className="text-sm text-neutral-500">Category</span>
                      <span className="text-sm text-white font-medium">
                        {categories.find(c => c._id === formData.category)?.name || 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                      <span className="text-sm text-neutral-500">Quantity</span>
                      <span className="text-sm text-white font-medium">{formData.quantity} {formData.unit}</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                      <span className="text-sm text-neutral-500">Price</span>
                      <span className="text-sm text-emerald-400 font-bold">
                        {formData.priceType === 'free' ? 'Free' : `₹${formData.price}`}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800/50 pb-2">
                      <span className="text-sm text-neutral-500">Images</span>
                      <span className="text-sm text-white font-medium">
                        {formData.images.filter(i => i).length} added
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Buttons */}
          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={prevStep}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                step === 1 ? "opacity-0 pointer-events-none" : "bg-neutral-800 text-white hover:bg-neutral-700"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {step < 5 ? (
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-200 transition-all active:scale-95 shadow-lg"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl font-bold flex items-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95 shadow-lg shadow-emerald-900/40 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Listing
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Info - Only on desktop */}
        <div className="hidden lg:grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-3">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">Quality Photos</p>
              <p className="text-xs text-neutral-500 leading-relaxed">Listings with multiple clear photos of the actual material receive 4x more requests.</p>
            </div>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
            <Tag className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">Fair Pricing</p>
              <p className="text-xs text-neutral-500 leading-relaxed">Consider listing as "Free" or "Negotiable" for faster material diversion and higher impact.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateListingPage;
