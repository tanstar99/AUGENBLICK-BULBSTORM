// Buyer Dashboard - Discover reusable materials with real API data
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Leaf,
  Recycle,
  FileText,
  ArrowLeftRight,
  Clock,
  Search,
  Plus,
  Bookmark,
  ChevronRight,
  TreeDeciduous,
  Droplets,
  Globe2,
  ExternalLink,
  MessageSquare,
  Navigation,
  Sparkles,
  Loader2,
  AlertCircle,
  Package,
  Truck,
} from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { useAppSelector } from "@/hooks/useRedux";
import { ROUTES } from "@/config/constants";
import {
  useUserImpact,
  useNearbyMaterials,
  useRequests,
  useTransactions,
} from "@/hooks";

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

// Loading skeleton component
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-neutral-800 rounded ${className}`} />
);

const BuyerDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Fetch real data from APIs
  const { data: impact, loading: impactLoading, error: impactError } = useUserImpact();
  const { data: nearbyData, loading: nearbyLoading, error: nearbyError } = useNearbyMaterials(50);
  const { data: requestsData, loading: requestsLoading, error: requestsError } = useRequests({ type: "sent" });
  const { data: transactionsData, loading: transactionsLoading, error: transactionsError } = useTransactions({ role: "receiver" });

  // Format weight
  const formatWeight = (kg: number | undefined) => {
    if (kg === undefined || kg === null || isNaN(kg)) return { value: "0", unit: "kg" };
    if (kg >= 1000) return { value: (kg / 1000).toFixed(1), unit: "tons" };
    return { value: kg.toFixed(0), unit: "kg" };
  };

  // Extract impact stats
  const co2Saved = formatWeight(impact?.summary?.co2Saved?.kg);
  const wasteDiverted = formatWeight(impact?.summary?.wasteDiverted?.kg);
  const totalExchanges = impact?.summary?.totalTransactions || 0;

  // Get requests (sent = buyer initiated)
  const myRequests = requestsData?.requests || [];
  const pendingRequests = myRequests.filter((r: { status: string }) => r.status === "pending");

  // Get active transactions (as receiver = buyer)
  const transactions = transactionsData?.transactions || [];
  const activeTransactions = transactions.filter(
    (t: { status: string }) => !["completed", "cancelled"].includes(t.status)
  );

  // Get nearby materials
  const nearbyMaterials = nearbyData?.materials || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "accepted":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "pickup_scheduled":
      case "awaiting_payment":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "in_transit":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      case "completed":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      default:
        return "text-neutral-400 bg-neutral-500/10 border-neutral-500/20";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return formatDate(dateString);
  };

  // Get category emoji
  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      wood: "🪵",
      metals: "🔩",
      plastics: "🧴",
      textiles: "🧵",
      electronics: "🔌",
      glass: "🪟",
      paper: "📦",
      chemicals: "🧪",
      furniture: "🪑",
      construction: "🏗️",
      default: "📦",
    };
    return emojiMap[category?.toLowerCase()] || emojiMap.default;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Welcome back, {user?.name?.split(" ")[0] || "Buyer"}
            </h1>
            <p className="text-neutral-400 mt-1">
              Discover reusable materials and make sustainable choices
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.MARKETPLACE}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Search className="w-4 h-4" />
              Browse Marketplace
            </Link>
            <Link
              to={ROUTES.REQUESTS}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-neutral-800/60 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-all"
            >
              <FileText className="w-4 h-4" />
              My Requests
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {(impactError || nearbyError || requestsError || transactionsError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">
              Some data failed to load. Please refresh the page.
            </p>
          </motion.div>
        )}

        {/* Sustainability Impact Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* CO2 Saved */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-neutral-900 border border-emerald-800/30"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <TreeDeciduous className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-neutral-400 mb-1">CO₂ Saved</p>
              {impactLoading ? (
                <Skeleton className="h-9 w-24 mt-1" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{co2Saved.value}</span>
                  <span className="text-lg text-neutral-500">{co2Saved.unit}</span>
                </div>
              )}
              {impact?.equivalents?.treesPlanted && (
                <p className="text-xs text-emerald-400 mt-2">
                  = {impact.equivalents.treesPlanted} trees planted
                </p>
              )}
            </div>
          </motion.div>

          {/* Waste Diverted */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 to-neutral-900 border border-blue-800/30"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <Recycle className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-neutral-400 mb-1">Waste Diverted</p>
              {impactLoading ? (
                <Skeleton className="h-9 w-24 mt-1" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{wasteDiverted.value}</span>
                  <span className="text-lg text-neutral-500">{wasteDiverted.unit}</span>
                </div>
              )}
              {impact?.ranking && (
                <p className="text-xs text-blue-400 mt-2">
                  Top {impact.ranking.percentile}% contributor
                </p>
              )}
            </div>
          </motion.div>

          {/* Circular Participation */}
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-teal-900/30 to-neutral-900 border border-teal-800/30"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                <Globe2 className="w-6 h-6 text-teal-400" />
              </div>
              <p className="text-sm text-neutral-400 mb-1">Circular Exchanges</p>
              {impactLoading ? (
                <Skeleton className="h-9 w-20 mt-1" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{totalExchanges}</span>
                  <span className="text-lg text-neutral-500">total</span>
                </div>
              )}
              <p className="text-xs text-teal-400 mt-2">Materials reused</p>
            </div>
          </motion.div>
        </div>

        {/* Nearby Materials + My Requests Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Nearby Materials */}
          <motion.div
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Nearby Materials
              </h2>
              <Link
                to={ROUTES.MARKETPLACE}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {nearbyLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : nearbyMaterials.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">No materials found nearby</p>
                <p className="text-neutral-500 text-xs mt-1">Try expanding your search radius</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyMaterials.slice(0, 5).map((material: {
                  _id: string;
                  title: string;
                  category: { name: string };
                  quantity: number;
                  unit: string;
                  location?: { address?: string };
                  distance?: number;
                }) => (
                  <Link
                    key={material._id}
                    to={`${ROUTES.MARKETPLACE}/${material._id}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-xl">
                      {getCategoryEmoji(material.category?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                        {material.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {material.quantity} {material.unit} • {material.category?.name}
                      </p>
                    </div>
                    {material.distance && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {material.distance.toFixed(1)} km
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* My Requests */}
          <motion.div
            custom={4}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                My Requests
                {pendingRequests.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full">
                    {pendingRequests.length} pending
                  </span>
                )}
              </h2>
              <Link
                to={ROUTES.REQUESTS}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {requestsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : myRequests.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">No requests yet</p>
                <p className="text-neutral-500 text-xs mt-1">Browse materials and send requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.slice(0, 4).map((request: {
                  _id: string;
                  material: { title: string; _id: string };
                  supplier: { name: string; company?: { name: string } };
                  status: string;
                  quantity: number;
                  unit: string;
                  createdAt: string;
                }) => (
                  <div
                    key={request._id}
                    className="p-3 rounded-xl bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {request.material?.title || "Material Request"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {request.supplier?.company?.name || request.supplier?.name || "Seller"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {formatStatus(request.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{request.quantity} {request.unit}</span>
                      <span>{formatRelativeTime(request.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Active Transactions */}
        <motion.div
          custom={5}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-purple-400" />
              Active Transactions
            </h2>
            <Link
              to={ROUTES.TRANSACTIONS}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : activeTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <Truck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">No active transactions</p>
              <p className="text-neutral-500 text-xs mt-1">
                Your accepted requests will appear here
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {activeTransactions.slice(0, 4).map((tx: {
                _id: string;
                transactionId: string;
                material: { title: string };
                supplier: { name: string; company?: { name: string } };
                status: string;
                agreedPrice?: number;
                currency?: string;
                createdAt: string;
              }) => (
                <Link
                  key={tx._id}
                  to={`${ROUTES.TRANSACTIONS}/${tx._id}`}
                  className="p-4 rounded-xl bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">{tx.transactionId}</p>
                      <p className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                        {tx.material?.title || "Transaction"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {formatStatus(tx.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">
                      {tx.supplier?.company?.name || tx.supplier?.name}
                    </span>
                    <span className="text-emerald-400 font-medium">
                      {tx.agreedPrice
                        ? `${tx.currency || "$"}${tx.agreedPrice}`
                        : "Pending"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI-Powered Discovery Section */}
        <motion.div
          custom={6}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 via-neutral-900 to-neutral-900 border border-violet-800/30"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">
                  AI-Powered
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Smart Material Discovery
              </h3>
              <p className="text-neutral-400 text-sm">
                Let our AI assistant help you find the perfect materials based on your
                needs, preferences, and sustainability goals.
              </p>
            </div>
            <Link
              to={ROUTES.AI_ASSISTANT}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-xl hover:bg-violet-500/30 hover:text-violet-200 transition-all group flex-shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with AI
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default BuyerDashboardPage;
