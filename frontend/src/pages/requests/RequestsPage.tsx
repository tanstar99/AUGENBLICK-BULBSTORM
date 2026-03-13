// Requests Page - Manage incoming and outgoing material requests
import React, { useState, useEffect } from "react";
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Check,
  X,
  ArrowRight,
  User,
  AlertCircle,
  Calendar,
  Truck,
  DollarSign,
  Send,
  Scale
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
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

// Optimistic message type (shown immediately after send, before next poll)
interface OptimisticMessage {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
  optimistic: true;
}

const RequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [activeStatus, setActiveStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState("");
  const [counterOfferMessage, setCounterOfferMessage] = useState("");
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  // Optimistic messages keyed by requestId — cleared on next successful poll
  const [optimistic, setOptimistic] = useState<Record<string, OptimisticMessage[]>>({});

  const { data, loading, error, refetch } = useRequests({
    type: activeTab,
    status: activeStatus === "all" ? undefined : activeStatus
  });

  // Poll for new messages every 4 seconds while a card is open
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (expandedId) {
      interval = setInterval(() => {
        refetch();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [expandedId, refetch]);

  const handleSendChatMessage = async (requestId: string) => {
    if (!chatMessage.trim()) return;
    const text = chatMessage.trim();
    setChatMessage("");

    // Determine my user ID from the current request data
    const request = data?.requests.find(r => r._id === requestId);
    const myId = request
      ? (activeTab === 'sent' ? request.requester._id : request.supplier._id)
      : 'me';

    // Add optimistic message immediately so sender sees it at once
    const tempMsg: OptimisticMessage = {
      _id: `opt-${Date.now()}`,
      sender: myId,
      content: text,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setOptimistic(prev => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), tempMsg],
    }));

    setSubmitting(true);
    try {
      await requestsService.addMessage(requestId, text);
      // After confirmed, clear optimistic msgs and refetch (backend now has the msg)
      setOptimistic(prev => ({ ...prev, [requestId]: [] }));
      refetch();
    } catch {
      // On error: revert optimistic message and restore input
      setOptimistic(prev => ({
        ...prev,
        [requestId]: (prev[requestId] || []).filter(m => m._id !== tempMsg._id),
      }));
      setChatMessage(text);
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    setShowCounterOffer(false);
    setCounterOfferAmount("");
    setCounterOfferMessage("");
    setChatMessage("");
  };

  const handleCounterOffer = async (requestId: string) => {
    if (!counterOfferAmount || Number(counterOfferAmount) <= 0) return;
    setSubmitting(true);
    try {
      await requestsService.counterOffer(requestId, {
        amount: Number(counterOfferAmount),
        message: counterOfferMessage,
      });
      setShowCounterOffer(false);
      setCounterOfferAmount("");
      setCounterOfferMessage("");
      refetch();
    } catch {
      alert("Failed to send counter offer.");
    } finally {
      setSubmitting(false);
    }
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
                        {/* Request Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-black/30 rounded-xl border border-neutral-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Scale className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-[10px] text-neutral-500 font-bold uppercase">Qty Requested</span>
                            </div>
                            <p className="text-sm font-bold text-white">{request.quantityRequested} {request.material?.unit || 'units'}</p>
                          </div>
                          <div className="p-3 bg-black/30 rounded-xl border border-neutral-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[10px] text-neutral-500 font-bold uppercase">Offered Price</span>
                            </div>
                            <p className="text-sm font-bold text-white">{request.offeredPrice != null ? `₹${request.offeredPrice}` : 'Not specified'}</p>
                          </div>
                          <div className="p-3 bg-black/30 rounded-xl border border-neutral-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Truck className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-[10px] text-neutral-500 font-bold uppercase">Logistics</span>
                            </div>
                            <p className="text-sm font-bold text-white capitalize">{(request.logisticsPreference || 'flexible').replace('_', ' ')}</p>
                          </div>
                          <div className="p-3 bg-black/30 rounded-xl border border-neutral-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-[10px] text-neutral-500 font-bold uppercase">Pickup Date</span>
                            </div>
                            <p className="text-sm font-bold text-white">
                              {request.proposedPickupDate 
                                ? new Date(request.proposedPickupDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                                : 'Flexible'}
                            </p>
                          </div>
                        </div>

                        {/* Time Slot & Purpose */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {request.proposedPickupTimeSlot && request.proposedPickupTimeSlot !== 'flexible' && (
                            <div className="p-3 bg-black/30 rounded-xl border border-neutral-800/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-[10px] text-neutral-500 font-bold uppercase">Time Slot</span>
                              </div>
                              <p className="text-sm font-bold text-white capitalize">{request.proposedPickupTimeSlot}</p>
                            </div>
                          )}
                          {request.purpose && (
                            <div className="p-3 bg-black/30 rounded-xl border border-neutral-800/50 col-span-1 md:col-span-2">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-[10px] text-neutral-500 font-bold uppercase">Purpose</span>
                              </div>
                              <p className="text-sm text-neutral-300">{request.purpose}</p>
                            </div>
                          )}
                        </div>

                        {/* Message Content */}
                        {request.message && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Message</label>
                            <div className="p-4 bg-black/30 rounded-2xl border border-neutral-800/50 italic text-neutral-300 leading-relaxed">
                              "{request.message}"
                            </div>
                          </div>
                        )}

                        {/* Expiry Info */}
                        {request.expiresAt && request.status === 'pending' && (
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Clock className="w-3 h-3" />
                            <span>Expires {new Date(request.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}

                        {/* Counter Offers History */}
                        {request.counterOffers && request.counterOffers.length > 0 && (
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Negotiation History</label>
                            <div className="space-y-2">
                              {request.counterOffers.map((offer, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-neutral-800/30">
                                  <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center shrink-0">
                                    <DollarSign className="w-4 h-4 text-amber-400" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-bold text-white">₹{offer.amount}</p>
                                      <span className="text-[10px] text-neutral-500">
                                        {new Date(offer.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    {offer.message && <p className="text-xs text-neutral-400 mt-1">{offer.message}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Counter Offer Form */}
                        {request.status === 'pending' && (
                          <div>
                            {!showCounterOffer ? (
                              <button
                                onClick={() => setShowCounterOffer(true)}
                                className="text-amber-400 text-sm font-semibold hover:underline flex items-center gap-1.5"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> Make Counter Offer
                              </button>
                            ) : (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white">Counter Offer</h4>
                                  <button onClick={() => setShowCounterOffer(false)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="flex gap-3">
                                  <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">₹</span>
                                    <input
                                      type="number"
                                      min={0}
                                      placeholder="Amount"
                                      value={counterOfferAmount}
                                      onChange={(e) => setCounterOfferAmount(e.target.value)}
                                      className="w-full pl-7 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-amber-500 transition-colors"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Optional message..."
                                    value={counterOfferMessage}
                                    onChange={(e) => setCounterOfferMessage(e.target.value)}
                                    className="flex-[2] px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm outline-none focus:border-amber-500 transition-colors"
                                  />
                                  <button
                                    onClick={() => handleCounterOffer(request._id)}
                                    disabled={submitting || !counterOfferAmount}
                                    className="px-4 py-2.5 bg-amber-500 text-neutral-950 font-bold rounded-xl text-sm hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center gap-1"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )}

                        {/* Chat Messages */}
                        <div className="space-y-3 mt-6 pt-2">
                          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-400" /> Discussion
                          </label>
                          <div className="bg-neutral-950/50 rounded-2xl border border-neutral-800/50 overflow-hidden flex flex-col">
                            {/* Messages Area */}
                            <div className="p-4 max-h-60 overflow-y-auto space-y-4 flex flex-col-reverse">
                              <div className="flex flex-col space-y-4">
                                {(() => {
                                  const myId = activeTab === 'sent' ? request.requester._id : request.supplier._id;
                                  // Merge confirmed backend messages with any pending optimistic ones
                                  const confirmed = (request.messages || []) as Array<{ _id?: string; sender: string; content: string; createdAt: string }>;
                                  const pending = optimistic[request._id] || [];
                                  const msgs = [...confirmed, ...pending];
                                  if (msgs.length === 0) {
                                    return <p className="text-center text-sm text-neutral-500 italic py-4">No messages yet. Start the conversation!</p>;
                                  }
                                  return msgs.map((msg, i) => {
                                    const senderId = typeof msg.sender === 'object' ? (msg.sender as any)._id : msg.sender;
                                    const isMine = senderId === myId;
                                    return (
                                      <div key={msg._id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                                          isMine
                                            ? 'bg-emerald-500 text-neutral-950 rounded-br-sm shadow-md shadow-emerald-900/10'
                                            : 'bg-neutral-800 text-neutral-200 rounded-bl-sm border border-neutral-700/50'
                                        }`}>
                                          {msg.content}
                                        </div>
                                        <span className="text-[10px] text-neutral-500 mt-1 font-medium">
                                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                            {/* Message Input */}
                            <div className="p-3 bg-neutral-900/80 border-t border-neutral-800/50 flex gap-3">
                              <input
                                type="text"
                                placeholder="Type a message..."
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSendChatMessage(request._id);
                                }}
                                className="flex-1 bg-black/50 border border-neutral-700/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-neutral-600"
                              />
                              <button
                                onClick={() => handleSendChatMessage(request._id)}
                                disabled={submitting || !chatMessage.trim()}
                                className="px-4 py-2 bg-emerald-500 text-neutral-950 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-neutral-800/50">
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
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm font-bold">Request Approved</span>
                                </div>
                                <div className="bg-white p-2 flex items-center justify-center rounded-xl shadow-sm">
                                  <QRCode 
                                    value={JSON.stringify({
                                      id: request._id,
                                      material: request.material?.title || 'Unknown',
                                      status: 'approved'
                                    })}
                                    size={80}
                                  />
                                </div>
                              </div>
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
