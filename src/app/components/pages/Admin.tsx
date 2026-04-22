import { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppProvider";
import { motion } from "motion/react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import {
  ArrowUpRight, Clock, CheckCircle, XCircle,
  MoreVertical, FileText, Activity, Eye, Layers, ScanLine,
} from "lucide-react";
import { clsx } from "clsx";

// ─── helpers ────────────────────────────────────────────────────────────────

const avg = (nums: (number | undefined)[]) => {
  const valid = nums.filter((n): n is number => n !== undefined && n !== null);
  return valid.length ? Math.round(valid.reduce((s, n) => s + n, 0) / valid.length) : 0;
};

const ScoreBar = ({
  label, value, color,
}: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-medium">
      <span className="text-slate-600">{label}</span>
      <span style={{ color }}>{value}%</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  </div>
);

const AIMetricCard = ({
  icon: Icon,
  title,
  subtitle,
  value,
  color,
  bg,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  value: number;
  color: string;
  bg: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{subtitle}</p>
        <h3 className="text-lg font-bold text-slate-800 mt-0.5">{title}</h3>
      </div>
      <div className={`p-2.5 rounded-xl`} style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>

    {/* Circular progress */}
    <div className="flex items-center gap-5">
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
          <motion.circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="100"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 100 - value }}
            transition={{ duration: 1, delay, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold text-slate-800">{value}%</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Low</span><span>High</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${bg}, ${color})` }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.9, delay, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-slate-400">
          {value >= 85 ? "Excellent" : value >= 70 ? "Good" : value >= 50 ? "Fair" : "Needs Review"}
        </p>
      </div>
    </div>
  </motion.div>
);

// ─── main component ──────────────────────────────────────────────────────────

export const Admin = () => {
  const { reports, loading } = useAppContext();
  const [sortField, setSortField] = useState<"date" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);

  const stats = {
    total: reports.length,
    verified: reports.filter(r => r.status === "Verified").length,
    pending: reports.filter(r => r.status === "Pending").length,
    rejected: reports.filter(r => r.status === "Rejected").length,
  };

  // ── AI metric averages ─────────────────────────────────────────────────────
  const aiMetrics = useMemo(() => ({
    ela:     avg(reports.map(r => r.integrityScore)),
    yolo:    avg(reports.map(r => (r as any).yoloScore)),
    opencv:  avg(reports.map(r => (r as any).opencvScore)),
  }), [reports]);

  const radarData = [
    { subject: "ELA",    value: aiMetrics.ela },
    { subject: "YOLO",   value: aiMetrics.yolo },
    { subject: "OpenCV", value: aiMetrics.opencv },
    { subject: "Clean",  value: avg(reports.map(r => r.cleanlinessScore)) },
  ];

  const chartData = [
    { name: "Verified", value: stats.verified, color: "#10b981" },
    { name: "Pending",  value: stats.pending,  color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
  ];

  const recentActivity = [...reports]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date")   cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });
  }, [reports, sortField, sortAsc]);

  const toggleSort = (field: "date" | "status") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full py-8 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Admin</h1>
          <p className="text-slate-500 mt-1">Real-time overview of AI Verification tasks.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors text-sm font-medium">
          <FileText size={16} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-10 w-10 border-4 border-slate-200 border-t-emerald-600 rounded-full" />
        </div>
      ) : (
        <>
          {/* ── Row 1: Stats / Chart / Recent ────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold text-slate-700">Total Reports</h2>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Activity size={20} /></div>
                </div>
                <div className="text-5xl font-extrabold text-slate-900 mb-2">{stats.total}</div>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <span className="text-emerald-500 flex items-center"><ArrowUpRight size={14} /> 12%</span> vs last month
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Verification Rate</div>
                  <div className="text-xl font-bold text-slate-800">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Avg AI ELA</div>
                  <div className="text-xl font-bold text-slate-800">{aiMetrics.ela}%</div>
                </div>
              </div>
            </div>

            {/* Doughnut */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center relative">
              <h2 className="text-lg font-semibold text-slate-700 absolute top-6 left-6">Status Breakdown</h2>
              <div className="h-64 w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                      {chartData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">Recent Uploads</h2>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {recentActivity.map(r => (
                  <motion.div
                    key={r.id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img src={r.citizenImage} alt="Thumb" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-slate-800 truncate">{r.id}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === "Verified"  && <CheckCircle size={14} className="text-emerald-500" />}
                        {r.status === "Pending"   && <Clock       size={14} className="text-amber-500"   />}
                        {r.status === "Rejected"  && <XCircle     size={14} className="text-red-500"     />}
                        <span className="text-xs text-slate-500 truncate">{r.location}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 2: AI Engine Metrics (NEW) ───────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-800">AI Engine Metrics</h2>
              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
                Live Averages
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

              {/* ELA Card */}
              <AIMetricCard
                icon={ScanLine}
                title="ELA Score"
                subtitle="Error Level Analysis"
                value={aiMetrics.ela}
                color="#6366f1"
                bg="#eef2ff"
                delay={0}
              />

              {/* YOLO Card */}
              <AIMetricCard
                icon={Eye}
                title="YOLO Score"
                subtitle="Object Detection"
                value={aiMetrics.yolo}
                color="#0ea5e9"
                bg="#e0f2fe"
                delay={0.1}
              />

              {/* OpenCV Card */}
              <AIMetricCard
                icon={Layers}
                title="OpenCV Score"
                subtitle="Image Processing"
                value={aiMetrics.opencv}
                color="#10b981"
                bg="#d1fae5"
                delay={0.2}
              />

              {/* Radar overview */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-2"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Overview</p>
                  <h3 className="text-lg font-bold text-slate-800 mt-0.5">AI Radar</h3>
                </div>
                <div className="flex-1 min-h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Score bar summary strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <ScoreBar label="Avg ELA (Error Level Analysis)"     value={aiMetrics.ela}    color="#6366f1" />
              <ScoreBar label="Avg YOLO (Object Detection)"        value={aiMetrics.yolo}   color="#0ea5e9" />
              <ScoreBar label="Avg OpenCV (Image Processing)"      value={aiMetrics.opencv} color="#10b981" />
            </motion.div>
          </div>

          {/* ── Row 3: Data Table ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Data Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Location</th>
                    <th className="p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort("date")}>
                      Date {sortField === "date" && (sortAsc ? "↑" : "↓")}
                    </th>
                    <th className="p-4 font-medium cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => toggleSort("status")}>
                      Status {sortField === "status" && (sortAsc ? "↑" : "↓")}
                    </th>
                    <th className="p-4 font-medium">ELA</th>
                    <th className="p-4 font-medium">YOLO</th>
                    <th className="p-4 font-medium">OpenCV</th>
                    <th className="p-4 font-medium">Clean</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedReports.map(r => {
                    const yolo   = (r as any).yoloScore;
                    const opencv = (r as any).opencvScore;
                    const isPending = r.status === "Pending";

                    const ScorePill = ({ val, prefix }: { val: number | undefined; prefix: string }) =>
                      val !== undefined ? (
                        <span className={clsx("px-1.5 py-0.5 rounded text-xs font-mono",
                          (val || 0) > 80 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {prefix}:{val}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      );

                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="p-4 font-medium text-slate-800">{r.id}</td>
                        <td className="p-4 text-slate-600">{r.location}</td>
                        <td className="p-4 text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={clsx(
                            "px-2.5 py-1 rounded-full text-xs font-semibold",
                            r.status === "Verified" ? "bg-emerald-100 text-emerald-700" :
                            r.status === "Pending"  ? "bg-amber-100  text-amber-700"   :
                                                      "bg-red-100    text-red-700"
                          )}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {isPending ? <span className="text-slate-400 italic text-xs">Pending</span>
                            : <ScorePill val={r.integrityScore} prefix="E" />}
                        </td>
                        <td className="p-4">
                          {isPending ? <span className="text-slate-400 italic text-xs">Pending</span>
                            : <ScorePill val={yolo} prefix="Y" />}
                        </td>
                        <td className="p-4">
                          {isPending ? <span className="text-slate-400 italic text-xs">Pending</span>
                            : <ScorePill val={opencv} prefix="CV" />}
                        </td>
                        <td className="p-4">
                          {isPending ? <span className="text-slate-400 italic text-xs">Pending</span>
                            : <ScorePill val={r.cleanlinessScore} prefix="C" />}
                        </td>
                        <td className="p-4">
                          <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};