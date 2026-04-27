import { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppProvider";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { CheckCircle, Clock, XCircle, MoreVertical, FileText, Activity, Eye, Layers, ScanLine, MapPin } from "lucide-react";
import { clsx } from "clsx";

const C = { yellow: "#feda6a", silver: "#d4d4dc", grey: "#393f4d", dark: "#1d1e22", darker: "#14151a" };
const S = {
  label: { fontFamily: "'Rajdhani', sans-serif" as const, fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: C.yellow },
  body:  { fontFamily: "'Rajdhani', sans-serif" as const, fontSize: 14, color: "rgba(212,212,220,0.5)", lineHeight: 1.8, fontWeight: 300 as const },
  card:  { background: "rgba(29,30,34,0.8)", border: "1px solid rgba(57,63,77,0.45)", borderRadius: 0 },
};

const avg = (nums: (number | undefined)[]) => {
  const v = nums.filter((n): n is number => n !== undefined && !isNaN(n));
  return v.length ? Math.round(v.reduce((s, n) => s + n, 0) / v.length) : 0;
};

const TT = ({ contentStyle: _, ...p }: any) => (
  <RTooltip contentStyle={{ background: C.darker, border: `1px solid rgba(57,63,77,0.5)`, borderRadius: 0, fontFamily: "'Rajdhani', sans-serif", fontSize: 12 }}
    labelStyle={{ color: C.silver }} itemStyle={{ color: C.silver }} {...p} />
);

const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, letterSpacing: "0.1em", color: "rgba(212,212,220,0.5)" }}>{label}</span>
      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color, fontStyle: "italic" }}>{value}%</span>
    </div>
    <div style={{ height: 2, background: "rgba(57,63,77,0.4)" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ height: "100%", background: color }} />
    </div>
  </div>
);

const MetricCard = ({ icon: Icon, title, sub, value, color, delay = 0 }: any) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
    style={{ ...S.card, padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <div style={{ ...S.label, marginBottom: 4 }}>{sub}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, fontStyle: "italic", color: C.silver }}>{title}</div>
      </div>
      <div style={{ padding: 8, border: `1px solid rgba(57,63,77,0.5)` }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(57,63,77,0.4)" strokeWidth="3" />
          <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray="100" initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 100 - value }} transition={{ duration: 1, delay, ease: "easeOut" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic", color: C.silver }}>{value}%</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ height: 2, background: "rgba(57,63,77,0.3)", marginBottom: 8 }}>
          <motion.div style={{ height: "100%", background: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, delay }} />
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "rgba(212,212,220,0.35)", letterSpacing: "0.1em" }}>
          {value >= 85 ? "Excellent" : value >= 70 ? "Good" : value >= 50 ? "Fair" : "Needs Review"}
        </div>
      </div>
    </div>
  </motion.div>
);

