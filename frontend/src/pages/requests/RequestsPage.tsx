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
  Scale,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  PackageCheck,
  ShieldCheck,
  Loader2,
  Lock
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

// ─── Payment Gateway Modal ──────────────────────────────────────────────────
type PayMethod = "upi" | "card" | "netbanking" | "wallet" | "cod";

const PaymentGatewayModal: React.FC<{
  request: any;
  onClose: () => void;
  onPaid: () => void;
}> = ({ request, onClose, onPaid }) => {
  const [method, setMethod] = useState<PayMethod>("upi");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [progress, setProgress] = useState(0);

  // UPI
  const [upiId, setUpiId] = useState("");
  const [upiMode, setUpiMode] = useState<"id" | "qr">("id");

  // Card
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Net banking
  const [selBank, setSelBank] = useState("");

  // Wallet
  const [selWallet, setSelWallet] = useState("");

  const amount = request.agreedPrice ?? request.offeredPrice ?? 0;

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const canPay = () => {
    if (method === "upi") return upiMode === "qr" || upiId.includes("@");
    if (method === "card") return cardNumber.replace(/\s/g, "").length === 16 && cardName && cardExpiry.includes("/") && cardCvv.length >= 3;
    if (method === "netbanking") return !!selBank;
    if (method === "wallet") return !!selWallet;
    return true; // cod
  };

  const handlePay = async () => {
    setPaying(true);
    setProgress(0);
    // Simulate processing with progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 60));
      setProgress(i);
    }
    setPaying(false);
    setPaid(true);
  };

  const banks = [
    "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
    "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda",
    "Canara Bank", "IndusInd Bank", "Yes Bank",
  ];

  const wallets = [
    { id: "paytm", label: "Paytm", color: "#00BAF2", emoji: "💙" },
    { id: "phonepe", label: "PhonePe", color: "#5F259F", emoji: "💜" },
    { id: "gpay", label: "Google Pay", color: "#4285F4", emoji: "🔵" },
    { id: "amazon", label: "Amazon Pay", color: "#FF9900", emoji: "🟠" },
  ];

  const methodTabs: { id: PayMethod; label: string; icon: any }[] = [
    { id: "upi", label: "UPI", icon: Smartphone },
    { id: "card", label: "Card", icon: CreditCard },
    { id: "netbanking", label: "Net Banking", icon: Building2 },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "cod", label: "Pay Later", icon: PackageCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/30 p-5 border-b border-neutral-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Secure Payment</span>
            </div>
            <h2 className="text-lg font-bold text-white">{request.material?.title}</h2>
            <p className="text-sm text-neutral-400">{request.quantityRequested} {request.material?.unit || "units"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-500 uppercase">Amount</p>
            <p className="text-2xl font-bold text-white">₹{amount.toLocaleString()}</p>
          </div>
        </div>

        {paid ? (
          // ── Success screen ──
          <div className="p-10 flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
            <p className="text-neutral-400 text-sm text-center">
              ₹{amount.toLocaleString()} paid via {methodTabs.find(m => m.id === method)?.label}.
              Your transaction has been initiated.
            </p>
            <div className="w-full p-4 bg-neutral-800/50 rounded-xl border border-neutral-700 mt-2">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-400">Transaction ID</span>
                <span className="text-white font-mono text-xs">TXN{Date.now().toString().slice(-10)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Status</span>
                <span className="text-emerald-400 font-bold">Confirmed</span>
              </div>
            </div>
            <button
              onClick={() => { onPaid(); onClose(); }}
              className="w-full mt-2 px-6 py-3 bg-emerald-500 text-neutral-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Method Tabs */}
            <div className="grid grid-cols-5 gap-1 bg-black/30 p-1 rounded-xl border border-neutral-800">
              {methodTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMethod(tab.id)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                    method === tab.id
                      ? "bg-neutral-700 text-emerald-400 shadow"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* UPI */}
            {method === "upi" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setUpiMode("id")} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${upiMode === "id" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-neutral-700 text-neutral-500"}`}>UPI ID</button>
                  <button onClick={() => setUpiMode("qr")} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${upiMode === "qr" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-neutral-700 text-neutral-500"}`}>Scan QR</button>
                </div>
                {upiMode === "id" ? (
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Enter UPI ID</label>
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <p className="text-[10px] text-neutral-500 mt-2">Supports PayTM, PhonePe, GPay, BHIM UPI</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="bg-white p-4 rounded-xl">
                      <QRCode
                        value={`upi://pay?pa=augenblick@upi&pn=Augenblick&am=${amount}&tn=${encodeURIComponent(request.material?.title || "Payment")}`}
                        size={140}
                      />
                    </div>
                    <p className="text-xs text-neutral-400 text-center">Scan with any UPI app to pay ₹{amount}</p>
                    <button onClick={() => setPaid(true)} className="text-xs text-emerald-400 underline">I've completed the payment</button>
                  </div>
                )}
              </div>
            )}

            {/* Card */}
            {method === "card" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5">Card Number</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    maxLength={19}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Name on card"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> 256-bit SSL encrypted. Your card data is never stored.</p>
              </div>
            )}

            {/* Net Banking */}
            {method === "netbanking" && (
              <div className="space-y-3">
                <label className="text-xs text-neutral-400 block">Select Your Bank</label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {banks.map(bank => (
                    <button
                      key={bank}
                      onClick={() => setSelBank(bank)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium text-left transition-all border ${
                        selBank === bank
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                          : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
                {selBank && <p className="text-xs text-neutral-400">You'll be redirected to <span className="text-white font-medium">{selBank}</span>'s secure portal.</p>}
              </div>
            )}

            {/* Wallet */}
            {method === "wallet" && (
              <div className="space-y-3">
                <label className="text-xs text-neutral-400 block">Choose Wallet</label>
                <div className="grid grid-cols-2 gap-3">
                  {wallets.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setSelWallet(w.id)}
                      className={`py-4 px-4 rounded-xl text-sm font-bold transition-all border flex items-center gap-3 ${
                        selWallet === w.id
                          ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                          : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-600"
                      }`}
                    >
                      <span className="text-xl">{w.emoji}</span> {w.label}
                    </button>
                  ))}
                </div>
                {selWallet && <p className="text-xs text-neutral-400">Log in with your <span className="text-white font-medium">{wallets.find(w => w.id === selWallet)?.label}</span> account to complete payment.</p>}
              </div>
            )}

            {/* Cash on Delivery / Pay Later */}
            {method === "cod" && (
              <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                    <PackageCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Pay on Handover</p>
                    <p className="text-xs text-neutral-400">Pay ₹{amount} when the material is handed over.</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500">Cash, bank transfer, or cheque accepted at the time of exchange.</p>
              </div>
            )}

            {/* Pay button */}
            <div className="space-y-3 pt-1">
              {paying && (
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <button
                onClick={handlePay}
                disabled={!canPay() || paying}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                {paying ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pay ₹{amount.toLocaleString()}</>
                )}
              </button>
              <button onClick={onClose} className="w-full py-2 text-neutral-500 text-sm hover:text-neutral-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

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
  const [submitting, setSubmitting] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [paymentReqId, setPaymentReqId] = useState<string | null>(null);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
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
    setChatMessage("");
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
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm font-bold">Request Approved</span>
                                </div>
                                {/* Show Pay Now only to buyer side (sent tab) when there's a price and it's not a free/donate listing */}
                                {activeTab === 'sent' && request.material.priceType !== 'free' && (request.agreedPrice ?? request.offeredPrice ?? 0) > 0 && (
                                  paidIds.has(request._id) ? (
                                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/30 text-sm font-bold">
                                      <CheckCircle className="w-4 h-4" /> Payment Done · ₹{(request.agreedPrice ?? request.offeredPrice ?? 0).toLocaleString()}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setPaymentReqId(request._id)}
                                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 text-sm"
                                    >
                                      <CreditCard className="w-4 h-4" /> Pay Now · ₹{(request.agreedPrice ?? request.offeredPrice ?? 0).toLocaleString()}
                                    </button>
                                  )
                                )}
                                {activeTab === 'sent' && (request.material.priceType === 'free' || (request.agreedPrice ?? request.offeredPrice ?? 0) === 0) && (
                                  <div className="flex items-center gap-2 text-teal-400 bg-teal-500/5 px-4 py-2 rounded-xl border border-teal-500/20 text-sm font-bold">
                                    <PackageCheck className="w-4 h-4" /> Free Exchange
                                  </div>
                                )}
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
      {/* Payment Gateway Modal */}
      <AnimatePresence>
        {paymentReqId && (() => {
          const req = data?.requests.find(r => r._id === paymentReqId);
          return req ? (
            <PaymentGatewayModal
              request={req}
              onClose={() => setPaymentReqId(null)}
              onPaid={() => setPaidIds(prev => new Set(prev).add(paymentReqId!))}
            />
          ) : null;
        })()}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default RequestsPage;
