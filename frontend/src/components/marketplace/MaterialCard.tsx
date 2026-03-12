// Material Card Component - Product card for marketplace
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Package,
  Tag,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface MaterialCardProps {
  material: {
    _id: string;
    title: string;
    description?: string;
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
      city?: string;
      state?: string;
    };
    location?: {
      address?: string;
      city?: string;
    };
    status: string;
    views?: number;
    createdAt: string;
  };
  index?: number;
}

// Condition badge colors
const conditionColors: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  like_new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  good: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  fair: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  salvage: "bg-red-500/10 text-red-400 border-red-500/20",
};

// Price type badge colors
const priceTypeColors: Record<string, string> = {
  free: "bg-emerald-500/10 text-emerald-400",
  negotiable: "bg-blue-500/10 text-blue-400",
  fixed: "bg-purple-500/10 text-purple-400",
};

// Format condition label
const formatCondition = (condition: string) => {
  return condition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Format price
const formatPrice = (priceType: string, price?: number) => {
  if (priceType === "free") return "Free";
  if (priceType === "negotiable") return price ? `₹${price.toLocaleString()} (Negotiable)` : "Negotiable";
  return price ? `₹${price.toLocaleString()}` : "Contact for Price";
};

// Get time ago
const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
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

export const MaterialCard: React.FC<MaterialCardProps> = ({ material, index = 0 }) => {
  const city = material.address?.city || material.location?.city || "Unknown";
  const availableQty = material.availableQuantity ?? material.quantity;
  const imageUrl = material.images?.[0]?.url || (typeof material.images?.[0] === 'string' ? material.images[0] : undefined);
  const isAvailable = material.status === "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/material/${material._id}`}
        className="group block h-full"
      >
        <div className="h-full bg-neutral-900/50 border border-neutral-800/50 rounded-2xl overflow-hidden hover:border-emerald-800/50 hover:shadow-lg hover:shadow-emerald-900/10 transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-neutral-800/50 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={material.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {getCategoryEmoji(material.category?.name)}
              </div>
            )}

            {/* Status Overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-neutral-900/80 flex items-center justify-center">
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                  Not Available
                </span>
              </div>
            )}

            {/* Price Badge */}
            <div className="absolute top-3 left-3">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  priceTypeColors[material.priceType] || "bg-neutral-500/10 text-neutral-400"
                }`}
              >
                {formatPrice(material.priceType, material.price)}
              </span>
            </div>

            {/* Condition Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  conditionColors[material.condition] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                }`}
              >
                {formatCondition(material.condition)}
              </span>
            </div>

            {/* Views Badge */}
            {material.views !== undefined && material.views > 0 && (
              <div className="absolute bottom-3 right-3">
                <span className="px-2 py-1 rounded-full bg-neutral-900/80 text-neutral-400 text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {material.views}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Category */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {material.category?.name}
                {material.subcategory && ` • ${material.subcategory}`}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
              {material.title}
            </h3>

            {/* Description */}
            {material.description && (
              <p className="text-sm text-neutral-500 line-clamp-2 mb-3">
                {material.description}
              </p>
            )}

            {/* Details */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
              {/* Location */}
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                {city}
              </span>

              {/* Quantity */}
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                {availableQty} {material.unit}
              </span>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-neutral-800/50 flex items-center justify-between">
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTimeAgo(material.createdAt)}
              </span>
              {isAvailable ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Available
                </span>
              ) : (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Reserved
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default MaterialCard;
