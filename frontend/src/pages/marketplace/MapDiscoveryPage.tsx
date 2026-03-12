// Map Discovery Page - Map-based material discovery with clustering
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  X,
  Package,
  Tag,
  User,
  Star,
  Loader2,
  Navigation,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Phone,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Info,
  List,
} from "lucide-react";
import { getNearbyMaterials, createRequest } from "@/api/services";
import { useAppSelector } from "@/hooks/useRedux";
import { ROUTES } from "@/config/constants";
import { toast } from "react-toastify";

// Mumbai coordinates
const MUMBAI_CENTER: [number, number] = [19.076, 72.8777];
const DEFAULT_ZOOM = 11;
const DEFAULT_RADIUS = 15; // km

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const createCustomIcon = (color: string, emoji?: string) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">${emoji || "📦"}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const userLocationIcon = L.divIcon({
  className: "user-location-icon",
  html: `
    <div style="
      background: linear-gradient(135deg, #10b981, #059669);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 4px rgba(16,185,129,0.3), 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    ">
      <span style="font-size: 12px;">📍</span>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(16,185,129,0.3), 0 2px 8px rgba(0,0,0,0.3); }
        50% { box-shadow: 0 0 0 8px rgba(16,185,129,0.1), 0 2px 8px rgba(0,0,0,0.3); }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Material type
interface Material {
  _id: string;
  title: string;
  description: string;
  category: { name: string; _id: string };
  condition: string;
  quantity: number;
  availableQuantity?: number;
  unit: string;
  images: string[];
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  listedBy: {
    _id: string;
    name: string;
    avatar?: string;
    rating?: { average: number; count: number };
  };
  price?: number;
  priceType: string;
  distanceKm?: number;
  tags?: string[];
  createdAt: string;
}

// Category to emoji mapping
const getCategoryEmoji = (categoryName: string): string => {
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

// Category to color mapping
const getCategoryColor = (categoryName: string): string => {
  const colorMap: Record<string, string> = {
    wood: "#8B4513",
    metals: "#6B7280",
    plastics: "#3B82F6",
    textiles: "#A855F7",
    electronics: "#F59E0B",
    glass: "#06B6D4",
    paper: "#84CC16",
    packaging: "#F97316",
    chemicals: "#EF4444",
    furniture: "#10B981",
    construction: "#64748B",
    organic: "#22C55E",
    automotive: "#6366F1",
  };
  const key = categoryName?.toLowerCase();
  return colorMap[key] || "#10B981";
};

// Map event handler component
const MapEventHandler: React.FC<{
  onMoveEnd: (center: L.LatLng, bounds: L.LatLngBounds) => void;
}> = ({ onMoveEnd }) => {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      onMoveEnd(map.getCenter(), map.getBounds());
    },
  });
  return null;
};

// Fly to location component
const FlyToLocation: React.FC<{ position: [number, number] | null }> = ({
  position,
}) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 1.5 });
    }
  }, [map, position]);
  return null;
};

const MapDiscoveryPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(MUMBAI_CENTER);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);

  // Fetch materials based on location
  const fetchMaterials = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNearbyMaterials(lat, lng, DEFAULT_RADIUS, 50);
      if (response.success) {
        setMaterials(response.data.materials || []);
      } else {
        setError(response.message || "Failed to fetch materials");
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
      setError("Failed to fetch nearby materials");
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.warning("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setFlyToPosition([latitude, longitude]);
        fetchMaterials(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.info("Using default location (Mumbai)");
        fetchMaterials(MUMBAI_CENTER[0], MUMBAI_CENTER[1]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchMaterials]);

  // Initial load
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Handle map move
  const handleMapMoveEnd = useCallback(
    (center: L.LatLng) => {
      setMapCenter([center.lat, center.lng]);
      // Optionally refetch on map move (commented out to reduce API calls)
      // fetchMaterials(center.lat, center.lng);
    },
    []
  );

  // Refresh materials at current center
  const handleRefresh = () => {
    fetchMaterials(mapCenter[0], mapCenter[1]);
  };

  // Open material modal
  const openMaterialModal = (material: Material) => {
    setSelectedMaterial(material);
    setCurrentImageIndex(0);
    setRequestMessage("");
    setRequestQuantity(1);
    setShowModal(true);
  };

  // Submit material request
  const handleSubmitRequest = async () => {
    if (!selectedMaterial || !user) return;

    if (selectedMaterial.listedBy._id === user._id) {
      toast.error("You cannot request your own material");
      return;
    }

    try {
      setSubmittingRequest(true);
      // Use quantityRequested to match backend expectation
      const response = await createRequest({
        materialId: selectedMaterial._id,
        message: requestMessage,
        requestedQuantity: requestQuantity,
      });

      if (response.success) {
        toast.success("Request sent successfully!");
        setShowModal(false);
      } else {
        toast.error(response.message || "Failed to send request");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Generate marker icons for materials
  const markerIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    materials.forEach((m) => {
      const categoryName = m.category?.name || "";
      if (!icons[categoryName]) {
        icons[categoryName] = createCustomIcon(
          getCategoryColor(categoryName),
          getCategoryEmoji(categoryName)
        );
      }
    });
    return icons;
  }, [materials]);

  return (
    <div className="h-screen w-full relative bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="flex items-center justify-between">
          {/* Back to Marketplace */}
          <Link
            to={ROUTES.MARKETPLACE}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-xl text-white hover:bg-neutral-800 transition-colors"
          >
            <List className="w-4 h-4" />
            <span className="text-sm font-medium">List View</span>
          </Link>

          {/* Controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-xl text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              title="Refresh materials"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Center on user */}
            <button
              onClick={() => {
                if (userLocation) {
                  setFlyToPosition([...userLocation]);
                } else {
                  getUserLocation();
                }
              }}
              className="p-2.5 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-xl text-white hover:bg-neutral-800 transition-colors"
              title="Center on my location"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={MUMBAI_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          {/* Dark OpenStreetMap tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Map event handlers */}
          <MapEventHandler onMoveEnd={handleMapMoveEnd} />
          <FlyToLocation position={flyToPosition} />

          {/* User location marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup className="dark-popup">
                <div className="text-center p-1">
                  <p className="font-medium text-neutral-900">You are here</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Material markers with clustering */}
          <MarkerClusterGroup
            chunkedLoading
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            iconCreateFunction={(cluster: L.MarkerCluster) => {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `
                  <div style="
                    background: linear-gradient(135deg, #10b981, #059669);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    border: 2px solid white;
                  ">${count}</div>
                `,
                className: "marker-cluster-custom",
                iconSize: L.point(40, 40, true),
              });
            }}
          >
            {materials.map((material) => {
              // Convert [lng, lat] to [lat, lng] for Leaflet
              const position: [number, number] = [
                material.location.coordinates[1],
                material.location.coordinates[0],
              ];
              const categoryName = material.category?.name || "";

              return (
                <Marker
                  key={material._id}
                  position={position}
                  icon={markerIcons[categoryName] || createCustomIcon("#10b981", "📦")}
                  eventHandlers={{
                    click: () => openMaterialModal(material),
                  }}
                >
                  <Popup className="dark-popup">
                    <div
                      className="p-2 min-w-[200px] cursor-pointer"
                      onClick={() => openMaterialModal(material)}
                    >
                      <h4 className="font-semibold text-neutral-900 mb-1 line-clamp-1">
                        {material.title}
                      </h4>
                      <p className="text-sm text-neutral-600 mb-1">
                        {material.address?.city || "Location not specified"}
                      </p>
                      <p className="text-sm text-neutral-700">
                        {material.availableQuantity || material.quantity}{" "}
                        {material.unit}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        {material.category?.name}
                      </p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        Click for details →
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-[1001]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-neutral-400 text-sm">Loading materials...</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && !loading && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1001]">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* Materials count badge */}
        {!loading && materials.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001]">
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-full text-white text-sm">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>{materials.length} materials nearby</span>
            </div>
          </div>
        )}
      </div>

      {/* Material Details Modal */}
      <AnimatePresence>
        {showModal && selectedMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold text-white">
                  Material Details
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Images */}
                {selectedMaterial.images && selectedMaterial.images.length > 0 ? (
                  <div className="relative aspect-video bg-neutral-800 rounded-xl overflow-hidden">
                    <img
                      src={selectedMaterial.images[currentImageIndex]}
                      alt={selectedMaterial.title}
                      className="w-full h-full object-cover"
                    />
                    {selectedMaterial.images.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === 0 ? selectedMaterial.images.length - 1 : prev - 1
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-neutral-900/80 rounded-full text-white hover:bg-neutral-800"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === selectedMaterial.images.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-neutral-900/80 rounded-full text-white hover:bg-neutral-800"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-neutral-900/80 rounded-full text-xs text-white">
                          {currentImageIndex + 1} / {selectedMaterial.images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-neutral-800 rounded-xl flex items-center justify-center text-8xl">
                    {getCategoryEmoji(selectedMaterial.category?.name)}
                  </div>
                )}

                {/* Title & Category */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                      {selectedMaterial.category?.name}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium capitalize">
                      {selectedMaterial.condition?.replace(/_/g, " ")}
                    </span>
                    {selectedMaterial.distanceKm && (
                      <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded-full text-xs">
                        {selectedMaterial.distanceKm} km away
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedMaterial.title}
                  </h3>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-400 mb-2">
                    Description
                  </h4>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    {selectedMaterial.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-800/50 rounded-xl">
                    <Package className="w-5 h-5 text-blue-400 mb-2" />
                    <p className="text-lg font-semibold text-white">
                      {selectedMaterial.availableQuantity || selectedMaterial.quantity}{" "}
                      {selectedMaterial.unit}
                    </p>
                    <p className="text-xs text-neutral-500">Available Quantity</p>
                  </div>
                  <div className="p-4 bg-neutral-800/50 rounded-xl">
                    <Tag className="w-5 h-5 text-emerald-400 mb-2" />
                    <p className="text-lg font-semibold text-white">
                      {selectedMaterial.priceType === "free"
                        ? "Free"
                        : selectedMaterial.price
                        ? `₹${selectedMaterial.price.toLocaleString()}`
                        : "Negotiable"}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {selectedMaterial.priceType}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {selectedMaterial.tags && selectedMaterial.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-400 mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMaterial.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-neutral-800 rounded-full text-sm text-neutral-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seller Info */}
                <div className="p-4 bg-neutral-800/50 rounded-xl">
                  <h4 className="text-sm font-medium text-neutral-400 mb-3">
                    Listed By
                  </h4>
                  <div className="flex items-center gap-3">
                    {selectedMaterial.listedBy.avatar ? (
                      <img
                        src={selectedMaterial.listedBy.avatar}
                        alt={selectedMaterial.listedBy.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {selectedMaterial.listedBy.name}
                      </p>
                      {selectedMaterial.listedBy.rating && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm text-white">
                            {selectedMaterial.listedBy.rating.average.toFixed(1)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            ({selectedMaterial.listedBy.rating.count} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Request Form */}
                {user && selectedMaterial.listedBy._id !== user._id && (
                  <div className="space-y-4 p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-xl">
                    <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Request This Material
                    </h4>

                    <div>
                      <label className="block text-sm text-neutral-400 mb-1">
                        Quantity Needed ({selectedMaterial.unit})
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedMaterial.availableQuantity || selectedMaterial.quantity}
                        value={requestQuantity}
                        onChange={(e) => setRequestQuantity(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-400 mb-1">
                        Message to Seller (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="Introduce yourself and explain why you need this material..."
                        className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 px-6 py-4 flex flex-wrap gap-3">
                {user?.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white rounded-xl hover:bg-neutral-700 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Contact Seller
                  </a>
                )}

                {user && selectedMaterial.listedBy._id !== user._id ? (
                  <button
                    onClick={handleSubmitRequest}
                    disabled={submittingRequest}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-medium rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingRequest ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    Request Material
                  </button>
                ) : !user ? (
                  <Link
                    to={ROUTES.LOGIN}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-medium rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all"
                  >
                    Login to Request
                  </Link>
                ) : (
                  <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 text-neutral-500 rounded-xl">
                    <Info className="w-4 h-4" />
                    This is your listing
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom CSS for dark popup */}
      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: #171717;
          color: #fafafa;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }
        .dark-popup .leaflet-popup-tip {
          background: #171717;
        }
        .leaflet-popup-close-button {
          color: #a3a3a3 !important;
        }
        .leaflet-popup-close-button:hover {
          color: #fafafa !important;
        }
        .marker-cluster-custom {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default MapDiscoveryPage;
