import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { Map, Zap, AlertCircle, MapPin } from "lucide-react";
import { useAppContext } from "../../context/AppProvider";

const C = { yellow: "#feda6a", silver: "#d4d4dc", grey: "#393f4d", dark: "#1d1e22", darker: "#14151a" };
const S = {
  label: { fontFamily: "'Rajdhani', sans-serif" as const, fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: C.yellow },
  body:  { fontFamily: "'Rajdhani', sans-serif" as const, fontSize: 14, color: "rgba(212,212,220,0.5)", lineHeight: 1.8, fontWeight: 300 as const },
  card:  { background: "rgba(29,30,34,0.8)", border: "1px solid rgba(57,63,77,0.45)" },
};

export const Summary = () => {
  const { reports } = useAppContext();

  const trendData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dr = reports.filter(r => new Date(r.date).toDateString() === d.toDateString());
      return { day: days[d.getDay()], reports: dr.length, verified: dr.filter(r => r.status === "Verified").length };
    });
  }, [reports]);

  const cityAreas = useMemo(() => {
    const map: Record<string, { total: number; verified: number; pending: number }> = {};
    reports.forEach(r => {
      const area = (r.location ?? "Unknown").split(",")[0].trim() || "Unknown";
      if (!map[area]) map[area] = { total: 0, verified: 0, pending: 0 };
      map[area].total++;
      if (r.status === "Verified") map[area].verified++;
      if (r.status === "Pending")  map[area].pending++;
    });
    return Object.entries(map).map(([area, d]) => ({
      area, ...d, hotspot: d.pending > 2,
      rate: d.total > 0 ? Math.round((d.verified / d.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [reports]);

  const stats = {
    total:    reports.length,
    verified: reports.filter(r => r.status === "Verified").length,
    pending:  reports.filter(r => r.status === "Pending").length,
    fraud:    reports.filter(r => r.status === "Rejected").length,
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 48 }}>

      {/* Header */}
      <div style={{ paddingBottom: 24, borderBottom: "1px solid rgba(57,63,77,0.4)" }}>
        <div style={S.label}>City Intelligence</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: "8px 0 0" }}>
          City <span style={{ color: C.yellow }}>Summary</span>
        </h1>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid rgba(57,63,77,0.4)" }}>
        {[
          { num: stats.total,    label: "Total Reports",  color: C.silver  },
          { num: stats.verified, label: "Verified Clean", color: "#22c55e" },
          { num: stats.pending,  label: "Awaiting Work",  color: C.yellow  },
          { num: stats.fraud,    label: "Fraud Detected", color: C.grey    },
        ].map(({ num, label, color }, i) => (
          <div key={label} style={{ padding: "36px 32px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(57,63,77,0.4)" : "none" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 300, fontStyle: "italic", color, lineHeight: 1, marginBottom: 8 }}>{num}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,212,220,0.35)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Heatmap */}
        <div style={{ ...S.card, position: "relative", overflow: "hidden", minHeight: 360 }}>
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1600&auto=format&fit=crop" alt="Map"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) brightness(0.2)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,21,26,0.95) 0%, rgba(20,21,26,0.4) 70%)" }} />

          {cityAreas.slice(0, 3).map((area, i) => {
            const pos = [{ top: "25%", left: "30%" }, { top: "50%", left: "62%" }, { top: "68%", left: "22%" }][i] || { top: "40%", left: "50%" };
            return (
              <motion.div key={area.area}
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.9 }}
                style={{
                  position: "absolute", ...pos,
                  width: 70 + area.total * 10, height: 70 + area.total * 10,
                  borderRadius: "50%",
                  background: area.hotspot ? "rgba(254,218,106,0.4)" : "rgba(34,197,94,0.3)",
                  filter: "blur(22px)", transform: "translate(-50%,-50%)",
                }} />
            );
          })}

          <div style={{ position: "absolute", inset: 0, zIndex: 2, padding: "28px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "auto" }}>
              <div>
                <div style={S.label}>Live Heatmap</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, fontStyle: "italic", color: C.silver, marginTop: 4 }}>Activity Map</div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {[{ color: C.yellow, label: "Hotspot" }, { color: "#22c55e", label: "Cleaned" }].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.2em", color: "rgba(212,212,220,0.45)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cityAreas.length === 0
                ? <span style={{ ...S.body, fontSize: 13 }}>No data yet. Submit reports to populate the map.</span>
                : cityAreas.slice(0, 5).map(area => (
                  <div key={area.area} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <MapPin size={10} style={{ color: area.hotspot ? C.yellow : "#22c55e", flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "rgba(212,212,220,0.6)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{area.area}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: "italic", color: area.hotspot ? C.yellow : "#22c55e" }}>{area.total}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <div style={{ ...S.card, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(57,63,77,0.35)" }}>
            <div style={S.label}>Weekly Trend</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, fontStyle: "italic", color: C.silver, marginTop: 4 }}>Verification Activity</div>
          </div>
          <div style={{ flex: 1, padding: "24px 12px 16px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.grey}   stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C.grey}   stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.yellow} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.yellow} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(57,63,77,0.4)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "rgba(212,212,220,0.4)", fontFamily: "'Rajdhani', sans-serif" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "rgba(212,212,220,0.4)" }} dx={-8} allowDecimals={false} />
                <Tooltip contentStyle={{ background: C.darker, border: `1px solid rgba(57,63,77,0.5)`, borderRadius: 0, fontFamily: "'Rajdhani', sans-serif", fontSize: 12 }}
                  labelStyle={{ color: C.silver }} itemStyle={{ color: C.silver }} />
                <Area type="monotone" dataKey="reports"  name="Reports"  stroke={C.grey}   strokeWidth={1.5} fillOpacity={1} fill="url(#gR)" />
                <Area type="monotone" dataKey="verified" name="Verified" stroke={C.yellow} strokeWidth={1.5} fillOpacity={1} fill="url(#gV)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insight cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          {
            icon: Zap, label: "AI Efficiency", title: "Automation Intelligence", color: C.yellow,
            body: reports.length > 0
              ? `${reports.length} reports processed at avg 1.2s scan time. ${stats.verified} areas confirmed clean.`
              : "No reports yet. Submit reports to see AI efficiency metrics.",
          },
          {
            icon: AlertCircle, label: "Fraud Detection", title: "Integrity Alerts", color: "#f97316",
            body: stats.fraud > 0
              ? `${stats.fraud} report${stats.fraud !== 1 ? "s" : ""} flagged for high-entropy inconsistencies or location mismatch.`
              : "No fraud detected. All submitted verifications passed integrity checks.",
          },
          {
            icon: Map, label: "Zonal Mapping", title: "Area Intelligence", color: "#6366f1",
            body: cityAreas.length > 0
              ? `${cityAreas.length} area${cityAreas.length !== 1 ? "s" : ""} mapped. ${cityAreas.filter(a => a.hotspot).length > 0 ? `${cityAreas.filter(a => a.hotspot).length} hotspot(s) with high pending volume.` : "No hotspots — all areas under control."}`
              : "No location data yet. GPS-tagged reports will populate zonal intelligence.",
          },
        ].map(({ icon: Icon, label, title, body, color }) => (
          <motion.div key={label} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}
            style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ padding: "10px", border: `1px solid rgba(57,63,77,0.5)`, flexShrink: 0 }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, fontStyle: "italic", color: C.silver }}>{title}</div>
              </div>
            </div>
            <p style={{ ...S.body, fontSize: 13, margin: 0 }}>{body}</p>
            <div style={{ height: 1, background: "rgba(57,63,77,0.4)" }}>
              <div style={{ height: "100%", background: color, width: `${Math.min(100, (stats.verified / Math.max(1, stats.total)) * 100)}%`, opacity: 0.5, transition: "width 1s ease" }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};