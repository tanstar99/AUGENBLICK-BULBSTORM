// Transactions Page - Track material exchange lifecycles
import React, { useState, useEffect, useCallback } from "react";
import { 
  ArrowLeftRight, 
  Search, 
  Calendar, 
  Package, 
  TrendingUp,
  Scale,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  X,
  MapPin,
  Loader2,
  Navigation,
  User,
  Phone
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DashboardLayout } from "@/layouts";
import { useTransactions, useTransactionStats } from "@/hooks";
import { transactionsService } from "@/api/services";
import { ROUTES } from "@/config/constants";

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const senderIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const receiverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Transaction Status Config
const statusConfigs: Record<string, { label: string, color: string, icon: any, step: number }> = {
  initiated: { label: "Initiated", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Clock, step: 1 },
  scheduled: { label: "Scheduled", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: Calendar, step: 2 },
  in_progress: { label: "In Progress", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: ArrowLeftRight, step: 3 },
  handed_over: { label: "Handed Over", color: "text-teal-400 bg-teal-500/10 border-teal-500/20", icon: ShieldCheck, step: 4 },
  received: { label: "Received", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, step: 5 },
  completed: { label: "Completed", color: "text-emerald-500 bg-emerald-500/20 border-emerald-500/40", icon: CheckCircle2, step: 6 },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertCircle, step: 0 },
};

const formatAddress = (addr: any) => {
  if (!addr) return "N/A";
  const parts = [addr.street, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean);
  return parts.join(", ") || "N/A";
};

const TransactionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "completed">("all");
  const [activeRole, setActiveRole] = useState<"all" | "supplier" | "receiver">("all");
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);
  
  const { data: stats, loading: statsLoading } = useTransactionStats();
  const { data: transactionsData, loading: transLoading, error, refetch } = useTransactions({
    status: activeTab === "all" ? undefined : activeTab,
    role: activeRole === "all" ? undefined : activeRole
  });

  const transactions = transactionsData?.transactions || [];

  // Geocode an address string to [lat, lng] using Nominatim
  const geocodeAddress = useCallback(async (addr: any): Promise<[number, number] | null> => {
    if (!addr) return null;
    const q = [addr.street, addr.city, addr.state, addr.pincode, "India"].filter(Boolean).join(", ");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json();
      if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch { /* ignore */ }
    return null;
  }, []);

  // Open transaction detail modal
  const openDetail = async (txnId: string) => {
    setDetailLoading(true);
    try {
      const res = await transactionsService.getOne(txnId);
      const txn = res.data?.transaction || res.data;
      const userRole = res.data?.userRole;
      const canConfirm = res.data?.canConfirm;

      // Try to get coordinates for map
      let pickupCoords: [number, number] | null = null;
      let deliveryCoords: [number, number] | null = null;
      
      if (txn.pickupLocation?.coordinates?.length === 2) {
        pickupCoords = [txn.pickupLocation.coordinates[1], txn.pickupLocation.coordinates[0]];
      } else if (txn.pickupAddress || txn.material?.address) {
        pickupCoords = await geocodeAddress(txn.pickupAddress || txn.material?.address);
      }
      
      if (txn.deliveryLocation?.coordinates?.length === 2) {
        deliveryCoords = [txn.deliveryLocation.coordinates[1], txn.deliveryLocation.coordinates[0]];
      } else if (txn.deliveryAddress) {
        deliveryCoords = await geocodeAddress(txn.deliveryAddress);
      }

      setSelectedTxn({ ...txn, userRole, canConfirm, pickupCoords, deliveryCoords });
    } catch {
      setConfirmMsg({ id: txnId, msg: "Failed to load transaction details", type: "error" });
    } finally {
      setDetailLoading(false);
    }
  };

  // Confirm/complete transaction
  const handleConfirm = async (txnId: string) => {
    setConfirmLoading(txnId);
    try {
      const res = await transactionsService.update(txnId, "confirm");
      if (res.success) {
        setConfirmMsg({ id: txnId, msg: res.message || "Confirmed successfully!", type: "success" });
        refetch();
        if (selectedTxn?._id === txnId) {
          // Refresh the detail view
          setTimeout(() => openDetail(txnId), 500);
        }
      } else {
        setConfirmMsg({ id: txnId, msg: res.message || "Confirmation failed", type: "error" });
      }
    } catch (err: any) {
      setConfirmMsg({ id: txnId, msg: err?.response?.data?.message || err.message || "Error confirming", type: "error" });
    } finally {
      setConfirmLoading(null);
    }
  };

  // Auto-clear confirm messages
  useEffect(() => {
    if (confirmMsg) {
      const timer = setTimeout(() => setConfirmMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmMsg]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
            <p className="text-neutral-400">Track and manage the lifecycle of your material exchanges.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-xl hover:bg-neutral-700 transition-colors text-sm font-medium border border-neutral-700"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Impact Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-neutral-900/50 animate-pulse rounded-2xl border border-neutral-800/50" />
            ))
          ) : (
            [
              { 
                label: "CO₂ Saved", 
                value: `${(stats?.impact?.co2Saved || 0).toLocaleString()} kg`, 
                icon: TrendingUp, 
                color: "text-emerald-400",
                sub: "Total environmental impact"
              },
              { 
                label: "Waste Diverted", 
                value: `${(stats?.impact?.weightDiverted || 0).toLocaleString()} kg`, 
                icon: Scale, 
                color: "text-blue-400",
                sub: "Material weight diverted"
              },
              { 
                label: "Active Trades", 
                value: (stats?.byStatus?.initiated || 0) + (stats?.byStatus?.scheduled || 0) + (stats?.byStatus?.in_progress || 0), 
                icon: ArrowLeftRight, 
                color: "text-amber-400",
                sub: "Movements in progress"
              },
              { 
                label: "Completed", 
                value: stats?.overall?.completed || 0, 
                icon: CheckCircle2, 
                color: "text-teal-400",
                sub: `${stats?.overall?.total || 0} total transactions`
              },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-neutral-900/50 border border-neutral-800/50 p-5 rounded-2xl relative overflow-hidden group"
              >
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon className="w-24 h-24" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-neutral-800/50 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-xs font-medium text-neutral-400">{stat.label}</p>
                <p className="text-[10px] text-neutral-600 mt-2 uppercase tracking-tight">{stat.sub}</p>
              </motion.div>
            ))
          )}
        </div>

        {/* Confirm Message Toast */}
        <AnimatePresence>
          {confirmMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                confirmMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {confirmMsg.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <p className="text-sm font-medium">{confirmMsg.msg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Panel */}
        <div className="bg-neutral-900/40 border border-neutral-800/50 p-4 rounded-3xl flex flex-col lg:flex-row gap-6 lg:items-center justify-between backdrop-blur-sm">
          {/* Tab Filters */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Status</p>
              <div className="flex p-1 bg-black/40 rounded-xl border border-neutral-800/50">
                {["all", "in_progress", "completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      activeTab === tab ? "bg-neutral-800 text-emerald-400 shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {tab.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">My Role</p>
              <div className="flex p-1 bg-black/40 rounded-xl border border-neutral-800/50">
                {["all", "supplier", "receiver"].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role as any)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      activeRole === role ? "bg-neutral-800 text-blue-400 shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-64 self-end">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input 
              type="text" 
              placeholder="Search transactions..."
              className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Transactions List */}
        {transLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-neutral-900/50 animate-pulse rounded-2xl border border-neutral-800/50" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
            <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
            <p className="text-neutral-400">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-20 text-center bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Transactions Found</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              {activeTab === 'all' && activeRole === 'all' 
                ? "You haven't participated in any material exchanges yet. Start by browsing the marketplace!" 
                : "No transactions match your current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {transactions.map((transaction) => {
                const status = statusConfigs[transaction.status] || statusConfigs.initiated;
                const Icon = status.icon;
                const isSupplier = transaction.userRole === 'supplier';
                const imgSrc = typeof transaction.material.images?.[0] === 'object' 
                  ? (transaction.material.images[0] as any)?.url 
                  : transaction.material.images?.[0];

                return (
                  <motion.div
                    key={transaction._id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-neutral-700/80 transition-all group"
                  >
                    <div className="flex flex-col lg:flex-row">
                      {/* Left side: Material & Status */}
                      <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                        <div className="w-32 h-24 bg-neutral-800 rounded-xl overflow-hidden shrink-0 border border-neutral-700/50">
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {transaction.material?.title || "Unknown Material"}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isSupplier ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' : 'text-orange-400 bg-orange-500/10 border border-orange-500/20'}`}>
                              {isSupplier ? "Supplier" : "Receiver"}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <div className="flex items-center gap-2 text-neutral-400 text-xs">
                              <Package className="w-3.5 h-3.5" />
                              <span>{transaction.quantityExchanged} {transaction.material?.unit || 'units'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Last updated {new Date(transaction.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400 text-xs">
                              <span className="font-bold text-emerald-500">₹</span>
                              <span>{transaction.agreedPrice ? `₹${transaction.agreedPrice}` : 'Free Exchange'}</span>
                            </div>
                          </div>

                          {/* Confirmation status */}
                          {transaction.status !== "completed" && transaction.status !== "cancelled" && (
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`flex items-center gap-1 ${transaction.supplierConfirmed ? 'text-emerald-400' : 'text-neutral-600'}`}>
                                <CheckCircle2 className="w-3 h-3" /> Supplier {transaction.supplierConfirmed ? '✓' : 'pending'}
                              </span>
                              <span className={`flex items-center gap-1 ${transaction.receiverConfirmed ? 'text-emerald-400' : 'text-neutral-600'}`}>
                                <CheckCircle2 className="w-3 h-3" /> Receiver {transaction.receiverConfirmed ? '✓' : 'pending'}
                              </span>
                            </div>
                          )}

                          {/* Progress Stepper (Mini) */}
                          <div className="pt-2">
                             <div className="flex items-center justify-between mb-2">
                               <p className="text-[10px] text-neutral-500 font-bold uppercase">Lifecycle Status</p>
                               <span className={`text-[10px] font-bold flex items-center gap-1 ${status.color.split(' ')[0]}`}>
                                 <Icon className="w-3 h-3" />
                                 {status.label}
                               </span>
                             </div>
                             <div className="flex gap-1 h-1">
                               {[1, 2, 3, 4, 5, 6].map(s => (
                                 <div 
                                   key={s} 
                                   className={`flex-1 rounded-full ${s <= status.step ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-neutral-800'}`} 
                                 />
                               ))}
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Actions & Impact */}
                      <div className="lg:w-80 bg-black/20 border-t lg:border-t-0 lg:border-l border-neutral-800/80 p-6 flex flex-col justify-between items-center lg:items-end gap-4">
                        <div className="text-center lg:text-right space-y-4 w-full">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-neutral-600 uppercase">Environmental Gain</p>
                            <div className="flex flex-col gap-1">
                              <span className="text-emerald-400 font-bold text-sm">↓ {(transaction.impactMetrics?.co2Saved || 0).toFixed(1)} kg CO₂</span>
                              <span className="text-blue-400 font-bold text-sm">↻ {(transaction.impactMetrics?.weightDiverted || 0).toFixed(1)} kg Div.</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-neutral-600 uppercase">Party</p>
                            <p className="text-sm text-white font-medium">{isSupplier ? (transaction.receiver?.name || "Member") : (transaction.supplier?.name || "Member")}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          {/* Confirm Button */}
                          {transaction.canConfirm && transaction.status !== "completed" && transaction.status !== "cancelled" && (
                            <button 
                              onClick={() => handleConfirm(transaction._id)}
                              disabled={confirmLoading === transaction._id}
                              className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl text-xs font-bold hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {confirmLoading === transaction._id ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
                              ) : (
                                <><ShieldCheck className="w-4 h-4" /> {isSupplier ? "Confirm Handover" : "Confirm Receipt"}</>
                              )}
                            </button>
                          )}

                          {transaction.status === "completed" && (
                            <div className="w-full px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Transaction Complete
                            </div>
                          )}

                          <div className="flex items-center gap-2 w-full">
                            <button 
                              onClick={() => openDetail(transaction._id)}
                              className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all border border-neutral-700 flex items-center justify-center gap-1.5"
                            >
                              <Navigation className="w-3.5 h-3.5" /> View Details & Map
                            </button>
                            <Link 
                              to={`${ROUTES.MATERIAL_DETAILS.replace(':id', transaction.material?._id || '')}`}
                              className="p-2.5 bg-neutral-800 text-neutral-400 rounded-xl hover:text-emerald-400 transition-colors border border-neutral-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Loading Overlay */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-neutral-900 p-8 rounded-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-neutral-400 text-sm">Loading transaction details & map...</p>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal with Map */}
      <AnimatePresence>
        {selectedTxn && !detailLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto"
            onClick={() => setSelectedTxn(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTxn.material?.title || "Transaction Details"}</h2>
                  <p className="text-xs text-neutral-500 mt-1">ID: {selectedTxn._id}</p>
                </div>
                <button onClick={() => setSelectedTxn(null)} className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Stepper */}
                <div className="bg-neutral-800/30 p-5 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-neutral-300">Transaction Status</p>
                    {(() => {
                      const s = statusConfigs[selectedTxn.status] || statusConfigs.initiated;
                      const SIcon = s.icon;
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${s.color}`}>
                          <SIcon className="w-3 h-3 inline mr-1" />{s.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex gap-1 h-2 mb-4">
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <div key={s} className={`flex-1 rounded-full ${s <= (statusConfigs[selectedTxn.status]?.step || 1) ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${selectedTxn.supplierConfirmed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800/50 text-neutral-500'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Supplier {selectedTxn.supplierConfirmed ? 'Confirmed' : 'Pending'}</span>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${selectedTxn.receiverConfirmed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800/50 text-neutral-500'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Receiver {selectedTxn.receiverConfirmed ? 'Confirmed' : 'Pending'}</span>
                    </div>
                  </div>

                  {/* Confirm action in modal */}
                  {selectedTxn.canConfirm && selectedTxn.status !== "completed" && selectedTxn.status !== "cancelled" && (
                    <button
                      onClick={() => handleConfirm(selectedTxn._id)}
                      disabled={confirmLoading === selectedTxn._id}
                      className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {confirmLoading === selectedTxn._id ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
                      ) : (
                        <><ShieldCheck className="w-5 h-5" /> {selectedTxn.userRole === 'supplier' ? 'Confirm Handover' : 'Confirm Receipt'}</>
                      )}
                    </button>
                  )}
                </div>

                {/* Map — Route from Sender to Receiver */}
                <div className="bg-neutral-800/30 rounded-xl border border-neutral-800 overflow-hidden">
                  <div className="p-4 border-b border-neutral-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-400" /> Exchange Route
                    </h3>
                  </div>
                  {selectedTxn.pickupCoords || selectedTxn.deliveryCoords ? (
                    <div className="h-80">
                      <MapContainer
                        center={
                          selectedTxn.pickupCoords && selectedTxn.deliveryCoords
                            ? [(selectedTxn.pickupCoords[0] + selectedTxn.deliveryCoords[0]) / 2, (selectedTxn.pickupCoords[1] + selectedTxn.deliveryCoords[1]) / 2]
                            : selectedTxn.pickupCoords || selectedTxn.deliveryCoords
                        }
                        zoom={selectedTxn.pickupCoords && selectedTxn.deliveryCoords ? 11 : 14}
                        className="h-full w-full"
                        style={{ background: "#171717" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        {selectedTxn.pickupCoords && (
                          <Marker position={selectedTxn.pickupCoords} icon={senderIcon}>
                            <Popup>
                              <div className="text-xs">
                                <p className="font-bold">📤 Pickup (Sender)</p>
                                <p>{formatAddress(selectedTxn.pickupAddress || selectedTxn.material?.address)}</p>
                                <p className="text-gray-500 mt-1">{selectedTxn.supplier?.name}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                        {selectedTxn.deliveryCoords && (
                          <Marker position={selectedTxn.deliveryCoords} icon={receiverIcon}>
                            <Popup>
                              <div className="text-xs">
                                <p className="font-bold">📥 Delivery (Receiver)</p>
                                <p>{formatAddress(selectedTxn.deliveryAddress)}</p>
                                <p className="text-gray-500 mt-1">{selectedTxn.receiver?.name}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                        {selectedTxn.pickupCoords && selectedTxn.deliveryCoords && (
                          <Polyline
                            positions={[selectedTxn.pickupCoords, selectedTxn.deliveryCoords]}
                            pathOptions={{ color: "#10b981", weight: 3, dashArray: "10, 10", opacity: 0.8 }}
                          />
                        )}
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-neutral-600">
                      <div className="text-center">
                        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Location data not available for map route</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Pickup</p>
                      <p className="text-xs text-neutral-400">{formatAddress(selectedTxn.pickupAddress || selectedTxn.material?.address)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-red-400 uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery</p>
                      <p className="text-xs text-neutral-400">{formatAddress(selectedTxn.deliveryAddress)}</p>
                    </div>
                  </div>
                </div>

                {/* Parties Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-800">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3 flex items-center gap-1"><User className="w-3 h-3" /> Supplier</p>
                    <p className="text-sm font-bold text-white">{selectedTxn.supplier?.name || "Unknown"}</p>
                    {selectedTxn.supplier?.phone && (
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedTxn.supplier.phone}</p>
                    )}
                    {selectedTxn.supplier?.email && (
                      <p className="text-xs text-neutral-400 mt-0.5">{selectedTxn.supplier.email}</p>
                    )}
                  </div>
                  <div className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-800">
                    <p className="text-[10px] font-bold text-orange-400 uppercase mb-3 flex items-center gap-1"><User className="w-3 h-3" /> Receiver</p>
                    <p className="text-sm font-bold text-white">{selectedTxn.receiver?.name || "Unknown"}</p>
                    {selectedTxn.receiver?.phone && (
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedTxn.receiver.phone}</p>
                    )}
                    {selectedTxn.receiver?.email && (
                      <p className="text-xs text-neutral-400 mt-0.5">{selectedTxn.receiver.email}</p>
                    )}
                  </div>
                </div>

                {/* Exchange Details */}
                <div className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-800 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Quantity</p>
                    <p className="text-sm font-bold text-white mt-1">{selectedTxn.quantityExchanged} {selectedTxn.unit || 'units'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Price</p>
                    <p className="text-sm font-bold text-white mt-1">{selectedTxn.agreedPrice ? `₹${selectedTxn.agreedPrice}` : 'Free'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">CO₂ Saved</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">{(selectedTxn.impactMetrics?.co2Saved || 0).toFixed(1)} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Weight Diverted</p>
                    <p className="text-sm font-bold text-blue-400 mt-1">{(selectedTxn.impactMetrics?.weightDiverted || 0).toFixed(1)} kg</p>
                  </div>
                </div>

                {/* Timeline */}
                {selectedTxn.timeline?.length > 0 && (
                  <div className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-800">
                    <h3 className="text-sm font-bold text-white mb-4">Timeline</h3>
                    <div className="space-y-3">
                      {selectedTxn.timeline.map((event: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start">
                          <div className="w-2 h-2 mt-1.5 bg-emerald-500 rounded-full shrink-0" />
                          <div>
                            <p className="text-xs text-neutral-300">{event.description}</p>
                            <p className="text-[10px] text-neutral-600">{new Date(event.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default TransactionsPage;
