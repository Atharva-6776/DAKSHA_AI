import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { Map, Zap, AlertCircle } from "lucide-react";
import { useAppContext } from "../../context/AppProvider";

export const Summary = () => {
  const { reports } = useAppContext();
  
  const trendData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const data = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dayLabel = days[d.getDay()];
      
      const dayReports = reports.filter(r => new Date(r.date).toDateString() === d.toDateString());
      return {
        day: dayLabel,
        reports: dayReports.length,
        verified: dayReports.filter(r => r.status === 'Verified').length
      };
    });
    return data;
  }, [reports]);
  return (
    <div className="w-full py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">City Summary</h1>
        <p className="text-slate-500 mt-1">High-level insights and cleanliness heatmap.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Heatmap Simulation Container */}
        <div className="bg-slate-900 rounded-3xl p-1 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 z-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1600&auto=format&fit=crop" 
              alt="Map Background" 
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <div className="relative z-10 bg-slate-900/60 backdrop-blur-md h-96 w-full rounded-2xl flex flex-col p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold flex items-center gap-2"><Map size={20} className="text-emerald-400" /> Live Heatmap</h2>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs text-white/70"><div className="w-2 h-2 rounded-full bg-red-500" /> Hotspots</span>
                <span className="flex items-center gap-1 text-xs text-white/70"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Cleaned</span>
              </div>
            </div>
            
            {/* Simulated Heatmap Overlay */}
            <div className="relative flex-grow">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }} 
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-[20%] left-[30%] w-24 h-24 bg-red-500/40 rounded-full blur-xl"
              />
               <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} 
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute top-[50%] left-[60%] w-32 h-32 bg-amber-500/40 rounded-full blur-xl"
              />
              <motion.div 
                className="absolute top-[70%] left-[20%] w-40 h-40 bg-emerald-500/40 rounded-full blur-xl"
              />
              <motion.div 
                className="absolute top-[30%] left-[70%] w-20 h-20 bg-emerald-500/50 rounded-full blur-xl"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Trend Chart */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex-grow">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Weekly Verification Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs key="defs">
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis key="xaxis" dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis key="yaxis" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <Tooltip 
                    key="tooltip"
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area key="area-reports" type="monotone" dataKey="reports" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorReports)" />
                  <Area key="area-verified" type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVerified)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Insights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Zap size={20} /></div>
            <div>
              <h3 className="font-semibold text-emerald-900 text-sm mb-1">AI Efficiency</h3>
              <p className="text-emerald-700 text-xs leading-relaxed">Automation saved 450+ hours of manual inspection this week. Average ELA scan time: 1.2s.</p>
            </div>
         </div>
         <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><AlertCircle size={20} /></div>
            <div>
              <h3 className="font-semibold text-amber-900 text-sm mb-1">Fraud Alerts</h3>
              <p className="text-amber-700 text-xs leading-relaxed">12 reports flagged for high-entropy inconsistencies (likely photoshop or old images).</p>
            </div>
         </div>
         <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Map size={20} /></div>
            <div>
              <h3 className="font-semibold text-blue-900 text-sm mb-1">Zonal Mapping</h3>
              <p className="text-blue-700 text-xs leading-relaxed">Sector 14 currently experiencing 3x standard report volume. Recommend deploying extra units.</p>
            </div>
         </div>
      </div>
    </div>
  );
};