export const Admin = () => {
  const { reports, loading } = useAppContext();
  const [sortField, setSortField] = useState<"date" | "status">("date");
  const [sortAsc, setSortAsc] = useState(false);

  const stats = { total: reports.length, verified: reports.filter(r => r.status === "Verified").length, pending: reports.filter(r => r.status === "Pending").length, rejected: reports.filter(r => r.status === "Rejected").length };
  const resolved = useMemo(() => reports.filter(r => r.status !== "Pending"), [reports]);
  const ai = useMemo(() => ({
    ela: avg(resolved.map(r => r.integrityScore)), clean: avg(resolved.map(r => r.cleanlinessScore)),
    yolo: avg(resolved.map(r => r.yoloScore)), opencv: avg(resolved.map(r => r.opencvScore)),
  }), [resolved]);

  const chartData = [
    { name: "Verified", value: stats.verified, color: "#22c55e" },
    { name: "Pending",  value: stats.pending,  color: C.yellow  },
    { name: "Rejected", value: stats.rejected, color: C.grey    },
  ];
  const radarData = [{ subject: "ELA", value: ai.ela }, { subject: "YOLO", value: ai.yolo }, { subject: "OpenCV", value: ai.opencv }, { subject: "Clean", value: ai.clean }];

  const cityData = useMemo(() => {
    const map: Record<string, any> = {};
    reports.forEach(r => {
      const area = (r.location ?? "Unknown").split(",")[0].trim() || "Unknown";
      if (!map[area]) map[area] = { area, total: 0, verified: 0, pending: 0, rejected: 0 };
      map[area].total++;
      if (r.status === "Verified") map[area].verified++;
      else if (r.status === "Pending") map[area].pending++;
      else map[area].rejected++;
    });
    return Object.values(map).map((d: any) => ({ ...d, rate: d.total > 0 ? Math.round((d.verified / d.total) * 100) : 0 })).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [reports]);

  const sortedReports = useMemo(() => [...reports].sort((a, b) => {
    const cmp = sortField === "date" ? new Date(a.date).getTime() - new Date(b.date).getTime() : a.status.localeCompare(b.status);
    return sortAsc ? cmp : -cmp;
  }), [reports, sortField, sortAsc]);

  const toggleSort = (f: "date" | "status") => { if (sortField === f) setSortAsc(!sortAsc); else { setSortField(f); setSortAsc(false); } };

  const sectionTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ ...S.label, marginBottom: 8 }}>{label}</div>
      {sub && <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: 0 }}>{sub}</h2>}
    </div>
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 48 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 24, borderBottom: "1px solid rgba(57,63,77,0.4)" }}>
        <div>
          <div style={S.label}>System Admin</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: "8px 0 0" }}>
            Operations <span style={{ color: C.yellow }}>Overview</span>
          </h1>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 28px",
          background: "transparent", border: `1px solid rgba(57,63,77,0.6)`, color: C.silver,
          fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600,
          cursor: "pointer", transition: "all 0.3s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.yellow; e.currentTarget.style.color = C.yellow; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(57,63,77,0.6)"; e.currentTarget.style.color = C.silver; }}>
          <FileText size={13} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
          <div style={{ width: 36, height: 36, border: `2px solid rgba(57,63,77,0.3)`, borderTopColor: C.yellow, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <>
          {/* ── Row 1: Stats / Pie / Recent ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

            {/* Stats */}
            <div style={S.card}>
              <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(57,63,77,0.35)" }}>
                <div style={S.label}>Total Reports</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 80, fontWeight: 300, fontStyle: "italic", color: C.yellow, lineHeight: 1, margin: "8px 0" }}>{stats.total}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(57,63,77,0.35)" }}>
                {[{ n: stats.verified, label: "Verified", color: "#22c55e" }, { n: stats.pending, label: "Pending", color: C.yellow }, { n: stats.rejected, label: "Rejected", color: C.grey }].map(({ n, label, color }, i) => (
                  <div key={label} style={{ padding: "20px", borderRight: i < 2 ? "1px solid rgba(57,63,77,0.35)" : "none", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color, fontStyle: "italic" }}>{n}</div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(212,212,220,0.35)", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "20px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: "rgba(212,212,220,0.4)", letterSpacing: "0.1em" }}>Verification Rate</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.silver, fontStyle: "italic" }}>{stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%</span>
                </div>
                <div style={{ height: 2, background: "rgba(57,63,77,0.4)" }}>
                  <div style={{ height: "100%", background: "#22c55e", width: `${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%`, transition: "width 1s ease" }} />
                </div>
              </div>
            </div>

            {/* Pie */}
            <div style={{ ...S.card, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(57,63,77,0.35)" }}>
                <div style={S.label}>Status Breakdown</div>
              </div>
              <div style={{ flex: 1, padding: "16px" }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                      {chartData.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <TT />
                    <Legend verticalAlign="bottom" height={36} iconType="square" formatter={v => <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, color: C.silver, letterSpacing: "0.1em" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent */}
            <div style={{ ...S.card, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(57,63,77,0.35)" }}>
                <div style={S.label}>Recent Uploads</div>
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                {reports.slice(0, 4).map((r, i) => (
                  <motion.div key={r.id} whileHover={{ x: 4 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 24px",
                      borderBottom: i < 3 ? "1px solid rgba(57,63,77,0.3)" : "none", cursor: "pointer",
                    }}>
                    <img src={r.citizenImage} alt="" style={{ width: 44, height: 44, objectFit: "cover", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, fontWeight: 600, color: C.silver, marginBottom: 2 }}>{r.id}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {r.status === "Verified" && <CheckCircle size={11} style={{ color: "#22c55e" }} />}
                        {r.status === "Pending"  && <Clock       size={11} style={{ color: C.yellow }}  />}
                        {r.status === "Rejected" && <XCircle     size={11} style={{ color: C.grey }}    />}
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "rgba(212,212,220,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.location}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: "rgba(212,212,220,0.3)", flexShrink: 0 }}>
                      {new Date(r.date).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── AI Metrics ── */}
          <div>
            {sectionTitle("AI Engine Metrics", "Score Analysis")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
              <MetricCard icon={ScanLine} title="ELA Score"    sub="Error Level Analysis" value={ai.ela}    color="#6366f1" delay={0}   />
              <MetricCard icon={Eye}      title="YOLO Score"   sub="Object Detection"      value={ai.yolo}  color={C.yellow} delay={0.1} />
              <MetricCard icon={Layers}   title="OpenCV Score" sub="Image Processing"      value={ai.opencv} color="#22c55e" delay={0.2} />
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...S.card, padding: 24 }}>
                <div style={{ ...S.label, marginBottom: 4 }}>Overview</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, fontStyle: "italic", color: C.silver, marginBottom: 12 }}>AI Radar</div>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(57,63,77,0.5)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "rgba(212,212,220,0.5)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em" }} />
                      <Radar dataKey="value" stroke={C.yellow} fill={C.yellow} fillOpacity={0.1} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
            <div style={{ ...S.card, padding: "24px 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
              <ScoreBar label="ELA (Error Level Analysis)" value={ai.ela}    color="#6366f1" />
              <ScoreBar label="YOLO (Object Detection)"    value={ai.yolo}   color={C.yellow} />
              <ScoreBar label="OpenCV (Image Processing)"  value={ai.opencv} color="#22c55e" />
              <ScoreBar label="Cleanliness Score"          value={ai.clean}  color="#f97316" />
            </div>
          </div>

          {/* ── City Summary ── */}
          <div>
            {sectionTitle("City Summary", "Area Breakdown")}
            {cityData.length === 0 ? (
              <div style={{ ...S.card, padding: "48px", textAlign: "center", ...S.body }}>No reports yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={S.card}>
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(57,63,77,0.35)" }}>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,212,220,0.4)" }}>Reports by Area</div>
                  </div>
                  <div style={{ padding: "16px", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cityData} margin={{ top: 5, right: 10, left: -24, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(57,63,77,0.3)" />
                        <XAxis dataKey="area" tick={{ fontSize: 10, fill: "rgba(212,212,220,0.4)", fontFamily: "'Rajdhani', sans-serif" }} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 10, fill: "rgba(212,212,220,0.4)" }} />
                        <TT />
                        <Bar dataKey="verified" name="Verified" fill="#22c55e" />
                        <Bar dataKey="pending"  name="Pending"  fill={C.yellow} />
                        <Bar dataKey="rejected" name="Rejected" fill={C.grey}   />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={{ ...S.card, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(57,63,77,0.35)" }}>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,212,220,0.4)" }}>Area Table</div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "'Rajdhani', sans-serif" }}>
                    <thead>
                      <tr style={{ background: "rgba(20,21,26,0.6)" }}>
                        {["Area", "Total", "✓", "⏳", "Rate"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(212,212,220,0.3)", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cityData.map((row, i) => (
                        <tr key={row.area} style={{ borderTop: "1px solid rgba(57,63,77,0.3)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <MapPin size={10} style={{ color: C.yellow, flexShrink: 0 }} />
                              <span style={{ color: C.silver, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120, display: "block" }}>{row.area}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: "italic", color: C.silver }}>{row.total}</td>
                          <td style={{ padding: "12px 16px", color: "#22c55e" }}>{row.verified}</td>
                          <td style={{ padding: "12px 16px", color: C.yellow }}>{row.pending}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 2, background: "rgba(57,63,77,0.4)" }}>
                                <div style={{ height: "100%", background: "#22c55e", width: `${row.rate}%` }} />
                              </div>
                              <span style={{ color: C.silver, fontSize: 12, minWidth: 32 }}>{row.rate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Data Table ── */}
          <div>
            {sectionTitle("Data Management", "All Reports")}
            <div style={{ ...S.card, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Rajdhani', sans-serif", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "rgba(20,21,26,0.7)", borderBottom: "1px solid rgba(57,63,77,0.4)" }}>
                      {[
                        { h: "ID", s: null }, { h: "Location", s: null },
                        { h: `Date ${sortField === "date" ? (sortAsc ? "↑" : "↓") : "↕"}`, s: "date" as const },
                        { h: `Status ${sortField === "status" ? (sortAsc ? "↑" : "↓") : "↕"}`, s: "status" as const },
                        { h: "ELA", s: null }, { h: "YOLO", s: null }, { h: "OpenCV", s: null }, { h: "Clean", s: null }, { h: "", s: null },
                      ].map(({ h, s }) => (
                        <th key={h} onClick={s ? () => toggleSort(s) : undefined}
                          style={{ padding: "14px 16px", textAlign: "left", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(212,212,220,0.35)", fontWeight: 500, cursor: s ? "pointer" : "default", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedReports.map(r => {
                      const ip = r.status === "Pending";
                      const Pill = ({ val, label }: { val: number | undefined; label: string }) =>
                        val !== undefined && !isNaN(val) ? (
                          <span style={{
                            padding: "3px 8px", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.1em",
                            background: val > 80 ? "rgba(34,197,94,0.1)" : "rgba(254,218,106,0.1)",
                            color: val > 80 ? "#22c55e" : C.yellow, border: `1px solid ${val > 80 ? "rgba(34,197,94,0.2)" : "rgba(254,218,106,0.2)"}`,
                          }}>
                            {label}:{val}%
                          </span>
                        ) : <span style={{ color: "rgba(212,212,220,0.2)", fontSize: 16 }}>—</span>;

                      return (
                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ borderBottom: "1px solid rgba(57,63,77,0.25)", transition: "background 0.2s", cursor: "default" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(57,63,77,0.15)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "14px 16px", color: C.silver, fontWeight: 600 }}>{r.id}</td>
                          <td style={{ padding: "14px 16px", maxWidth: 180 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <MapPin size={10} style={{ color: C.yellow, flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(212,212,220,0.5)", fontSize: 12 }} title={r.location}>{r.location}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "rgba(212,212,220,0.45)", whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString()}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{
                              padding: "4px 12px", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
                              background: r.status === "Verified" ? "rgba(34,197,94,0.1)" : r.status === "Pending" ? "rgba(254,218,106,0.1)" : "rgba(57,63,77,0.3)",
                              color: r.status === "Verified" ? "#22c55e" : r.status === "Pending" ? C.yellow : C.grey,
                              border: `1px solid ${r.status === "Verified" ? "rgba(34,197,94,0.2)" : r.status === "Pending" ? "rgba(254,218,106,0.2)" : "rgba(57,63,77,0.4)"}`,
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>{ip ? <span style={{ color: "rgba(212,212,220,0.2)" }}>—</span> : <Pill val={r.integrityScore} label="E" />}</td>
                          <td style={{ padding: "14px 16px" }}>{ip ? <span style={{ color: "rgba(212,212,220,0.2)" }}>—</span> : <Pill val={r.yoloScore}      label="Y" />}</td>
                          <td style={{ padding: "14px 16px" }}>{ip ? <span style={{ color: "rgba(212,212,220,0.2)" }}>—</span> : <Pill val={r.opencvScore}    label="CV"/>}</td>
                          <td style={{ padding: "14px 16px" }}>{ip ? <span style={{ color: "rgba(212,212,220,0.2)" }}>—</span> : <Pill val={r.cleanlinessScore} label="C" />}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(212,212,220,0.3)", padding: 4 }}
                              onMouseEnter={e => (e.currentTarget.style.color = C.yellow)}
                              onMouseLeave={e => (e.currentTarget.style.color = "rgba(212,212,220,0.3)")}>
                              <MoreVertical size={14} />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                    {reports.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: "48px", textAlign: "center", ...S.body }}>No reports yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};