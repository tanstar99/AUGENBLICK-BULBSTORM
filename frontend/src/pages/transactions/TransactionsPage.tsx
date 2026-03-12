// Transactions Page - Track material exchange lifecycles
import React, { useState } from "react";
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
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useTransactions, useTransactionStats } from "@/hooks";
import { ROUTES } from "@/config/constants";

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

const TransactionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "completed">("all");
  const [activeRole, setActiveRole] = useState<"all" | "supplier" | "receiver">("all");
  
  const { data: stats, loading: statsLoading } = useTransactionStats();
  const { data: transactionsData, loading: transLoading, error, refetch } = useTransactions({
    status: activeTab === "all" ? undefined : activeTab,
    role: activeRole === "all" ? undefined : activeRole
  });

  const transactions = transactionsData?.transactions || [];

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
                label: "Exchanges", 
                value: stats?.overall?.completed || 0, 
                icon: CheckCircle2, 
                color: "text-teal-400",
                sub: "Successful completions"
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

          {/* Search/Search Mock */}
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
                          {transaction.material.images?.[0] ? (
                            <img src={transaction.material.images[0]} alt="" className="w-full h-full object-cover" />
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
                              <span>{transaction.quantity} {transaction.unit}</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Last updated {new Date(transaction.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-400 text-xs">
                              <span className="font-bold text-emerald-500">₹</span>
                              <span>{transaction.priceType === 'free' ? 'Free Exchange' : `₹${transaction.agreedPrice || 0}`}</span>
                            </div>
                          </div>

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
                      <div className="lg:w-72 bg-black/20 border-t lg:border-t-0 lg:border-l border-neutral-800/80 p-6 flex flex-col justify-between items-center lg:items-end gap-6">
                        <div className="text-center lg:text-right space-y-4 w-full">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-neutral-600 uppercase">Environmental Gain</p>
                            <div className="flex flex-col gap-1">
                              <span className="text-emerald-400 font-bold text-sm">↓ {transaction.impact.co2SavedKg} kg CO₂</span>
                              <span className="text-blue-400 font-bold text-sm">↻ {transaction.impact.weightKg} kg Div.</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-neutral-600 uppercase">Party</p>
                            <p className="text-sm text-white font-medium">{isSupplier ? (transaction.receiver?.name || "Member") : (transaction.supplier?.name || "Member")}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full lg:justify-end">
                           <button className="flex-1 lg:flex-none px-4 py-2 bg-neutral-800 text-white rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all border border-neutral-700">
                             Details
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
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransactionsPage;
