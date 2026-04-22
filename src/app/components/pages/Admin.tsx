import { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppProvider";
import { motion } from "motion/react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  ArrowUpRight, Clock, CheckCircle, XCircle, MoreVertical,
  FileText, Activity, Eye, Layers, ScanLine, MapPin, Building2,
} from "lucide-react";
import { clsx } from "clsx";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  navy:  "#091f36",
  blue:  "#0f2862",
  red:   "#9e363a",
  slate: "#4f5f76",
  light: "#c8d4e3",
  white: "#ffffff",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const avg = (nums: (number | undefined)[]) => {
  const valid = nums.filter((n): n is number => n !== undefined && n !== null && !isNaN(n));
  return valid.length ? Math.round(valid.reduce((s, n) => s + n, 0) / valid.length) : 0;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border p-5 shadow-sm ${className}`}
    style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.3)" }}>
    {children}
  </div>
);

const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-medium">
      <span style={{ color: C.light }}>{label}</span>
      <span style={{ color }}>{value}%</span>
    </div>
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(79,95,118,0.25)" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full" style={{ background: color }} />
    </div>
  </div>
);

const AIMetricCard = ({
  icon: Icon, title, subtitle, value, color, delay = 0,
}: {
  icon: React.ElementType; title: string; subtitle: string;
  value: number; color: string; delay?: number;
}) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="rounded-2xl border p-5 shadow-sm flex flex-col gap-4"
    style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.3)" }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.slate }}>{subtitle}</p>
        <h3 className="text-lg font-bold text-white mt-0.5">{title}</h3>
      </div>
      <div className="p-2.5 rounded-xl" style={{ background: "rgba(79,95,118,0.2)" }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>

    <div className="flex items-center gap-5">
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(79,95,118,0.3)" strokeWidth="3.5" />
          <motion.circle cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray="100"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 100 - value }}
            transition={{ duration: 1, delay, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold text-white">{value}%</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex justify-between text-xs" style={{ color: C.slate }}>
          <span>Low</span><span>High</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(79,95,118,0.25)" }}>
          <motion.div className="h-full rounded-full" style={{ background: color }}
            initial={{ width: 0 }} animate={{ width: `${value}%` }}
            transition={{ duration: 0.9, delay, ease: "easeOut" }} />
        </div>
        <p className="text-xs" style={{ color: C.slate }}>
          {value >= 85 ? "Excellent" : value >= 70 ? "Good" : value >= 50 ? "Fair" : "Needs Review"}
        </p>
      </div>
    </div>
  </motion.div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export const Admin = () => {
  const { reports, loading } = useAppContext();
  const [sortField, setSortField] = useState<"date" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total:    reports.length,
    verified: reports.filter(r => r.status === "Verified").length,
    pending:  reports.filter(r => r.status === "Pending").length,
    rejected: reports.filter(r => r.status === "Rejected").length,
  };

  // ── AI Metrics — only from resolved (non-Pending) reports ────────────────
  const resolved = useMemo(() => reports.filter(r => r.status !== "Pending"), [reports]);

  const aiMetrics = useMemo(() => ({
    ela:    avg(resolved.map(r => r.integrityScore)),
    clean:  avg(resolved.map(r => r.cleanlinessScore)),
    yolo:   avg(resolved.map(r => r.yoloScore)),
    opencv: avg(resolved.map(r => r.opencvScore)),
  }), [resolved]);

  const radarData = [
    { subject: "ELA",    value: aiMetrics.ela    },
    { subject: "YOLO",   value: aiMetrics.yolo   },
    { subject: "OpenCV", value: aiMetrics.opencv },
    { subject: "Clean",  value: aiMetrics.clean  },
  ];

  // ── City Summary — group by location from REAL data ──────────────────────
  const cityData = useMemo(() => {
    const map: Record<string, { total: number; verified: number; pending: number; rejected: number }> = {};
    reports.forEach(r => {
      // Use first meaningful segment of the location string as the area name
      const rawLoc = r.location ?? "Unknown";
      // Try to extract a short area name: take up to the first comma
      const area = rawLoc.split(",")[0].trim() || "Unknown";
      if (!map[area]) map[area] = { total: 0, verified: 0, pending: 0, rejected: 0 };
      map[area].total++;
      if (r.status === "Verified") map[area].verified++;
      else if (r.status === "Pending")  map[area].pending++;
      else if (r.status === "Rejected") map[area].rejected++;
    });
    return Object.entries(map)
      .map(([area, d]) => ({
        area,
        ...d,
        resolveRate: d.total > 0 ? Math.round((d.verified / d.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // top 8 areas
  }, [reports]);

  const chartData = [
    { name: "Verified", value: stats.verified, color: "#22c55e" },
    { name: "Pending",  value: stats.pending,  color: C.red     },
    { name: "Rejected", value: stats.rejected, color: C.slate   },
  ];

  const recentActivity = useMemo(() =>
    [...reports]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3),
    [reports]
  );

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full py-8 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Admin</h1>
          <p className="mt-1" style={{ color: C.light }}>Real-time overview of AI Verification tasks.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white border transition-colors"
          style={{ background: C.blue, borderColor: "rgba(79,95,118,0.4)" }}>
          <FileText size={16} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin h-10 w-10 border-4 rounded-full"
            style={{ borderColor: "rgba(79,95,118,0.3)", borderTopColor: C.red }} />
        </div>
      ) : (
        <>
          {/* ── Row 1: Stats / Pie / Recent ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Stats */}
            <Card>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-white">Total Reports</h2>
                <div className="p-2 rounded-lg" style={{ background: "rgba(79,95,118,0.2)" }}>
                  <Activity size={20} style={{ color: C.light }} />
                </div>
              </div>
              <div className="text-5xl font-extrabold text-white mb-2">{stats.total}</div>
              <p className="text-sm flex items-center gap-1" style={{ color: C.light }}>
                <span className="flex items-center" style={{ color: "#22c55e" }}>
                  <ArrowUpRight size={14} /> {stats.verified}
                </span> verified of {stats.total}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl border" style={{ background: "rgba(9,31,54,0.5)", borderColor: "rgba(79,95,118,0.25)" }}>
                  <div className="text-sm mb-1" style={{ color: C.slate }}>Verification Rate</div>
                  <div className="text-xl font-bold text-white">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                  </div>
                </div>
                <div className="p-4 rounded-xl border" style={{ background: "rgba(9,31,54,0.5)", borderColor: "rgba(79,95,118,0.25)" }}>
                  <div className="text-sm mb-1" style={{ color: C.slate }}>Avg ELA Score</div>
                  <div className="text-xl font-bold text-white">
                    {resolved.length > 0 ? `${aiMetrics.ela}%` : "—"}
                  </div>
                </div>
              </div>
            </Card>

            {/* Pie */}
            <Card className="flex flex-col items-center justify-center relative">
              <h2 className="text-lg font-semibold text-white absolute top-5 left-5">Status Breakdown</h2>
              <div className="h-64 w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                      paddingAngle={5} dataKey="value" nameKey="name">
                      {chartData.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ background: C.navy, border: `1px solid ${C.slate}`, borderRadius: 8 }}
                      labelStyle={{ color: C.light }} itemStyle={{ color: C.light }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle"
                      formatter={(v) => <span style={{ color: C.light, fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recent */}
            <Card className="flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Uploads</h2>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: C.slate }}>No reports yet</p>
                ) : recentActivity.map(r => (
                  <motion.div key={r.id} whileHover={{ y: -3, scale: 1.02 }}
                    className="flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-shadow"
                    style={{ background: "rgba(9,31,54,0.5)", borderColor: "rgba(79,95,118,0.25)" }}>
                    <img src={r.citizenImage} alt="Thumb" className="w-12 h-12 rounded-lg object-cover border"
                      style={{ borderColor: "rgba(79,95,118,0.3)" }} />
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-white truncate">{r.id}</span>
                        <span className="text-[10px]" style={{ color: C.slate }}>
                          {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === "Verified" && <CheckCircle size={14} style={{ color: "#22c55e" }} />}
                        {r.status === "Pending"  && <Clock       size={14} style={{ color: C.red }}    />}
                        {r.status === "Rejected" && <XCircle     size={14} style={{ color: C.slate }}  />}
                        <span className="text-xs truncate" style={{ color: C.light }}>{r.location}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Row 2: AI Engine Metrics ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">AI Engine Metrics</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{ background: "rgba(158,54,58,0.15)", color: "#fca5a5", borderColor: "rgba(158,54,58,0.3)" }}>
                {resolved.length} resolved reports
              </span>
              {resolved.length === 0 && (
                <span className="text-xs" style={{ color: C.slate }}>
                  (scores appear after worker resolves reports)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <AIMetricCard icon={ScanLine} title="ELA Score"    subtitle="Error Level Analysis" value={aiMetrics.ela}    color="#6366f1" delay={0}   />
              <AIMetricCard icon={Eye}      title="YOLO Score"   subtitle="Object Detection"      value={aiMetrics.yolo}  color={C.red}   delay={0.1} />
              <AIMetricCard icon={Layers}   title="OpenCV Score" subtitle="Image Processing"      value={aiMetrics.opencv} color="#22c55e" delay={0.2} />

              {/* Radar */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="rounded-2xl border p-5 shadow-sm flex flex-col gap-2"
                style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.3)" }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.slate }}>Overview</p>
                  <h3 className="text-lg font-bold text-white mt-0.5">AI Radar</h3>
                </div>
                <div className="flex-1 min-h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(79,95,118,0.3)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: C.light }} />
                      <Radar name="Score" dataKey="value" stroke={C.red} fill={C.red} fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Score bars */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-4 rounded-2xl border p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6"
              style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.3)" }}>
              <ScoreBar label="Avg ELA (Error Level Analysis)" value={aiMetrics.ela}    color="#6366f1" />
              <ScoreBar label="Avg YOLO (Object Detection)"    value={aiMetrics.yolo}   color={C.red}   />
              <ScoreBar label="Avg OpenCV (Image Processing)"  value={aiMetrics.opencv} color="#22c55e" />
              <ScoreBar label="Avg Cleanliness Score"          value={aiMetrics.clean}  color="#f59e0b" />
            </motion.div>
          </div>

          {/* ── Row 3: City Summary (REAL DATA) ─────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">City Summary</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{ background: "rgba(15,40,98,0.4)", color: C.light, borderColor: "rgba(79,95,118,0.35)" }}>
                By Location
              </span>
            </div>

            {cityData.length === 0 ? (
              <Card>
                <p className="text-center py-8" style={{ color: C.slate }}>
                  No reports yet. City summary will appear once citizens submit reports.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Bar chart */}
                <Card>
                  <h3 className="text-sm font-semibold mb-4 text-white">Reports by Area</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cityData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,95,118,0.2)" />
                        <XAxis dataKey="area" tick={{ fontSize: 10, fill: C.light }}
                          angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: C.light }} />
                        <RechartsTooltip
                          contentStyle={{ background: C.navy, border: `1px solid ${C.slate}`, borderRadius: 8 }}
                          labelStyle={{ color: C.light }} itemStyle={{ color: C.light }} />
                        <Bar dataKey="verified" name="Verified" fill="#22c55e" radius={[4,4,0,0]} />
                        <Bar dataKey="pending"  name="Pending"  fill={C.red}   radius={[4,4,0,0]} />
                        <Bar dataKey="rejected" name="Rejected" fill={C.slate} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                  <div className="p-5 border-b" style={{ borderColor: "rgba(79,95,118,0.25)" }}>
                    <h3 className="text-sm font-semibold text-white">Area Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr style={{ background: "rgba(9,31,54,0.5)" }}>
                          {["Area", "Total", "✓", "⏳", "✗", "Rate"].map(h => (
                            <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                              style={{ color: C.slate }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cityData.map((row, i) => (
                          <tr key={row.area}
                            className="border-t transition-colors hover:bg-white/5"
                            style={{ borderColor: "rgba(79,95,118,0.2)" }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MapPin size={12} style={{ color: C.red }} />
                                <span className="font-medium text-white truncate max-w-[120px]">{row.area}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-white">{row.total}</td>
                            <td className="px-4 py-3" style={{ color: "#22c55e" }}>{row.verified}</td>
                            <td className="px-4 py-3" style={{ color: "#fca5a5" }}>{row.pending}</td>
                            <td className="px-4 py-3" style={{ color: C.slate }}>{row.rejected}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(79,95,118,0.25)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${row.resolveRate}%`, background: "#22c55e" }} />
                                </div>
                                <span className="text-xs font-mono text-white">{row.resolveRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* ── Row 4: Data Table ────────────────────────────────────────────── */}
          <div className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.3)" }}>
            <div className="p-6 border-b flex justify-between items-center"
              style={{ borderColor: "rgba(79,95,118,0.25)" }}>
              <h2 className="text-lg font-semibold text-white">Data Management</h2>
              <span className="text-xs" style={{ color: C.slate }}>{reports.length} total reports</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider"
                    style={{ background: "rgba(9,31,54,0.5)" }}>
                    {["ID", "Location", "Date ↕", "Status ↕", "ELA", "YOLO", "OpenCV", "Clean", "Actions"].map((h, i) => {
                      const sortable = h === "Date ↕" ? "date" : h === "Status ↕" ? "status" : null;
                      return (
                        <th key={h}
                          className={clsx("p-4 font-medium", sortable && "cursor-pointer hover:bg-white/5 transition-colors select-none")}
                          style={{ color: C.slate }}
                          onClick={sortable ? () => toggleSort(sortable) : undefined}>
                          {h === "Date ↕"   ? `Date ${sortField === "date"   ? (sortAsc ? "↑" : "↓") : "↕"}` :
                           h === "Status ↕" ? `Status ${sortField === "status" ? (sortAsc ? "↑" : "↓") : "↕"}` : h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(79,95,118,0.15)" }}>
                  {sortedReports.map(r => {
                    const isPending = r.status === "Pending";

                    const Pill = ({ val, label }: { val: number | undefined; label: string }) =>
                      val !== undefined && !isNaN(val) ? (
                        <span className={clsx("px-1.5 py-0.5 rounded text-xs font-mono",
                          val > 80
                            ? "bg-green-900/40 text-green-400"
                            : "bg-red-900/40 text-red-400")}>
                          {label}:{val}%
                        </span>
                      ) : (
                        <span className="text-xs italic" style={{ color: C.slate }}>—</span>
                      );

                    return (
                      <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="transition-colors hover:bg-white/5 group">
                        <td className="p-4 font-medium text-white">{r.id}</td>
                        <td className="p-4 max-w-[180px]">
                          <div className="flex items-start gap-1">
                            <MapPin size={11} className="mt-0.5 shrink-0" style={{ color: C.red }} />
                            <span className="truncate text-xs" style={{ color: C.light }} title={r.location}>
                              {r.location}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm" style={{ color: C.light }}>
                          {new Date(r.date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold",
                            r.status === "Verified" ? "bg-green-900/40 text-green-400" :
                            r.status === "Pending"  ? "bg-red-900/30 text-red-300"     :
                                                      "bg-slate-700/50 text-slate-400")}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4">{isPending ? <span className="text-xs italic" style={{ color: C.slate }}>Pending</span> : <Pill val={r.integrityScore} label="E" />}</td>
                        <td className="p-4">{isPending ? <span className="text-xs italic" style={{ color: C.slate }}>Pending</span> : <Pill val={r.yoloScore}      label="Y" />}</td>
                        <td className="p-4">{isPending ? <span className="text-xs italic" style={{ color: C.slate }}>Pending</span> : <Pill val={r.opencvScore}    label="CV"/>}</td>
                        <td className="p-4">{isPending ? <span className="text-xs italic" style={{ color: C.slate }}>Pending</span> : <Pill val={r.cleanlinessScore} label="C" />}</td>
                        <td className="p-4">
                          <button className="p-1.5 rounded-md transition-colors"
                            style={{ color: C.slate }}
                            onMouseEnter={e => (e.currentTarget.style.color = C.light)}
                            onMouseLeave={e => (e.currentTarget.style.color = C.slate)}>
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}

                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center" style={{ color: C.slate }}>
                        No reports yet. Citizens can submit reports from the Citizen Portal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};