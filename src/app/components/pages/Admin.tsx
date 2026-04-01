import { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppProvider";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { ArrowUpRight, Clock, CheckCircle, XCircle, MoreVertical, FileText, Activity } from "lucide-react";
import { clsx } from "clsx";

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

  const chartData = [
    { name: "Verified", value: stats.verified, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
  ];

  const recentActivity = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [reports, sortField, sortAsc]);

  const toggleSort = (field: "date" | "status") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  return (
    <div className="w-full py-8 space-y-8">
      <div className="flex justify-between items-center mb-8">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-slate-700">Total Reports</h2>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Activity size={20} />
              </div>
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
              <div className="text-xl font-bold text-slate-800">92%</div>
            </div>
          </div>
        </div>

        {/* Column 2: Doughnut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center relative">
          <h2 className="text-lg font-semibold text-slate-700 absolute top-6 left-6">Status Breakdown</h2>
          <div className="h-64 w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  key="pie"
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip key="tooltip" />
                <Legend key="legend" verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Column 3: Recent Activity */}
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
                      {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "Verified" && <CheckCircle size={14} className="text-emerald-500" />}
                    {r.status === "Pending" && <Clock size={14} className="text-amber-500" />}
                    {r.status === "Rejected" && <XCircle size={14} className="text-red-500" />}
                    <span className="text-xs text-slate-500 truncate">{r.location}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
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
                <th className="p-4 font-medium">Scores (ELA / Clean)</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedReports.map((r) => (
                <motion.tr 
                  key={r.id} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="p-4 font-medium text-slate-800">{r.id}</td>
                  <td className="p-4 text-slate-600">{r.location}</td>
                  <td className="p-4 text-slate-600">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      r.status === "Verified" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "Pending" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.status !== "Pending" ? (
                      <div className="flex gap-2 text-xs font-mono">
                        <span className={clsx("px-1.5 py-0.5 rounded", (r.integrityScore || 0) > 80 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                          E:{r.integrityScore}%
                        </span>
                        <span className={clsx("px-1.5 py-0.5 rounded", (r.cleanlinessScore || 0) > 80 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                          C:{r.cleanlinessScore}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Awaiting worker</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};