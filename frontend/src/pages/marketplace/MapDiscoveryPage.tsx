// Map Discovery Page - Map-based material discovery with clustering + delivery simulation
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
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
  Truck,
  CheckCircle2,
} from "lucide-react";
import { getNearbyMaterials, createRequest } from "@/api/services";
import { useAppSelector } from "@/hooks/useRedux";
import { ROUTES } from "@/config/constants";
import { toast } from "react-toastify";

// ─── Constants ────────────────────────────────────────────────────────────────
const MUMBAI_CENTER: [number, number] = [19.076, 72.8777];
const DEFAULT_ZOOM = 11;
const DEFAULT_RADIUS = 15; // km

// ─── Delivery types (from mapping project) ────────────────────────────────────
type DeliveryStatus =
  | "idle"
  | "calculating_route"
  | "assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered";

interface DeliveryContext {
  material: Material;
  status: DeliveryStatus;
  vehicleLocation: [number, number];
  progress: number;
  routeGeometry?: [number, number][];
  bearing: number;
}

// ─── Geo-math helpers (from mapping project) ──────────────────────────────────
const calculateDistance = (p1: [number, number], p2: [number, number]) => {
  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBearing = (p1: [number, number], p2: [number, number]) => {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
};

// ─── Leaflet default icon fix ─────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ─── Existing dark-themed custom marker icons ─────────────────────────────────
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

// Vehicle marker icon (dark-themed, from mapping project)
const getVehicleIcon = (bearing: number = 0) =>
  L.divIcon({
    className: "custom-div-icon",
    html: `<div style="
      background: linear-gradient(135deg, #10b981, #059669);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(16,185,129,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: transform 0.1s linear;
      transform: rotate(${bearing}deg);
    ">🚚</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

// ─── Material type (unchanged) ────────────────────────────────────────────────
interface Material {
  _id: string;
  title: string;
  description: string;
  category: { name: string; _id: string };
  condition: string;
  quantity: number;
  availableQuantity?: number;
  unit: string;
  images: Array<{ url: string; publicId?: string; isPrimary?: boolean }>;
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

// ─── Category helpers (unchanged) ─────────────────────────────────────────────
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

// ─── Map helper components (unchanged) ────────────────────────────────────────
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

// ─── Delivery status text helper ──────────────────────────────────────────────
const getStatusText = (status: DeliveryStatus) => {
  switch (status) {
    case "calculating_route":
      return "Mapping optimal route…";
    case "assigned":
      return "Partner Assigned";
    case "picked_up":
      return "Material Picked Up";
    case "on_the_way":
      return "Arriving Soon";
    case "delivered":
      return "Delivered Successfully";
    default:
      return "";
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════
const MapDiscoveryPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // ── Existing state ──────────────────────────────────────────────────────────
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

  // ── New delivery state (from mapping) ───────────────────────────────────────
  const [delivery, setDelivery] = useState<DeliveryContext | null>(null);

  // ── Fetch materials (unchanged) ─────────────────────────────────────────────
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

  // ── Geolocation (unchanged) ─────────────────────────────────────────────────
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

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // ── Map move (unchanged) ────────────────────────────────────────────────────
  const handleMapMoveEnd = useCallback((center: L.LatLng) => {
    setMapCenter([center.lat, center.lng]);
  }, []);

  const handleRefresh = () => {
    fetchMaterials(mapCenter[0], mapCenter[1]);
  };

  // ── Modal helpers (unchanged) ───────────────────────────────────────────────
  const openMaterialModal = (material: Material) => {
    setSelectedMaterial(material);
    setCurrentImageIndex(0);
    setRequestMessage("");
    setRequestQuantity(1);
    setShowModal(true);
  };

  // ── Submit request (unchanged) ──────────────────────────────────────────────
  const handleSubmitRequest = async () => {
    if (!selectedMaterial || !user) return;

    if (selectedMaterial.listedBy._id === user._id) {
      toast.error("You cannot request your own material");
      return;
    }

    try {
      setSubmittingRequest(true);
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

  // ── NEW: Delivery animation effect (from mapping) ──────────────────────────
  useEffect(() => {
    if (
      !delivery ||
      delivery.status === "delivered" ||
      delivery.status === "calculating_route"
    )
      return;

    if (!delivery.routeGeometry || delivery.routeGeometry.length === 0) {
      // Fallback straight-line logic
      const targetLoc = userLocation || MUMBAI_CENTER;
      const startLoc: [number, number] = [
        delivery.material.location.coordinates[1],
        delivery.material.location.coordinates[0],
      ];
      const TOTAL_STEPS = 100;

      const interval = setInterval(() => {
        setDelivery((prev) => {
          if (!prev) return prev;
          let nextProgress = prev.progress + 1 / TOTAL_STEPS;
          if (nextProgress >= 1) nextProgress = 1;

          const currentLat =
            startLoc[0] + (targetLoc[0] - startLoc[0]) * nextProgress;
          const currentLng =
            startLoc[1] + (targetLoc[1] - startLoc[1]) * nextProgress;

          let nextStatus = prev.status;
          if (nextProgress === 1) nextStatus = "delivered";
          else if (nextProgress > 0.6) nextStatus = "on_the_way";
          else if (nextProgress > 0.1) nextStatus = "picked_up";
          if (nextProgress === 1) clearInterval(interval);

          const newBearing = calculateBearing(startLoc, targetLoc);
          return {
            ...prev,
            progress: nextProgress,
            status: nextStatus as DeliveryStatus,
            vehicleLocation: [currentLat, currentLng],
            bearing: newBearing,
          };
        });
      }, 20);

      return () => clearInterval(interval);
    }

    // Advanced OSRM routing animation
    const route = delivery.routeGeometry;
    let totalDistance = 0;
    const segmentDistances: number[] = [];

    for (let i = 0; i < route.length - 1; i++) {
      const dist = calculateDistance(route[i], route[i + 1]);
      segmentDistances.push(dist);
      totalDistance += dist;
    }

    const progressPerTick = 0.002;

    const interval = setInterval(() => {
      setDelivery((prev) => {
        if (!prev || !prev.routeGeometry) return prev;

        let nextProgress = prev.progress + progressPerTick;
        if (nextProgress >= 1) nextProgress = 1;

        const currentDistanceTravelled = nextProgress * totalDistance;
        let distanceAccumulator = 0;
        let currentSegmentIndex = 0;
        let pSegment = 0;

        for (let i = 0; i < segmentDistances.length; i++) {
          if (
            distanceAccumulator + segmentDistances[i] >=
            currentDistanceTravelled
          ) {
            currentSegmentIndex = i;
            const remaining = currentDistanceTravelled - distanceAccumulator;
            pSegment =
              segmentDistances[i] === 0 ? 0 : remaining / segmentDistances[i];
            break;
          }
          distanceAccumulator += segmentDistances[i];
          if (i === segmentDistances.length - 1) {
            currentSegmentIndex = i;
            pSegment = 1;
          }
        }

        const p1 = route[currentSegmentIndex];
        const p2 = route[Math.min(currentSegmentIndex + 1, route.length - 1)];

        const currentLat = p1[0] + (p2[0] - p1[0]) * pSegment;
        const currentLng = p1[1] + (p2[1] - p1[1]) * pSegment;

        const newBearing =
          calculateDistance(p1, p2) > 0.0001
            ? calculateBearing(p1, p2)
            : prev.bearing;

        let nextStatus = prev.status;
        if (nextProgress === 1) nextStatus = "delivered";
        else if (nextProgress > 0.6) nextStatus = "on_the_way";
        else if (nextProgress > 0.1) nextStatus = "picked_up";
        if (nextProgress === 1) clearInterval(interval);

        return {
          ...prev,
          progress: nextProgress,
          status: nextStatus as DeliveryStatus,
          vehicleLocation: [currentLat, currentLng],
          bearing: newBearing,
        };
      });
    }, 20);

    return () => clearInterval(interval);
  }, [delivery, userLocation]);

  // ── NEW: Request delivery handler (from mapping) ───────────────────────────
  const handleRequestDelivery = async (material: Material) => {
    setShowModal(false);
    const destination = userLocation || MUMBAI_CENTER;
    if (!userLocation) setUserLocation(MUMBAI_CENTER);

    const startLoc: [number, number] = [
      material.location.coordinates[1],
      material.location.coordinates[0],
    ];

    setDelivery({
      material,
      status: "calculating_route",
      vehicleLocation: startLoc,
      progress: 0,
      bearing: 0,
    });

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLoc[1]},${startLoc[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const geometry = data.routes[0].geometry.coordinates;
        const latLngGeometry: [number, number][] = geometry.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        setDelivery((prev) =>
          prev
            ? { ...prev, routeGeometry: latLngGeometry, status: "assigned" }
            : null
        );
      } else {
        setDelivery((prev) =>
          prev ? { ...prev, status: "assigned" } : null
        );
      }
    } catch (error) {
      console.error("OSRM Routing failed, falling back to straight line", error);
      setDelivery((prev) =>
        prev ? { ...prev, status: "assigned" } : null
      );
    }
  };

  // ── Marker icons (unchanged) ────────────────────────────────────────────────
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

  // ═════════════════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen w-full relative bg-neutral-950 flex flex-col">
      {/* Header (unchanged) */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.MARKETPLACE}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-xl text-white hover:bg-neutral-800 transition-colors"
          >
            <List className="w-4 h-4" />
            <span className="text-sm font-medium">List View</span>
          </Link>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-xl text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
              title="Refresh materials"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>

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
          {/* Dark tiles (unchanged) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapEventHandler onMoveEnd={handleMapMoveEnd} />
          <FlyToLocation position={flyToPosition} />

          {/* User location (unchanged) */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon}>
              <Popup className="dark-popup">
                <div className="text-center p-1">
                  <p className="font-medium text-neutral-900">You are here</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Material markers with clustering (unchanged) */}
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

          {/* NEW: Delivery route polyline + vehicle marker */}
          {delivery && userLocation && (
            <>
              <Polyline
                positions={
                  delivery.routeGeometry || [
                    [
                      delivery.material.location.coordinates[1],
                      delivery.material.location.coordinates[0],
                    ],
                    userLocation,
                  ]
                }
                pathOptions={{
                  color: "#10b981",
                  weight: 4,
                  dashArray: "8, 8",
                  opacity: 0.6,
                }}
              />
              <Marker
                position={delivery.vehicleLocation}
                icon={getVehicleIcon(delivery.bearing)}
                zIndexOffset={1000}
              >
                <Popup className="dark-popup">
                  <div className="text-center p-1">
                    <p className="font-medium text-neutral-900">Delivery Partner</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* Loading overlay (unchanged) */}
        {loading && (
          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-[1001]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-neutral-400 text-sm">Loading materials...</p>
            </div>
          </div>
        )}

        {/* Error message (unchanged) */}
        {error && !loading && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1001]">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {/* Materials count badge (unchanged) */}
        {!loading && materials.length > 0 && !delivery && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001]">
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-full text-white text-sm">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>{materials.length} materials nearby</span>
            </div>
          </div>
        )}

        {/* NEW: Delivery tracking overlay (dark-themed) */}
        {delivery && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm z-[1001]">
            <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-800 rounded-2xl shadow-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Truck size={20} className="text-emerald-400" />
                  {getStatusText(delivery.status)}
                </h3>
                <span className="text-sm font-semibold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">
                  ETA: {Math.max(1, Math.ceil((1 - delivery.progress) * 10))} min
                </span>
              </div>

              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300 ease-linear rounded-full"
                  style={{
                    width: `${Math.max(5, delivery.progress * 100)}%`,
                  }}
                />
              </div>

              <div className="flex items-center gap-3 bg-neutral-800/50 p-3 rounded-xl border border-neutral-700">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-400">
                  {delivery.status === "delivered" ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <Navigation
                      size={20}
                      className={
                        delivery.status === "assigned" ||
                        delivery.status === "calculating_route"
                          ? "animate-pulse"
                          : ""
                      }
                    />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-neutral-500 font-medium whitespace-nowrap">
                    {delivery.status === "calculating_route"
                      ? "Processing"
                      : "Delivering"}
                  </p>
                  <p className="text-sm font-semibold text-white truncate whitespace-nowrap">
                    {delivery.material.title}
                  </p>
                </div>
                {delivery.status === "delivered" && (
                  <button
                    onClick={() => setDelivery(null)}
                    className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full cursor-pointer ml-2"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Material Details Modal (unchanged dark theme + NEW delivery button) */}
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
                      src={selectedMaterial.images[currentImageIndex]?.url || selectedMaterial.images[currentImageIndex]}
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
                {selectedMaterial.listedBy && (
                <div className="p-4 bg-neutral-800/50 rounded-xl">
                  <h4 className="text-sm font-medium text-neutral-400 mb-3">
                    Listed By
                  </h4>
                  <div className="flex items-center gap-3">
                    {selectedMaterial.listedBy?.avatar ? (
                      <img
                        src={selectedMaterial.listedBy.avatar}
                        alt={selectedMaterial.listedBy?.name || "Seller"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {selectedMaterial.listedBy?.name || "Unknown Seller"}
                      </p>
                      {selectedMaterial.listedBy?.rating && (
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
                )}

                {/* Request Form */}
                {user && selectedMaterial.listedBy?._id !== user._id && (
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

                {/* NEW: Simulate Delivery button */}
                {user && selectedMaterial.listedBy?._id !== user._id && (
                  <button
                    onClick={() => handleRequestDelivery(selectedMaterial)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 border border-emerald-700/50 text-emerald-400 font-medium rounded-xl hover:bg-neutral-700 transition-all"
                  >
                    <Truck className="w-4 h-4" />
                    Simulate Delivery
                  </button>
                )}

                {user && selectedMaterial.listedBy?._id !== user._id ? (
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

      {/* Custom CSS for dark popup (unchanged) */}
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
