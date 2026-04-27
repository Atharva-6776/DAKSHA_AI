import { Outlet, Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";

export const Layout = () => {
  const location = useLocation();
  const isIntro = location.pathname === "/";
  const isHome  = location.pathname === "/home";

  const navLinks = [
    { to: "/citizen", label: "Citizen Portal" },
    { to: "/worker",  label: "Worker App"     },
    { to: "/admin",   label: "Admin"          },
    { to: "/summary", label: "City Summary"   },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden"
      style={{ background: "#1d1e22", color: "#d4d4dc", fontFamily: "'Rajdhani', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        body{margin:0;background:#1d1e22}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:#1d1e22}
        ::-webkit-scrollbar-thumb{background:#393f4d;border-radius:2px}
        a{text-decoration:none}
      `}</style>

      {/* Noise grain */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "160px",
        }} />

      {/* Top glow */}
      {!isIntro && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[200px] pointer-events-none z-0"
          style={{ background: "radial-gradient(ellipse, rgba(254,218,106,0.06) 0%, transparent 70%)" }} />
      )}

      {/* NAV */}
      {!isIntro && (
        <header className="fixed top-0 left-0 right-0 z-50"
          style={{
            background: "rgba(20,21,26,0.9)",
            backdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(57,63,77,0.45)",
          }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 40px" }}
            className="flex items-center justify-between h-16">

            <Link to="/home" className="flex items-center gap-3">
              <div style={{ width: 32, height: 32, background: "#feda6a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 16, color: "#1d1e22", fontStyle: "italic" }}>D</span>
              </div>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, letterSpacing: "0.1em", color: "#d4d4dc" }}>
                DAKSHA<span style={{ color: "#feda6a" }}>AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center">
              {navLinks.map(({ to, label }) => {
                const active = location.pathname === to;
                return (
                  <Link key={to} to={to}
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: 11,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      color: active ? "#feda6a" : "rgba(212,212,220,0.55)",
                      padding: "4px 20px",
                      borderBottom: active ? "1px solid #feda6a" : "1px solid transparent",
                      transition: "all 0.3s",
                    }}>
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 px-3 py-1.5"
              style={{ border: "1px solid rgba(57,63,77,0.5)", background: "rgba(14,15,18,0.6)" }}>
              <div style={{ position: "relative", width: 7, height: 7 }}>
                <span className="animate-ping" style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "#feda6a", opacity: 0.6, display: "block",
                }} />
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#feda6a", display: "block" }} />
              </div>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,212,220,0.4)" }}>
                System Live
              </span>
            </div>
          </div>
        </header>
      )}

      <main className={clsx("min-h-screen flex flex-col relative z-10", !isIntro && "pt-16")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className={clsx(
              "flex-grow flex flex-col w-full",
              (!isIntro && !isHome) && "py-10"
            )}
            style={(!isIntro && !isHome) ? { maxWidth: "1400px", margin: "0 auto", padding: "40px 40px" } : {}}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};