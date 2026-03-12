// Requests Page - Manage incoming and outgoing material requests
import React, { useState } from "react";
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical,
  Check,
  X,
  Plus,
  ArrowRight,
  Package,
  User,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useRequests } from "@/hooks";
import { requestsService } from "@/api/services";
import { ROUTES } from "@/config/constants";

// Request Status Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: "Pending", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
    approved: { label: "Approved", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
    rejected: { label: "Rejected", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: XCircle },
    completed: { label: "Completed", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "text-neutral-500 bg-neutral-500/10 border-neutral-500/20", icon: XCircle },
  };

  const config = configs[status.toLowerCase()] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const RequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [activeStatus, setActiveStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useRequests({
    type: activeTab,
    status: activeStatus === "all" ? undefined : activeStatus
  });

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'cancel') => {
    try {
      const result = await requestsService.updateStatus(requestId, action);
      if (result.success) {
        refetch();
      } else {
        alert(result.message || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      alert(`An error occurred while ${action}ing the request.`);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const tabs = [
    { id: "received", label: "Received Requests", icon: ArrowDownLeft },
    { id: "sent", label: "Sent Requests", icon: ArrowUpRight },
  ];

  const statusFilters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Requests</h1>
            <p className="text-neutral-400">Manage your material exchanges and collaboration requests.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setExpandedId(null);
              }}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${
                activeTab === tab.id ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabRequest"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                />
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveStatus(filter.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeStatus === filter.id
                  ? "bg-neutral-800 border-emerald-500/50 text-emerald-400 shadow-sm"
                  : "bg-transparent border-neutral-800 text-neutral-500 hover:border-neutral-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-neutral-900/50 animate-pulse rounded-2xl border border-neutral-800/50" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
            <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Something went wrong</h3>
            <p className="text-neutral-500">{error}</p>
          </div>
        ) : data?.requests.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-neutral-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No requests found</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              {activeStatus === 'all' 
                ? (activeTab === 'received' ? "You haven't received any material requests yet." : "You haven't sent any requests yet.")
                : `No requests with status "${activeStatus}" found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.requests.map((request) => (
              <motion.div
                key={request._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-neutral-900/50 border overflow-hidden rounded-2xl transition-all duration-300 ${
                  expandedId === request._id ? "border-emerald-500/30 ring-1 ring-emerald-500/10" : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Main Card Header */}
                <div 
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center gap-6"
                  onClick={() => toggleExpand(request._id)}
                >
                  {/* Material Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-neutral-800 rounded-xl overflow-hidden shrink-0">
                      {request.material.images?.[0] ? (
                        <img 
                          src={request.material.images[0]} 
                          alt={request.material.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-neutral-800">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-lg truncate group-hover:text-emerald-400">
                        {request.material.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={request.status} />
                        <span className="text-xs text-neutral-500">•</span>
                        <span className="text-xs text-neutral-500">
                          {new Date(request.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {activeTab === 'received' ? (
                          request.requester.avatar ? <img src={request.requester.avatar} alt="" /> : <User className="w-5 h-5 text-neutral-500" />
                        ) : (
                          request.supplier.avatar ? <img src={request.supplier.avatar} alt="" /> : <User className="w-5 h-5 text-neutral-500" />
                        )}
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-xs text-neutral-500 font-medium">{activeTab === 'received' ? "Requester" : "Supplier"}</p>
                        <p className="text-sm text-white font-semibold">
                          {activeTab === 'received' ? request.requester.name : request.supplier.name}
                        </p>
                      </div>
                    </div>

                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-neutral-500 font-medium">Quantity</p>
                      <p className="text-sm text-white font-bold">{request.requestedQuantity || 1} units</p>
                    </div>

                    <button className="p-2 text-neutral-500 hover:text-white transition-colors bg-neutral-800/50 rounded-lg">
                      <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${expandedId === request._id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === request._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-neutral-800/80 bg-neutral-900/40"
                    >
                      <div className="p-6 space-y-6">
                        {/* Message Content */}
                        <div className="space-y-4">
                          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Initial Message</label>
                          <div className="p-4 bg-black/30 rounded-2xl border border-neutral-800/50 italic text-neutral-300 leading-relaxed">
                            "{request.message || "No message provided."}"
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                          <div className="flex items-center gap-4">
                            <Link 
                              to={`${ROUTES.MATERIAL_DETAILS.replace(':id', request.material._id)}`}
                              className="text-emerald-400 text-sm font-semibold hover:underline flex items-center gap-1.5"
                            >
                              View Material Details <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          <div className="flex items-center gap-3">
                            {request.status === 'pending' && activeTab === 'received' && (
                              <>
                                <button
                                  onClick={() => handleAction(request._id, 'reject')}
                                  className="px-6 py-2.5 bg-neutral-800 text-neutral-400 font-bold rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-neutral-700 hover:border-red-500/20 transition-all flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" /> Reject
                                </button>
                                <button
                                  onClick={() => handleAction(request._id, 'approve')}
                                  className="px-6 py-2.5 bg-emerald-500 text-neutral-950 font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4" /> Approve Request
                                </button>
                              </>
                            )}

                            {request.status === 'pending' && activeTab === 'sent' && (
                              <button
                                onClick={() => handleAction(request._id, 'cancel')}
                                className="px-6 py-2.5 bg-neutral-800 text-neutral-400 font-bold rounded-xl hover:bg-neutral-700 transition-all border border-neutral-700 flex items-center gap-2"
                              >
                                <X className="w-4 h-4" /> Cancel Request
                              </button>
                            )}

                            {request.status === 'approved' && (
                              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-bold">Request Approved</span>
                              </div>
                            )}

                            {activeTab === 'received' && (
                              <Link
                                to={`/chat/${request.requester._id}`} 
                                className="p-2.5 bg-neutral-800 text-neutral-300 rounded-xl hover:bg-neutral-700 transition-all shadow-lg border border-neutral-700"
                                title="Message Requester"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RequestsPage;
