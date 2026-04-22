import { Outlet, Link, useLocation } from "react-router";
import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";

// ── Brand colors ──────────────────────────────────────────────────────────────
// Blue Popsicle : #0f2862
// Redline       : #9e363a
// Purple Shadow : #091f36
// Grey Blue Leaf: #4f5f76

export const Layout = () => {
  const location = useLocation();
  const isIntro = location.pathname === "/";
  const isHome  = location.pathname === "/home";

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden"
      style={{ background: "#091f36" }}>

      {/* Background texture for inner pages */}
      {(!isIntro && !isHome) && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* subtle grid pattern */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(79,95,118,0.18) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
          {/* top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[320px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, #0f2862 0%, transparent 70%)" }}
          />
          {/* bottom-right accent */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #9e363a 0%, transparent 70%)" }}
          />
        </div>
      )}

      {/* Navigation Header */}
      {!isIntro && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b"
          style={{
            background: "rgba(9,31,54,0.92)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(79,95,118,0.35)",
          }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

              {/* Logo */}
              <Link to="/home" className="flex items-center gap-2.5 group">
                <div className="p-2 rounded-lg transition-all"
                  style={{ background: "#9e363a" }}>
                  <Shield size={18} className="text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Daksha<span style={{ color: "#9e363a" }}>AI</span>
                </span>
              </Link>

              {/* Nav links */}
              <nav className="hidden md:flex gap-1">
                {[
                  { to: "/citizen", label: "Citizen Portal" },
                  { to: "/worker",  label: "Worker App"     },
                  { to: "/admin",   label: "Admin Dashboard"},
                  { to: "/summary", label: "City Summary"   },
                ].map(({ to, label }) => {
                  const active = location.pathname === to;
                  return (
                    <Link key={to} to={to}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: active ? "#0f2862" : "transparent",
                        color: active ? "#fff" : "#a0aec0",
                        borderBottom: active ? "2px solid #9e363a" : "2px solid transparent",
                      }}>
                      {label}
                    </Link>
                  );
                })}
              </nav>

              {/* Status pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                style={{ background: "rgba(15,40,98,0.6)", borderColor: "rgba(79,95,118,0.4)" }}>
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: "#9e363a" }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                    style={{ background: "#9e363a" }} />
                </div>
                <span className="text-xs font-semibold tracking-wide" style={{ color: "#a0aec0" }}>
                  Server Active
                </span>
              </div>

            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={clsx("min-h-screen flex flex-col relative z-10", !isIntro && "pt-16")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              "flex-grow flex flex-col w-full",
              (!isIntro && !isHome) && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            )}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};