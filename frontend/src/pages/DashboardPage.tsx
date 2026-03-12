// Dashboard Page - Role-based dashboard with real API data
import React from "react";
import { motion } from "framer-motion";
import {
  Package,
  ArrowLeftRight,
  TrendingUp,
  Leaf,
  Clock,
  FileText,
  Droplets,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { useAppSelector } from "@/hooks/useRedux";
import { useDashboardAnalytics, useUserImpact } from "@/hooks";

const DashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  // Fetch real dashboard data
  const { data: analytics, loading: analyticsLoading, error: analyticsError } = useDashboardAnalytics();
  const { data: impact, loading: impactLoading, error: impactError } = useUserImpact();

  // Format numbers for display
  const formatNumber = (num: number | undefined, unit?: string) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k${unit || ""}`;
    return `${num.toFixed(0)}${unit || ""}`;
  };

  const formatWeight = (kg: number | undefined) => {
    if (kg === undefined || kg === null) return "0 kg";
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
    return `${kg.toFixed(0)} kg`;
  };

  // Build stats from API data
  const stats = [
    { 
      label: "Active Listings", 
      value: analyticsLoading ? "..." : formatNumber(analytics?.user?.activeListings), 
      icon: Package, 
      change: analytics?.platform?.totalMaterials ? `${analytics.platform.totalMaterials} on platform` : "" 
    },
    { 
      label: "Pending Requests", 
      value: analyticsLoading ? "..." : formatNumber(analytics?.user?.pendingRequests), 
      icon: FileText, 
      change: "" 
    },
    { 
      label: "Transactions", 
      value: analyticsLoading ? "..." : formatNumber(analytics?.platform?.totalTransactions), 
      icon: ArrowLeftRight, 
      change: "" 
    },
    { 
      label: "CO₂ Saved", 
      value: analyticsLoading ? "..." : formatWeight(analytics?.user?.co2Saved?.kg), 
      icon: Leaf, 
      change: analytics?.user?.wasteDiverted?.kg ? `${formatWeight(analytics.user.wasteDiverted.kg)} diverted` : "" 
    },
  ];

  // Recent activity from API or placeholder
  const recentActivity = analytics?.recentActivity?.slice(0, 3) || [
    { description: "Dashboard loaded", timestamp: new Date().toISOString() },
    { description: "Viewing your metrics", timestamp: new Date().toISOString() },
    { description: "Check Marketplace for new listings", timestamp: new Date().toISOString() },
  ];

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Welcome back, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-neutral-400 mt-1">
            Here's what's happening with your account
          </p>
        </div>

        {/* Error Alert */}
        {(analyticsError || impactError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">
              {analyticsError || impactError}
            </p>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800/50 hover:border-emerald-800/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                  {analyticsLoading ? (
                    <div className="h-8 w-16 mt-1 bg-neutral-800 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  )}
                  <p className="text-xs text-emerald-400 mt-1">{stat.change}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity & Impact */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-neutral-800/50 last:border-0"
                >
                  <span className="text-sm text-neutral-300">{activity.description}</span>
                  <span className="text-xs text-neutral-500">{formatRelativeTime(activity.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Your Environmental Impact
            </h2>
            {impactLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4" />
                    Materials Exchanged
                  </span>
                  <span className="text-lg font-semibold text-white">
                    {impact?.summary?.totalTransactions || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400 flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    CO₂ Prevented
                  </span>
                  <span className="text-lg font-semibold text-emerald-400">
                    {formatWeight(impact?.summary?.co2Saved?.kg)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400 flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Water Saved
                  </span>
                  <span className="text-lg font-semibold text-blue-400">
                    {impact?.summary?.waterSaved?.liters ? `${formatNumber(impact.summary.waterSaved.liters)} L` : "0 L"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Waste Diverted
                  </span>
                  <span className="text-lg font-semibold text-teal-400">
                    {formatWeight(impact?.summary?.wasteDiverted?.kg)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
