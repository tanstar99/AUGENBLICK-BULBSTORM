// Notifications Page - User activity alerts and system updates
import React, { useState } from "react";
import { 
  Bell, 
  Package, 
  Truck, 
  CheckCircle2, 
  MessageSquare, 
  Check, 
  Clock,
  ArrowRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/layouts";

interface Notification {
  id: string;
  type: "request" | "transaction" | "logistics" | "system";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "request",
      title: "New Request Received",
      description: "Organic Cotton Scrap Co. has requested 50kg of Denim Factory Offcuts.",
      timestamp: new Date().toISOString(),
      isRead: false,
      link: "/requests"
    },
    {
      id: "2",
      type: "transaction",
      title: "Handover Confirmed",
      description: "The handover for 100 Wooden Pallets has been confirmed by the supplier.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      link: "/transactions"
    },
    {
      id: "3",
      type: "logistics",
      title: "Pickup Scheduled",
      description: "A pickup has been scheduled for your 'Recycled Plastic Pellets' listing by GreenLogistics.",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      link: "/logistics"
    },
    {
      id: "4",
      type: "system",
      title: "Impact Milestone!",
      description: "Congratulations! You've saved over 500kg of CO₂ this month.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true,
      link: "/impact"
    },
    {
      id: "5",
      type: "request",
      title: "Request Approved",
      description: "Your request for 'Steel Scrap' has been approved. Proceed to scheduling pickup.",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true,
      link: "/requests"
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "request": return <MessageSquare className="w-5 h-5 text-amber-400" />;
      case "transaction": return <Package className="w-5 h-5 text-blue-400" />;
      case "logistics": return <Truck className="w-5 h-5 text-indigo-400" />;
      case "system": return <Info className="w-5 h-5 text-emerald-400" />;
    }
  };

  const groupedNotifications = {
    Today: notifications.filter(n => new Date(n.timestamp).toDateString() === new Date().toDateString()),
    Yesterday: notifications.filter(n => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return new Date(n.timestamp).toDateString() === yesterday.toDateString();
    }),
    Earlier: notifications.filter(n => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return new Date(n.timestamp).getTime() < yesterday.setHours(0,0,0,0);
    })
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
              <Bell className="w-10 h-10 text-emerald-500" />
              NOTIFICATIONS
            </h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
              Stay updated on your circular marketplace activity
            </p>
          </div>
          <button 
            onClick={markAllAsRead}
            className="text-xs font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Mark all as read
          </button>
        </div>

        <div className="space-y-10">
          {Object.entries(groupedNotifications).map(([group, groupNotifs]) => (
            groupNotifs.length > 0 && (
              <div key={group} className="space-y-4">
                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2 px-2">
                  <Clock className="w-3 h-3" /> {group}
                </h3>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {groupNotifs.map((n) => (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative bg-neutral-900/40 border border-neutral-800/50 rounded-3xl p-6 hover:border-neutral-700 transition-all ${!n.isRead ? "after:content-[''] after:absolute after:top-6 after:right-6 after:w-2 after:h-2 after:bg-emerald-500 after:rounded-full after:shadow-[0_0_10px_rgba(16,185,129,0.5)]" : ""}`}
                      >
                        <div className="flex gap-6 items-start">
                          <div className={`p-3 rounded-2xl shrink-0 ${
                            n.type === "request" ? "bg-amber-400/10" :
                            n.type === "transaction" ? "bg-blue-400/10" :
                            n.type === "logistics" ? "bg-indigo-400/10" : "bg-emerald-400/10"
                          }`}>
                            {getIcon(n.type)}
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-black uppercase tracking-tight ${!n.isRead ? "text-white" : "text-neutral-400"}`}>
                                {n.title}
                              </h4>
                              <span className="text-[10px] font-bold text-neutral-600 uppercase">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 font-medium leading-relaxed max-w-2xl">
                              {n.description}
                            </p>
                            
                            <div className="flex items-center gap-4 pt-4">
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!n.isRead ? "text-emerald-500 hover:text-emerald-400" : "text-neutral-700 pointer-events-none"}`}
                              >
                                {n.isRead ? "Read" : "Mark as read"}
                              </button>
                              <div className="w-1 h-1 bg-neutral-800 rounded-full"></div>
                              <button 
                                onClick={() => deleteNotification(n.id)}
                                className="text-[10px] font-black text-neutral-700 uppercase tracking-widest hover:text-red-400 transition-colors"
                              >
                                Dismiss
                              </button>
                              {n.link && (
                                <>
                                  <div className="w-1 h-1 bg-neutral-800 rounded-full"></div>
                                  <a 
                                    href={n.link}
                                    className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-1"
                                  >
                                    View Details <ArrowRight className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          ))}

          {notifications.length === 0 && (
            <div className="py-20 bg-neutral-900/40 border border-neutral-800/50 border-dashed rounded-[3rem] text-center">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-neutral-600" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">ALL CAUGHT UP!</h3>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto font-bold px-6">
                No new notifications at the moment. We'll alert you when there's activity on your listings or requests.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
