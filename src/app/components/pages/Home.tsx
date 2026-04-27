import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Camera, Users, Activity, ArrowRight, Shield, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const C = { yellow: "#feda6a", silver: "#d4d4dc", grey: "#393f4d", dark: "#1d1e22", darker: "#14151a" };

const bgSlides = [
  { img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2200&auto=format&fit=crop", label: "URBAN SURVEILLANCE" },
  { img: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=2200&auto=format&fit=crop", label: "AI VERIFICATION"    },
  { img: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2200&auto=format&fit=crop", label: "CIVIC ACTION"       },
];

const cards = [
  { to: "/citizen", counter: "01", title: "Report",  accent: "Issue",      body: "Snap a photo of uncleaned areas. GPS-tagged and submitted instantly to the AI verification queue.", img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop", tab: "CITIZEN PORTAL" },
  { to: "/worker",  counter: "02", title: "Resolve", accent: "Task",       body: "Live camera attestation with ghost overlay matching. Anti-fraud protection built in at every step.",  img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop", tab: "WORKER APP"     },
  { to: "/admin",   counter: "03", title: "Monitor", accent: "Operations", body: "Real-time ELA scores, YOLO detection results, city-wide heatmaps and full integrity analytics.",     img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop", tab: "ADMIN DASHBOARD" },
];

export const Home = () => {
  const [bg, setBg] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBg(p => (p + 1) % bgSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: "100%", background: C.dark }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box} body{margin:0}
        .card-link:hover .card-img-el  { transform: scale(1.07) !important; }
        .card-link:hover .card-hover   { opacity: 1 !important; }
        .card-link:hover .card-content { transform: translateY(-10px) !important; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div key={bg} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }} style={{ position: "absolute", inset: 0 }}>
            <img src={bgSlides[bg].img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(20,21,26,0.93) 35%, rgba(20,21,26,0.35) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1d1e22 0%, transparent 60%)" }} />
          </motion.div>
        </AnimatePresence>

        {/* Noise */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none", zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px" }} />

        {/* Content */}
        <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={bg} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: C.yellow, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 1, background: C.yellow }} />
              {bgSlides[bg].label}
            </motion.div>
          </AnimatePresence>

          {/* Ghost number */}
          <div style={{ position: "absolute", left: 60, top: "50%", transform: "translateY(-60%)",
            fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(180px, 26vw, 360px)",
            fontWeight: 600, color: "transparent", WebkitTextStroke: "1px rgba(212,212,220,0.04)",
            lineHeight: 1, userSelect: "none" }}>
            {String(bg + 1).padStart(2, "0")}
          </div>

          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(52px, 9vw, 108px)", fontWeight: 300, fontStyle: "italic",
              color: C.silver, lineHeight: 0.93, margin: "0 0 28px", maxWidth: 680, position: "relative", zIndex: 2 }}>
            Building<br /><span style={{ color: C.yellow }}>Cleaner</span> Cities
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16, color: "rgba(212,212,220,0.5)", lineHeight: 1.9,
              fontWeight: 300, maxWidth: 460, marginBottom: 48, letterSpacing: "0.025em", position: "relative", zIndex: 2 }}>
            Advanced AI verification for civic cleaning efforts. Eliminating fraud, empowering workers, keeping communities accountable.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            style={{ display: "flex", gap: 14, position: "relative", zIndex: 2 }}>
            <Link to="/citizen"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 34px", background: C.yellow, color: C.dark,
                fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700, transition: "background 0.3s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#ffe999")}
              onMouseLeave={e => (e.currentTarget.style.background = C.yellow)}>
              Report Issue <ArrowRight size={13} />
            </Link>
            <Link to="/summary"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 34px", background: "transparent", color: C.silver,
                fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600,
                border: "1px solid rgba(212,212,220,0.22)", transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.yellow; e.currentTarget.style.color = C.yellow; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(212,212,220,0.22)"; e.currentTarget.style.color = C.silver; }}>
              City Summary <MapPin size={13} />
            </Link>
          </motion.div>
        </div>

        {/* Slide dots */}
        <div style={{ position: "absolute", bottom: 44, left: 80, zIndex: 6, display: "flex", gap: 10 }}>
          {bgSlides.map((_, i) => (
            <button key={i} onClick={() => setBg(i)}
              style={{ border: "none", cursor: "pointer", height: 2, borderRadius: 0,
                width: i === bg ? 40 : 14, background: i === bg ? C.yellow : "rgba(212,212,220,0.2)", transition: "all 0.5s" }} />
          ))}
        </div>

        {/* AI badge */}
        <div style={{ position: "absolute", bottom: 44, right: 80, zIndex: 6, display: "flex", alignItems: "center", gap: 10,
          padding: "10px 18px", border: "1px solid rgba(254,218,106,0.18)", background: "rgba(20,21,26,0.75)", backdropFilter: "blur(10px)" }}>
          <Shield size={13} style={{ color: C.yellow }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,212,220,0.4)" }}>
            AI-Powered Civic Verification
          </span>
        </div>
      </div>

      {/* ── TAB BAR ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", borderTop: "1px solid rgba(57,63,77,0.5)", borderBottom: "1px solid rgba(57,63,77,0.5)" }}>
        {cards.map((c, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{
              flex: 1, padding: "22px 0", textAlign: "center",
              fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600,
              cursor: "pointer", border: "none", transition: "all 0.35s",
              background: activeTab === i ? C.yellow : C.grey,
              color: activeTab === i ? C.dark : C.silver,
              borderRight: i < cards.length - 1 ? "1px solid rgba(57,63,77,0.5)" : "none",
            }}>
            {c.tab}
          </button>
        ))}
      </div>

      {/* ── CARDS GRID ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(57,63,77,0.3)" }}>
        {cards.map((card, i) => (
          <Link key={card.to} to={card.to} className="card-link"
            style={{ display: "block", position: "relative", overflow: "hidden", aspectRatio: "4/5" }}>
            <img className="card-img-el" src={card.img} alt={card.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,21,26,0.97) 0%, rgba(20,21,26,0.2) 65%)" }} />
            <div className="card-hover" style={{ position: "absolute", inset: 0, background: "rgba(254,218,106,0.05)", opacity: 0, transition: "opacity 0.4s" }} />
            <div className="card-content" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "36px 32px", transition: "transform 0.55s cubic-bezier(0.16,1,0.3,1)" }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.35em", color: C.yellow, marginBottom: 14 }}>{card.counter}</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, fontStyle: "italic", color: C.silver, lineHeight: 0.95, margin: "0 0 4px" }}>{card.title}</h2>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600, color: C.yellow, marginBottom: 18 }}>{card.accent}</div>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "rgba(212,212,220,0.5)", lineHeight: 1.8, fontWeight: 300, marginBottom: 20 }}>{card.body}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,212,220,0.35)" }}>
                <div style={{ width: 20, height: 1, background: "rgba(212,212,220,0.25)" }} /> Enter <ArrowRight size={11} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── STATS STRIP ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid rgba(57,63,77,0.4)" }}>
        {[
          { num: "3-Layer", label: "AI Verification" },
          { num: "< 1.2s",  label: "Avg Scan Time"   },
          { num: "Zero",    label: "Manual Fraud"     },
          { num: "100%",    label: "GPS Verified"     },
        ].map(({ num, label }, i) => (
          <div key={i} style={{ padding: "48px 36px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(57,63,77,0.4)" : "none" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, fontStyle: "italic", color: C.yellow, lineHeight: 1, marginBottom: 8 }}>{num}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,212,220,0.35)" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};