// Create Request Page - Submit a material request for a specific listing
import React, { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  MessageSquare,
  Clock,
  Truck,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Tag,
} from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/layouts";
import { getMaterial } from "@/api/services";
import { requestsService } from "@/api/services";
import { ROUTES } from "@/config/constants";

interface Material {
  _id: string;
  title: string;
  description: string;
  images: string[];
  category: { name: string };
  condition: string;
  availableQuantity: number;
  quantity: number;
  unit: string;
  priceType: string;
  price?: number;
  status: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
  listedBy?: {
    name: string;
    avatar?: string;
  };
}

interface FormState {
  quantityRequested: number;
  message: string;
  purpose: string;
  logisticsPreference: "self_pickup" | "delivery" | "flexible";
  proposedPickupDate: string;
  proposedPickupTimeSlot: "morning" | "afternoon" | "evening" | "flexible";
  offeredPrice: number;
}

const TIME_SLOTS = [
  { value: "morning", label: "Morning (9am–12pm)" },
  { value: "afternoon", label: "Afternoon (12pm–5pm)" },
  { value: "evening", label: "Evening (5pm–8pm)" },
  { value: "flexible", label: "Flexible" },
];

const LOGISTICS_OPTIONS = [
  { value: "self_pickup", label: "Self Pickup", icon: "🚗" },
  { value: "delivery", label: "Delivery", icon: "🚚" },
  { value: "flexible", label: "Flexible", icon: "🤝" },
];

const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materialId = searchParams.get("material");

  const [material, setMaterial] = useState<Material | null>(null);
  const [materialLoading, setMaterialLoading] = useState(true);
  const [materialError, setMaterialError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    quantityRequested: 1,
    message: "",
    purpose: "",
    logisticsPreference: "flexible",
    proposedPickupDate: "",
    proposedPickupTimeSlot: "flexible",
    offeredPrice: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch material details
  useEffect(() => {
    if (!materialId) {
      setMaterialError("No material specified.");
      setMaterialLoading(false);
      return;
    }

    const fetchMaterial = async () => {
      try {
        setMaterialLoading(true);
        const result = await getMaterial(materialId);
        setMaterial(result.data?.material || result.data || result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load material.";
        setMaterialError(msg);
      } finally {
        setMaterialLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantityRequested" || name === "offeredPrice" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) return;

    if (form.quantityRequested < 1) {
      setSubmitError("Quantity must be at least 1.");
      return;
    }

    if (material && form.quantityRequested > (material.availableQuantity ?? material.quantity)) {
      setSubmitError(
        `Only ${material.availableQuantity ?? material.quantity} ${material.unit} available.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const response = await requestsService.create({
        materialId,
        requestedQuantity: form.quantityRequested,
        message: form.message,
        purpose: form.purpose,
        logisticsPreference: form.logisticsPreference,
        proposedPrice: form.offeredPrice || undefined,
        proposedSchedule: form.proposedPickupDate
          ? { date: form.proposedPickupDate, timeSlot: form.proposedPickupTimeSlot }
          : undefined,
      });

      if (response.success) {
        navigate(ROUTES.REQUESTS);
      } else {
        setSubmitError(response.message || "Failed to submit request.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to submit request.");
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading state ---
  if (materialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // --- Error / missing material ---
  if (materialError || !material) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Material Not Found</h2>
          <p className="text-neutral-500 mb-6">{materialError || "The material could not be loaded."}</p>
          <Link
            to={ROUTES.MARKETPLACE}
            className="px-6 py-2.5 bg-emerald-500 text-neutral-950 font-bold rounded-xl hover:bg-emerald-400 transition-all"
          >
            Browse Marketplace
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const availableQty = material.availableQuantity ?? material.quantity;
  const locationLabel = [material.address?.city, material.address?.state].filter(Boolean).join(", ");

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          to={ROUTES.MATERIAL_DETAILS.replace(":id", materialId!)}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to listing
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Request Material</h1>
          <p className="text-neutral-400">
            Fill in the details below to send a request to the supplier.
          </p>
        </div>

        {/* Material Preview Card */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex gap-5 items-start">
          <div className="w-20 h-20 bg-neutral-800 rounded-xl overflow-hidden shrink-0">
            {material.images?.[0] ? (
              <img
                src={material.images[0]}
                alt={material.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{material.title}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-neutral-400">
              {material.category?.name && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {material.category.name}
                </span>
              )}
              {locationLabel && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {locationLabel}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {availableQty} {material.unit} available
              </span>
            </div>
            <div className="mt-2">
              {material.priceType === "free" ? (
                <span className="text-emerald-400 text-sm font-bold">Free</span>
              ) : material.priceType === "negotiable" ? (
                <span className="text-amber-400 text-sm font-bold">Negotiable</span>
              ) : (
                <span className="text-white text-sm font-bold">
                  ₹{material.price?.toLocaleString()} / {material.unit}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quantity */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" />
              Quantity
            </h3>
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">
                How many {material.unit} do you need?
              </label>
              <input
                type="number"
                name="quantityRequested"
                min={1}
                max={availableQty}
                value={form.quantityRequested}
                onChange={handleChange}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-xs text-neutral-600 mt-1.5">
                Max available: {availableQty} {material.unit}
              </p>
            </div>
          </div>

          {/* Message & Purpose */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Message
            </h3>
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">
                Message to supplier <span className="text-neutral-600">(optional)</span>
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                maxLength={1000}
                placeholder="Introduce yourself and describe what you need..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1.5 block">
                Purpose / Intended use <span className="text-neutral-600">(optional)</span>
              </label>
              <input
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                maxLength={500}
                placeholder="e.g. Construction project, upcycling, donation..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Logistics Preference */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-500" />
              Logistics
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {LOGISTICS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      logisticsPreference: opt.value as FormState["logisticsPreference"],
                    }))
                  }
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-sm font-semibold transition-all ${
                    form.logisticsPreference === opt.value
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                      : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proposed Schedule */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Preferred Schedule <span className="font-normal normal-case text-neutral-600">(optional)</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 mb-1.5 block">Preferred date</label>
                <input
                  type="date"
                  name="proposedPickupDate"
                  value={form.proposedPickupDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1.5 block">Preferred time slot</label>
                <select
                  name="proposedPickupTimeSlot"
                  value={form.proposedPickupTimeSlot}
                  onChange={handleChange}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Price Offer (only for negotiable/fixed) */}
          {(material.priceType === "negotiable" || material.priceType === "fixed") && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest">
                Price Offer
              </h3>
              <div>
                <label className="text-xs text-neutral-500 mb-1.5 block">
                  Your offered price per {material.unit}{" "}
                  <span className="text-neutral-600">(₹, optional)</span>
                </label>
                <input
                  type="number"
                  name="offeredPrice"
                  min={0}
                  value={form.offeredPrice}
                  onChange={handleChange}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <Link
              to={ROUTES.MATERIAL_DETAILS.replace(":id", materialId!)}
              className="px-6 py-3 bg-neutral-800 border border-neutral-700 text-neutral-300 font-semibold rounded-xl hover:bg-neutral-700 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-neutral-950 font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateRequestPage;
