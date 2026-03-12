// Listings Page - Manage your material listings
import React, { useState } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useMyListings } from "@/hooks";
import { ROUTES } from "@/config/constants";
import { materialsService } from "@/api/services";

// Listing Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string, color: string, icon: any }> = {
    available: { label: "Available", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
    reserved: { label: "Reserved", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
    completed: { label: "Completed", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: CheckCircle },
    draft: { label: "Draft", color: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20", icon: Edit },
    removed: { label: "Removed", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertCircle },
  };

  const config = configs[status.toLowerCase()] || configs.draft;
  const Icon = config.icon;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const ListingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, loading, error, refetch } = useMyListings({
    status: activeTab === "all" ? undefined : activeTab,
    search: searchQuery || undefined
  });

  const handleDeleteListing = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this listing?")) {
      try {
        await materialsService.delete(id);
        refetch();
      } catch (err) {
        console.error("Failed to delete listing:", err);
        alert("Failed to delete listing. Please try again.");
      }
    }
  };

  const tabs = [
    { id: "all", label: "All Listings" },
    { id: "available", label: "Available" },
    { id: "reserved", label: "Reserved" },
    { id: "completed", label: "Completed" },
    { id: "draft", label: "Drafts" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Listings</h1>
            <p className="text-neutral-400">Manage and track your materials listed on the marketplace.</p>
          </div>
          <Link
            to={ROUTES.CREATE_LISTING}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create New Listing
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Active", value: data?.pagination.total || 0, icon: Package, color: "text-emerald-400" },
            { label: "Reserved", value: data?.materials.filter(m => m.status === 'reserved').length || 0, icon: Clock, color: "text-amber-400" },
            { label: "View Count", value: data?.materials.reduce((acc, m) => acc + (m.views || 0), 0) || 0, icon: BarChart3, color: "text-blue-400" },
            { label: "Materials Sold", value: data?.materials.filter(m => m.status === 'completed').length || 0, icon: CheckCircle, color: "text-teal-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-neutral-900/50 border border-neutral-800/50 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-xs text-neutral-500 font-medium">Lifetime</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-neutral-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-neutral-900/30 p-2 rounded-2xl border border-neutral-800/30">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-black/20 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-neutral-800 text-emerald-400 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search my listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-48 bg-neutral-900/50 animate-pulse rounded-2xl border border-neutral-800/50" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
            <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Failed to load listings</h3>
            <p className="text-neutral-500 mb-6">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 bg-neutral-800 text-white rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : data?.materials.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
            <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-emerald-500/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
              {searchQuery 
                ? `No materials matching "${searchQuery}" in ${activeTab} category.`
                : activeTab === "all" 
                  ? "You haven't listed any materials yet. Start your circular journey today!"
                  : `You don't have any items currently in ${activeTab} status.`}
            </p>
            {activeTab !== "all" || searchQuery ? (
              <button
                onClick={() => { setActiveTab("all"); setSearchQuery(""); }}
                className="text-emerald-400 font-medium hover:underline"
              >
                Clear all filters
              </button>
            ) : (
              <Link
                to={ROUTES.CREATE_LISTING}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-neutral-950 font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-900/20"
              >
                <Plus className="w-5 h-5" />
                List a Material
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {data?.materials.map((material, idx) => (
                <motion.div
                  key={material._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="group relative bg-neutral-900/50 border border-neutral-800/50 rounded-2xl overflow-hidden hover:border-emerald-800/50 transition-all duration-300 flex flex-col"
                >
                  {/* Image/Placeholder */}
                  <div className="relative aspect-[16/9] bg-neutral-800 overflow-hidden">
                    {material.images?.[0] ? (
                      <img 
                        src={material.images[0]?.url || material.images[0]} 
                        alt={material.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
                        🏠
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={material.status} />
                    </div>
                    
                    {/* View Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Link
                        to={`${ROUTES.MATERIAL_DETAILS.replace(':id', material._id)}`}
                        className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                        title="View Public Link"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      <Link
                        to={ROUTES.EDIT_LISTING.replace(':id', material._id)}
                        className="p-3 bg-emerald-500 text-neutral-950 rounded-full hover:scale-110 transition-transform"
                        title="Edit Listing"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                        {material.title}
                      </h3>
                      <button 
                        onClick={() => handleDeleteListing(material._id)}
                        className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-neutral-800/50">
                      <div className="text-xs text-neutral-500">
                        <p className="font-medium text-neutral-400">Quantity</p>
                        <p>{material.quantity} {material.unit}</p>
                      </div>
                      <div className="text-xs text-neutral-500">
                        <p className="font-medium text-neutral-400">Views</p>
                        <p>{material.views || 0}</p>
                      </div>
                      <div className="text-xs text-neutral-500 ml-auto">
                        <p className="font-medium text-neutral-400">Price</p>
                        <p className="text-emerald-400 font-bold">
                          {material.priceType === 'free' ? 'Free' : `₹${material.price || 0}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ListingsPage;
