// Seller Dashboard - Manage material listings
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  FileText,
  ArrowLeftRight,
  Truck,
  Leaf,
  Recycle,
  TreeDeciduous,
  Clock,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { useAppSelector } from "@/hooks/useRedux";
import {
  useMyListings,
  useRequests,
  useTransactions,
  useLogisticsJobs,
  useDashboardAnalytics,
} from "@/hooks/useApi";
import { ROUTES } from "@/config/constants";

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
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-neutral-800/50 rounded ${className}`} />
);

const SellerDashboardPage: React.FC = () => {
  // Get user name for welcome message
  const { user } = useAppSelector((state) => state.auth);
  const userName = user?.name?.split(" ")[0] || "Seller";

  // Fetch data from APIs
  const { data: listingsData, loading: listingsLoading, error: listingsError } = useMyListings({ limit: 5 });
  const { data: requestsData, loading: requestsLoading } = useRequests({ type: "received", limit: 5 });
  const { data: transactionsData, loading: transactionsLoading } = useTransactions({ role: "supplier", limit: 5 });
  const { data: logisticsData, loading: logisticsLoading } = useLogisticsJobs({ role: "supplier", limit: 5 });
  const { data: analyticsData, loading: analyticsLoading } = useDashboardAnalytics("month");

  // Calculate stats from real data
  const stats = {
    totalListings: listingsData?.pagination?.total ?? 0,
    activeListings: listingsData?.materials?.filter((m) => m.status === "active").length ?? 0,
    totalTransactions: transactionsData?.pagination?.total ?? 0,
    wasteDiverted: analyticsData?.user?.wasteDiverted?.kg ?? 0,
    co2Saved: analyticsData?.user?.co2Saved?.kg ?? 0,
    pendingRequests: requestsData?.requests?.filter((r) => r.status === "pending").length ?? 0,
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
      active: { color: "emerald", icon: CheckCircle, label: "Active" },
      pending: { color: "amber", icon: Clock, label: "Pending" },
      reserved: { color: "blue", icon: AlertCircle, label: "Reserved" },
      completed: { color: "emerald", icon: CheckCircle, label: "Completed" },
      cancelled: { color: "red", icon: XCircle, label: "Cancelled" },
      inactive: { color: "neutral", icon: XCircle, label: "Inactive" },
      approved: { color: "emerald", icon: CheckCircle, label: "Approved" },
      rejected: { color: "red", icon: XCircle, label: "Rejected" },
      in_progress: { color: "blue", icon: TrendingUp, label: "In Progress" },
      pickup_scheduled: { color: "purple", icon: Truck, label: "Pickup Scheduled" },
      in_transit: { color: "blue", icon: Truck, label: "In Transit" },
      delivered: { color: "emerald", icon: CheckCircle, label: "Delivered" },
    };

    const config = statusConfig[status] || { color: "neutral", icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-${config.color}-500/10 text-${config.color}-400 border border-${config.color}-500/20`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} min ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const isLoading = listingsLoading || analyticsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Welcome back, {userName}
            </h1>
            <p className="text-neutral-400 mt-1">
              Manage your listings and track transactions
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.CREATE_LISTING}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Create New Listing
            </Link>
            <Link
              to={ROUTES.REQUESTS}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-neutral-800/60 border border-neutral-700 rounded-xl hover:bg-neutral-800 hover:border-neutral-600 transition-all"
            >
              <FileText className="w-4 h-4" />
              View Requests
              {stats.pendingRequests > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                  {stats.pendingRequests}
                </span>
              )}
            </Link>
            <Link
              to={ROUTES.LOGISTICS}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all"
            >
              <Truck className="w-4 h-4" />
              Manage Logistics
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Listings",
              value: stats.totalListings,
              subValue: `${stats.activeListings} active`,
              icon: Package,
              color: "emerald",
            },
            {
              label: "Total Transactions",
              value: stats.totalTransactions,
              icon: ArrowLeftRight,
              color: "blue",
            },
            {
              label: "Waste Diverted",
              value: stats.wasteDiverted >= 1000 ? `${(stats.wasteDiverted / 1000).toFixed(1)}t` : `${stats.wasteDiverted}kg`,
              icon: Recycle,
              color: "teal",
            },
            {
              label: "CO₂ Saved",
              value: stats.co2Saved >= 1000 ? `${(stats.co2Saved / 1000).toFixed(1)}t` : `${stats.co2Saved}kg`,
              icon: TreeDeciduous,
              color: "emerald",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="relative overflow-hidden p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
            >
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ) : (
                <>
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center mb-4`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  {stat.subValue && (
                    <p className="text-xs text-emerald-400 mt-1">{stat.subValue}</p>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Listings */}
          <motion.div
            custom={4}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                My Listings
              </h2>
              <Link
                to={ROUTES.LISTINGS}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {listingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-neutral-800/30 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : listingsError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-neutral-400">Failed to load listings</p>
              </div>
            ) : listingsData?.materials?.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400">No listings yet</p>
                <Link
                  to={ROUTES.CREATE_LISTING}
                  className="text-sm text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                >
                  Create your first listing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listingsData?.materials?.slice(0, 5).map((listing) => (
                  <Link
                    key={listing._id}
                    to={ROUTES.LISTING_DETAILS.replace(":id", listing._id)}
                    className="block p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50 hover:border-emerald-500/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {listing.category?.name || "Uncategorized"} • {listing.quantity} {listing.unit}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {getStatusBadge(listing.status)}
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views} views
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button className="p-1.5 rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-white transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            custom={5}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Pending Requests
              </h2>
              <Link
                to={ROUTES.REQUESTS}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {requestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-neutral-800/30 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : requestsData?.requests?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requestsData?.requests?.slice(0, 5).map((request) => (
                  <div
                    key={request._id}
                    className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-white">
                          {request.material?.title || "Unknown Material"}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          from {request.requester?.name || "Unknown"} • {formatDate(request.createdAt)}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.message && (
                      <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                        "{request.message}"
                      </p>
                    )}
                    {request.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
                          Approve
                        </button>
                        <button className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Active Transactions */}
          <motion.div
            custom={6}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                Active Transactions
              </h2>
              <Link
                to={ROUTES.TRANSACTIONS}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-neutral-800/30 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : transactionsData?.transactions?.length === 0 ? (
              <div className="text-center py-8">
                <ArrowLeftRight className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400">No active transactions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactionsData?.transactions
                  ?.filter((t) => !["completed", "cancelled"].includes(t.status))
                  .slice(0, 5)
                  .map((transaction) => (
                    <div
                      key={transaction._id}
                      className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            {transaction.material?.title || "Unknown Material"}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            to {transaction.receiver?.name || "Unknown"} • {transaction.quantity} {transaction.unit}
                          </p>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                      {transaction.scheduledDate && (
                        <p className="text-xs text-neutral-400 flex items-center gap-1 mt-2">
                          <Calendar className="w-3 h-3" />
                          Scheduled: {new Date(transaction.scheduledDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-700/50">
                        <span className="text-xs text-neutral-500">
                          {transaction.priceType === "free" ? "Free" : `$${transaction.agreedPrice}`}
                        </span>
                        <span className="text-xs text-emerald-400">
                          {transaction.impact?.co2SavedKg?.toFixed(1) || 0}kg CO₂ saved
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>

          {/* Logistics Status */}
          <motion.div
            custom={7}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Logistics Status
              </h2>
              <Link
                to={ROUTES.LOGISTICS}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {logisticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-neutral-800/30 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : logisticsData?.jobs?.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                <p className="text-neutral-400">No logistics jobs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logisticsData?.jobs?.slice(0, 5).map((job) => (
                  <div
                    key={job._id}
                    className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-white">
                          {job.transaction?.material?.title || "Logistics Job"}
                        </h3>
                        <p className="text-xs text-neutral-500 capitalize">
                          {job.jobType?.replace(/_/g, " ")} • {job.vehicleType || "Standard"}
                        </p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{job.scheduledTimeSlot}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{job.pickupAddress?.city}</span>
                      {job.deliveryAddress && (
                        <>
                          <span>→</span>
                          <span className="truncate">{job.deliveryAddress.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Impact Stats */}
        <motion.div
          custom={8}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 via-neutral-900/50 to-neutral-900 border border-emerald-800/30"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              Impact Stats
            </h2>
            <Link
              to={ROUTES.IMPACT}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View Full Report
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {analyticsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-neutral-800/30 space-y-2">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: ArrowLeftRight,
                  label: "Materials Exchanged",
                  value: analyticsData?.user?.reuseCount || 0,
                  color: "blue",
                },
                {
                  icon: Recycle,
                  label: "Waste Diverted",
                  value: `${((analyticsData?.user?.wasteDiverted?.kg || 0) / 1000).toFixed(2)}t`,
                  color: "teal",
                },
                {
                  icon: TreeDeciduous,
                  label: "CO₂ Saved",
                  value: `${((analyticsData?.user?.co2Saved?.kg || 0)).toFixed(1)}kg`,
                  color: "emerald",
                },
                {
                  icon: Leaf,
                  label: "Trees Equivalent",
                  value: analyticsData?.user?.treesEquivalent || 0,
                  color: "green",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/30"
                >
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <p className="text-xs text-neutral-500 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboardPage;
