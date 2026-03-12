// Material Details Page - View single material listing
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Package,
  Tag,
  Eye,
  Clock,
  User,
  MessageSquare,
  Heart,
  Share2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building2,
  Star,
  Leaf,
} from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { getMaterial } from "@/api/services";
import { ROUTES } from "@/config/constants";
import { useAppSelector } from "@/hooks/useRedux";

interface Material {
  _id: string;
  title: string;
  description: string;
  category: { name: string; _id: string };
  subcategory?: string;
  quantity: number;
  availableQuantity?: number;
  unit: string;
  condition: string;
  priceType: string;
  price?: number;
  images: Array<{ url: string; publicId?: string; isPrimary?: boolean }>;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  location?: {
    type: string;
    coordinates: number[];
  };
  listedBy: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    phone?: string;
    company?: {
      name: string;
    };
    rating?: {
      average: number;
      count: number;
    };
  };
  status: string;
  tags?: string[];
  views?: number;
  estimatedImpact?: {
    co2Saved: number;
    waterSaved: number;
    energySaved: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Condition badge colors
const conditionColors: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  like_new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  good: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  fair: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  salvage: "bg-red-500/10 text-red-400 border-red-500/20",
};

// Format condition label
const formatCondition = (condition: string) => {
  return condition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Format price
const formatPrice = (priceType: string, price?: number) => {
  if (priceType === "free") return "Free";
  if (priceType === "negotiable")
    return price ? `₹${price.toLocaleString()} (Negotiable)` : "Negotiable";
  return price ? `₹${price.toLocaleString()}` : "Contact for Price";
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Get category emoji
const getCategoryEmoji = (categoryName: string) => {
  const emojiMap: Record<string, string> = {
    wood: "🪵",
    metals: "🔩",
    plastics: "🧴",
    textiles: "🧵",
    electronics: "🔌",
    glass: "🪟",
    paper: "📦",
    packaging: "📦",
    chemicals: "🧪",
    furniture: "🪑",
    construction: "🏗️",
    organic: "🌿",
    automotive: "🚗",
  };
  const key = categoryName?.toLowerCase();
  return emojiMap[key] || "📦";
};

const MaterialDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch material details
  useEffect(() => {
    const fetchMaterial = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await getMaterial(id);
        if (response.success) {
          setMaterial(response.data.material);
        } else {
          setError(response.message || "Failed to load material");
        }
      } catch (err) {
        setError("Failed to load material details");
        console.error("Error fetching material:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  // Image navigation
  const nextImage = () => {
    if (material?.images) {
      setCurrentImageIndex((prev) =>
        prev === material.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (material?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? material.images.length - 1 : prev - 1
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !material) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Material Not Found
          </h2>
          <p className="text-neutral-400 mb-6">
            {error || "The material you're looking for doesn't exist."}
          </p>
          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?._id === material.listedBy._id;
  const availableQty = material.availableQuantity ?? material.quantity;
  const hasImages = material.images && material.images.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-neutral-800/50 rounded-2xl overflow-hidden">
              {hasImages ? (
                <>
                  <motion.img
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={material.images[currentImageIndex]?.url || material.images[currentImageIndex]}
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Navigation Arrows */}
                  {material.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-neutral-900/80 rounded-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-neutral-900/80 rounded-full flex items-center justify-center text-white hover:bg-neutral-800 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {material.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-neutral-900/80 rounded-full text-sm text-white">
                      {currentImageIndex + 1} / {material.images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl">
                  {getCategoryEmoji(material.category?.name)}
                </div>
              )}

              {/* Status Badge */}
              {material.status !== "available" && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                    Not Available
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {hasImages && material.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {material.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex
                        ? "border-emerald-500"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img?.url || img}
                      alt={`${material.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Category & Condition */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-neutral-400 flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                {material.category?.name}
                {material.subcategory && ` • ${material.subcategory}`}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  conditionColors[material.condition] ||
                  "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                }`}
              >
                {formatCondition(material.condition)}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {material.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-emerald-400">
                {formatPrice(material.priceType, material.price)}
              </span>
              {material.priceType !== "free" && material.price && (
                <span className="text-sm text-neutral-500">
                  per {material.unit}
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-neutral-800/30 rounded-xl">
                <Package className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-lg font-semibold text-white">
                  {availableQty}
                </p>
                <p className="text-xs text-neutral-500">{material.unit} available</p>
              </div>
              <div className="p-4 bg-neutral-800/30 rounded-xl">
                <MapPin className="w-5 h-5 text-emerald-400 mb-2" />
                <p className="text-lg font-semibold text-white">
                  {material.address?.city || "N/A"}
                </p>
                <p className="text-xs text-neutral-500">Location</p>
              </div>
              <div className="p-4 bg-neutral-800/30 rounded-xl">
                <Eye className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-lg font-semibold text-white">
                  {material.views || 0}
                </p>
                <p className="text-xs text-neutral-500">Views</p>
              </div>
              <div className="p-4 bg-neutral-800/30 rounded-xl">
                <Clock className="w-5 h-5 text-amber-400 mb-2" />
                <p className="text-lg font-semibold text-white">
                  {formatDate(material.createdAt).split(" ")[0]}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDate(material.createdAt).split(" ").slice(1).join(" ")}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-neutral-400 mb-2">
                Description
              </h3>
              <p className="text-neutral-300 whitespace-pre-wrap">
                {material.description}
              </p>
            </div>

            {/* Tags */}
            {material.tags && material.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-400 mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {material.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-neutral-800/50 rounded-full text-sm text-neutral-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Environmental Impact */}
            {material.estimatedImpact && (
              <div className="p-4 bg-gradient-to-br from-emerald-900/20 to-neutral-900 rounded-xl border border-emerald-800/30">
                <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Estimated Environmental Impact
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {material.estimatedImpact.co2Saved} kg
                    </p>
                    <p className="text-xs text-neutral-500">CO₂ Saved</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {material.estimatedImpact.waterSaved} L
                    </p>
                    <p className="text-xs text-neutral-500">Water Saved</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {material.estimatedImpact.energySaved} kWh
                    </p>
                    <p className="text-xs text-neutral-500">Energy Saved</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              {!isOwner && material.status === "available" ? (
                <>
                  <Link
                    to={`${ROUTES.REQUESTS}/create?material=${material._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Material
                  </Link>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`p-3 rounded-xl border transition-all ${
                      isSaved
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
                    />
                  </button>
                  <button className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </>
              ) : isOwner ? (
                <Link
                  to={`${ROUTES.LISTINGS}/${material._id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-neutral-800/60 border border-neutral-700 text-white rounded-xl hover:bg-neutral-800 transition-all"
                >
                  Edit Listing
                </Link>
              ) : (
                <span className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-neutral-800/60 border border-neutral-700 text-neutral-500 rounded-xl cursor-not-allowed">
                  Not Available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <div className="p-6 bg-neutral-900/50 border border-neutral-800/50 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Listed By
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              {material.listedBy.avatar ? (
                <img
                  src={material.listedBy.avatar}
                  alt={material.listedBy.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-emerald-400" />
                </div>
              )}
              <div>
                <h4 className="text-lg font-medium text-white">
                  {material.listedBy.name}
                </h4>
                {material.listedBy.company?.name && (
                  <p className="text-sm text-neutral-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {material.listedBy.company.name}
                  </p>
                )}
                {material.listedBy.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm text-white">
                      {material.listedBy.rating.average.toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-500">
                      ({material.listedBy.rating.count} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Actions */}
            {!isOwner && (
              <div className="flex gap-3 sm:ml-auto">
                {material.listedBy.phone && (
                  <a
                    href={`tel:${material.listedBy.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-neutral-800/60 border border-neutral-700 text-white rounded-xl hover:bg-neutral-800 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}
                {material.listedBy.email && (
                  <a
                    href={`mailto:${material.listedBy.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-neutral-800/60 border border-neutral-700 text-white rounded-xl hover:bg-neutral-800 transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        {material.address && (
          <div className="p-6 bg-neutral-900/50 border border-neutral-800/50 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Location
            </h3>
            <p className="text-neutral-300">
              {[
                material.address.street,
                material.address.city,
                material.address.state,
                material.address.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MaterialDetailsPage;
