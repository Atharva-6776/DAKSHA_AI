import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronRight } from "lucide-react";

const slides = [
  {
    counter: "01", label: "CIVIC INTELLIGENCE",
    title: "Daksha", accent: "AI",
    body: "The future of verifiable civic cleanliness. Every corner of our city — not just claimed to be clean, but proven.",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2200&auto=format&fit=crop",
  },
  {
    counter: "02", label: "VISION TECHNOLOGY",
    title: "3-Layer", accent: "Integrity",
    body: "SIFT/ORB geographic locking. YOLO object detection. Error Level Analysis. No manipulation goes undetected.",
    image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=2200&auto=format&fit=crop",
  },
  {
    counter: "03", label: "CITIZEN POWER",
    title: "Zero", accent: "Fraud",
    body: "From citizen snapshot to worker attestation — transparent, immutable, and fully accountable at every step.",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2200&auto=format&fit=crop",
  },
];

export const Intro = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setCurrent(p => p < slides.length - 1 ? p + 1 : p), 6000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#14151a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
      `}</style>

      {/* BG */}
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }} style={{ position: "absolute", inset: 0 }}>
          <img src={slide.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(20,21,26,0.95) 38%, rgba(20,21,26,0.25) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,21,26,1) 0%, transparent 55%)" }} />
        </motion.div>
      </AnimatePresence>

      {/* Noise */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, pointerEvents: "none", zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "160px" }} />

      {/* Skip */}
      <button onClick={() => navigate("/home")}
        style={{ position: "absolute", top: 36, right: 48, zIndex: 10, background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,212,220,0.35)", transition: "color 0.3s" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#d4d4dc")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(212,212,220,0.35)")}>
        Skip Intro
      </button>

      {/* Vertical rule right */}
      <div style={{ position: "absolute", right: 48, top: "15%", bottom: "15%", width: 1,
        background: "linear-gradient(to bottom, transparent, rgba(254,218,106,0.15), transparent)", zIndex: 5 }} />

      {/* Content */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: "0 80px 80px", maxWidth: 780 }}>
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ position: "relative" }}>

            {/* Ghost number */}
            <div style={{ position: "absolute", top: "-80px", left: "-10px",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(130px, 20vw, 240px)",
              fontWeight: 600, color: "transparent", WebkitTextStroke: "1px rgba(212,212,220,0.04)",
              lineHeight: 1, userSelect: "none", whiteSpace: "nowrap" }}>
              {slide.title}
            </div>

            {/* Counter */}
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.4em",
              color: "#feda6a", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 1, background: "#feda6a" }} />
              {slide.counter}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(64px, 10vw, 120px)",
              fontWeight: 300, fontStyle: "italic", color: "#d4d4dc", lineHeight: 0.92, margin: "0 0 0" }}>
              {slide.title}
              <span style={{ color: "#feda6a" }}> {slide.accent}</span>
            </h1>

            {/* Label */}
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.4em",
              textTransform: "uppercase", color: "rgba(212,212,220,0.35)", margin: "18px 0 22px" }}>
              — {slide.label}
            </div>

            {/* Body */}
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16, color: "rgba(212,212,220,0.6)",
              lineHeight: 1.85, fontWeight: 300, maxWidth: 500, marginBottom: 52, letterSpacing: "0.02em" }}>
              {slide.body}
            </p>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
              <div style={{ display: "flex", gap: 10 }}>
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    style={{ border: "none", cursor: "pointer", borderRadius: 0, height: 2,
                      width: i === current ? 44 : 14, transition: "all 0.5s",
                      background: i === current ? "#feda6a" : "rgba(212,212,220,0.2)" }} />
                ))}
              </div>
              <button onClick={() => isLast ? navigate("/home") : setCurrent(current + 1)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 32px",
                  background: isLast ? "#feda6a" : "transparent",
                  color: isLast ? "#1d1e22" : "#d4d4dc",
                  border: `1px solid ${isLast ? "#feda6a" : "rgba(212,212,220,0.25)"}`,
                  fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em",
                  textTransform: "uppercase", fontWeight: 600, cursor: "pointer", transition: "all 0.35s" }}
                onMouseEnter={e => { if (!isLast) { e.currentTarget.style.borderColor = "#feda6a"; e.currentTarget.style.color = "#feda6a"; } }}
                onMouseLeave={e => { if (!isLast) { e.currentTarget.style.borderColor = "rgba(212,212,220,0.25)"; e.currentTarget.style.color = "#d4d4dc"; } }}>
                {isLast ? <><span>Enter Platform</span><ArrowRight size={14} /></> : <><span>Next</span><ChevronRight size={14} /></>}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};