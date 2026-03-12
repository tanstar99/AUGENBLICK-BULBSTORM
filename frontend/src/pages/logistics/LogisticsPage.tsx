// Logistics Page - Job management for pickups and deliveries
import React, { useState } from "react";
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Search, 
  Plus,
  CheckCircle2,
  AlertCircle,
  Navigation
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useLogisticsJobs, useLogisticsStats } from "@/hooks";
import { logisticsService } from "@/api/services";

const LogisticsPage: React.FC = () => {
  const [role, setRole] = useState<"all" | "partner" | "receiver">("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  
  const { data: statsData } = useLogisticsStats();
  const { data: jobsData, loading, refetch } = useLogisticsJobs({ 
    role: role === "all" ? undefined : role, 
    status: status === "all" ? undefined : status 
  });

  const jobs = jobsData?.jobs || [];
  const overview = statsData?.overview || { total: 0, pending: 0, inProgress: 0, completed: 0, failed: 0 };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "assigned": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "picked_up": return "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";
      case "in_transit": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      case "delivered": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "cancelled": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-neutral-400 bg-neutral-400/10 border-neutral-400/20";
    }
  };

  const handleUpdateStatus = async (id: string, action: string) => {
    try {
      await logisticsService.updateJob(id, action);
      refetch();
    } catch (error) {
      console.error("Update job status error:", error);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.transaction.material.title.toLowerCase().includes(search.toLowerCase()) ||
    job.pickupAddress.city.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Active Jobs", value: overview.inProgress + overview.pending, icon: Truck, color: "text-emerald-400" },
    { label: "Pending", value: overview.pending, icon: Clock, color: "text-amber-400" },
    { label: "Completed", value: overview.completed, icon: CheckCircle2, color: "text-blue-400" },
    { label: "Failed/Cancelled", value: overview.failed, icon: AlertCircle, color: "text-red-400" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
              <Truck className="w-10 h-10 text-emerald-500" />
              LOGISTICS <span className="text-emerald-500">HUB</span>
            </h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
              Monitor Pickups, Deliveries & Fleet Coordination
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-6 py-3 bg-neutral-800 border border-neutral-700 text-white font-black rounded-2xl hover:bg-neutral-700 transition-all flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              SCHEDULE JOB
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-neutral-900/40 border border-neutral-800/50 rounded-[2rem] backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className="w-16 h-16" />
              </div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search by material or city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-neutral-800 focus:border-emerald-500/50 rounded-2xl py-4 pl-12 pr-4 text-white font-bold transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {[
              { id: "all", label: "All Roles" },
              { id: "partner", label: "As Partner" },
              { id: "receiver", label: "As Receiver" }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id as any)}
                className={`px-6 py-4 rounded-2xl border font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all ${
                  role === r.id 
                    ? "bg-emerald-500 border-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/20" 
                    : "bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                }`}
              >
                {r.label}
              </button>
            ))}

            <div className="h-10 w-px bg-neutral-800 mx-2 hidden lg:block"></div>

            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-4 text-xs font-black text-white uppercase tracking-widest outline-none focus:border-emerald-500"
            >
              <option value="all">Every Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="space-y-4">
          {loading ? (
             <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-neutral-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Syncing Logistics Pipeline...</p>
             </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-20 bg-neutral-900/40 border border-neutral-800/50 border-dashed rounded-[3rem] text-center">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-neutral-600" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">NO ACTIVE JOBS</h3>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto font-bold px-6">
                Your logistics queue is empty. Scheduled material pickups will appear here.
              </p>
            </div>
          ) : (
            filteredJobs.map((job, idx) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-neutral-900/40 border border-neutral-800/50 rounded-[2.5rem] overflow-hidden hover:border-neutral-700 transition-all group"
              >
                <div className="p-8 flex flex-col xl:flex-row gap-8 items-start xl:items-center">
                  {/* Info Column */}
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-center justify-between">
                      <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(job.status)}`}>
                        {job.status.replace("_", " ")}
                      </div>
                      <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Job ID: {job._id.slice(-8)}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center border border-neutral-700/50">
                        <Package className="w-8 h-8 text-neutral-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white leading-tight">
                          {job.transaction.material.title}
                        </h3>
                        <p className="text-xs font-bold text-neutral-500 mt-1 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-neutral-700 rounded-full"></span>
                          {job.jobType.replace("_", " ")} • {job.vehicleType || "Standard Fleet"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800/50">
                      <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                           <MapPin className="w-4 h-4 text-emerald-500" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Pickup</p>
                            <p className="text-xs font-bold text-white line-clamp-1">{job.pickupAddress.address}, {job.pickupAddress.city}</p>
                         </div>
                      </div>
                      <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                           <Navigation className="w-4 h-4 text-blue-500" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Delivery</p>
                            <p className="text-xs font-bold text-white line-clamp-1">
                              {job.deliveryAddress ? `${job.deliveryAddress.address}, ${job.deliveryAddress.city}` : "Self Pickup Coordination"}
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Column */}
                  <div className="xl:w-64 w-full bg-black/40 rounded-3xl p-6 border border-neutral-800/50 flex flex-col justify-center gap-4">
                     <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-neutral-500" />
                        <div>
                           <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Schedule</p>
                           <p className="text-sm font-black text-white">
                             {new Date(job.scheduledDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-neutral-500" />
                        <div>
                           <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Time Slot</p>
                           <p className="text-sm font-black text-white uppercase">{job.scheduledTimeSlot}</p>
                        </div>
                     </div>
                  </div>

                  {/* Actions Column */}
                  <div className="xl:w-48 w-full flex flex-col gap-3">
                    {job.status === "pending" && role === "partner" && (
                       <button 
                         onClick={() => handleUpdateStatus(job._id, "assign")}
                         className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                       >
                         Accept Job
                       </button>
                    )}
                    {job.status === "assigned" && (
                       <button 
                         onClick={() => handleUpdateStatus(job._id, "picked_up")}
                         className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                       >
                         Mark Picked Up
                       </button>
                    )}
                    {job.status === "picked_up" && (
                       <button 
                         onClick={() => handleUpdateStatus(job._id, "in_transit")}
                         className="w-full py-4 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                       >
                         In Transit
                       </button>
                    )}
                    {job.status === "in_transit" && (
                       <button 
                         onClick={() => handleUpdateStatus(job._id, "delivered")}
                         className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all"
                       >
                         Mark Delivered
                       </button>
                    )}
                    
                    <button className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                       View Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="px-8 pb-8 pt-2 overflow-x-auto scrollbar-hide">
                  <div className="flex items-center min-w-[600px] py-4">
                    {["pending", "assigned", "picked_up", "in_transit", "delivered"].map((step, idx, arr) => {
                      const isActive = step === job.status;
                      const isCompleted = arr.indexOf(job.status) >= idx;
                      
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                              isCompleted ? "bg-emerald-500 border-emerald-400" : "bg-neutral-900 border-neutral-800"
                            }`}>
                              {isActive && <div className="w-6 h-6 bg-emerald-500/20 rounded-full animate-ping -translate-x-1.5 -translate-y-1.5"></div>}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${
                              isCompleted ? "text-emerald-500" : "text-neutral-600"
                            }`}>
                              {step.replace("_", " ")}
                            </span>
                          </div>
                          {idx < arr.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${
                              isCompleted ? "bg-emerald-500/50" : "bg-neutral-800"
                            }`}></div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LogisticsPage;
