// Impact Page - Sustainability metrics and community leaderboard
import React, { useState } from "react";
import { 
  TrendingUp, 
  Scale, 
  Zap, 
  TreePine, 
  Car, 
  Plane, 
  ChevronRight, 
  BarChart3,
  Trophy,
  Users,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { useUserImpact, useLeaderboard } from "@/hooks";

const ImpactPage: React.FC = () => {
  const [leaderboardMetric, setLeaderboardMetric] = useState("co2Saved");
  const { data: impact } = useUserImpact();
  const { data: leaderboardData, loading: leadLoading } = useLeaderboard(leaderboardMetric);

  const leaderboard = leaderboardData?.leaderboard || [];

  const mainStats = [
    { label: "CO₂ Saved", value: impact?.summary?.co2SavedKg ?? 0, unit: "kg", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Waste Diverted", value: impact?.summary?.wasteDivertedKg ?? 0, unit: "kg", icon: Scale, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Rank", value: impact?.ranking?.position ?? "---", unit: "", icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Exchange Volume", value: impact?.summary?.totalTransactions ?? 0, unit: "txs", icon: Zap, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  // Calculate equivalents on the fly if not in API
  const co2 = impact?.summary?.co2SavedKg || 0;
  const equivalents = [
    { label: "Trees Planted", value: (co2 / 21).toFixed(1), icon: TreePine, sub: "CO₂ absorption equivalent" },
    { label: "Car Miles Avoided", value: (co2 / 0.4).toFixed(1), icon: Car, sub: "Emissions equivalent" },
    { label: "Flights Avoided", value: (co2 / 90).toFixed(2), icon: Plane, sub: "Long-haul travel saved" },
  ];

  const metrics = [
    { id: "co2Saved", label: "CO₂ Savings" },
    { id: "materialsSaved", label: "Materials Diverted" },
    { id: "totalTransactions", label: "Exchange Volume" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* Hero Section */}
        <div className="relative rounded-[2rem] bg-neutral-900/40 border border-neutral-800/50 p-8 md:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full -mr-48 -mt-48"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Your Environmental Legacy</h1>
            <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">
              Every material exchange contributes to a circular economy. Tracker your contribution to global sustainability goals through real-world metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 relative z-10">
            {mainStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-black/40 border border-white/5 p-6 rounded-3xl"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">{(stat.value || 0).toLocaleString()}</span>
                  <span className="text-xs font-bold text-neutral-500 uppercase">{stat.unit}</span>
                </div>
                <p className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equivalents */}
          <div className="lg:col-span-2 space-y-8">
             <section className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Target className="w-6 h-6 text-emerald-500" /> Environmental Equivalents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {equivalents.map((eq, i) => (
                    <div key={i} className="bg-neutral-900/40 border border-neutral-800/50 p-6 rounded-3xl text-center group">
                      <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <eq.icon className="w-8 h-8 text-neutral-400 group-hover:text-emerald-400" />
                      </div>
                      <p className="text-3xl font-black text-white mb-1">{eq.value}</p>
                      <p className="text-sm font-bold text-neutral-300 mb-1">{eq.label}</p>
                      <p className="text-[10px] text-neutral-500 uppercase font-medium">{eq.sub}</p>
                    </div>
                  ))}
                </div>
             </section>

             {/* Monthly Breakdown Chart (CSS Only) */}
             <section className="bg-neutral-900/40 border border-neutral-800/50 p-8 rounded-[2rem] space-y-8">
                <div className="flex items-center justify-between">
                   <h2 className="text-xl font-bold text-white flex items-center gap-3">
                     <BarChart3 className="w-6 h-6 text-blue-500" /> Monthly Savings Trend
                   </h2>
                   <div className="px-3 py-1 bg-neutral-800 rounded-lg text-[10px] font-bold text-neutral-400 uppercase">
                     Last 6 Months
                   </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-4 px-4">
                  {impact?.monthlyBreakdown ? (
                    impact.monthlyBreakdown.slice(-6).map((monthData, i) => {
                      const maxVal = Math.max(...impact.monthlyBreakdown.map(m => m.co2SavedKg || 0)) || 1;
                      const height = ((monthData.co2SavedKg || 0) / maxVal) * 100;
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      const monthLabel = monthData.month ? monthNames[monthData.month - 1] : "---";
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                          <div className="w-full h-44 relative flex items-end">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className="w-full bg-gradient-to-t from-emerald-500/10 via-emerald-500/40 to-emerald-400 rounded-t-xl relative group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all"
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {monthData.co2SavedKg}kg
                              </div>
                            </motion.div>
                          </div>
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter shrink-0">{monthLabel} {monthData.year}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-2">
                      <div className="w-4 h-4 border-2 border-neutral-700 border-t-emerald-500 rounded-full animate-spin"></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Generating Trend Data...</p>
                    </div>
                  )}
                </div>
             </section>
          </div>

          {/* Leaderboard */}
          <div className="space-y-6">
            <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-[2rem] overflow-hidden">
               <div className="p-6 border-b border-neutral-800/50 bg-black/20">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-amber-500" /> Leaderboard
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {metrics.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setLeaderboardMetric(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          leaderboardMetric === m.id 
                            ? "bg-emerald-500 text-neutral-950" 
                            : "bg-neutral-800 text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        {m.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="p-2 space-y-1">
                 {leadLoading ? (
                   [1, 2, 3, 4, 5].map(i => (
                     <div key={i} className="h-16 bg-neutral-800/50 animate-pulse rounded-2xl mx-2" />
                   ))
                 ) : leaderboard.map((entry, i) => (
                   <motion.div
                     key={entry.id}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                       i === 0 ? "bg-amber-500/5 border border-amber-500/10" : "hover:bg-neutral-800/50"
                     }`}
                   >
                     <div className="w-8 font-black text-neutral-600 text-center">
                       {entry.rank}
                     </div>
                     <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700 shrink-0">
                       {entry.avatar ? (
                         <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
                           {entry.name?.[0] || "?"}
                         </div>
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                       <p className="text-[10px] text-neutral-500 font-medium truncate">{entry.role || "Eco Partner"}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-black text-emerald-400">
                         {Object.values(entry.metrics).reduce((a, b) => a + b, 0).toLocaleString()}
                       </p>
                       <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tighter">Score</p>
                     </div>
                   </motion.div>
                 ))}
               </div>
               
               <div className="p-6 bg-black/20 text-center mt-2 border-t border-neutral-800/50">
                  <button className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-2 mx-auto">
                    View Full Rankings <ChevronRight className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>

            {/* Platform Stats Card */}
            <div className="bg-emerald-500 p-8 rounded-[2rem] text-neutral-950 relative overflow-hidden group">
               <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                 <Users className="w-48 h-48" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImpactPage;
