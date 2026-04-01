import { Outlet, Link, useLocation } from "react-router";
import { Leaf } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";

const GLOBAL_BACKGROUND = "https://images.unsplash.com/photo-1655999689114-f425b45a8efe?q=80&w=2500&auto=format&fit=crop";

export const Layout = () => {
  const location = useLocation();

  const isIntro = location.pathname === "/";
  const isHome = location.pathname === "/home";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans relative overflow-x-hidden">
      
      {/* Global Persistant Background for all inner pages */}
      {(!isIntro && !isHome) && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img 
            src={GLOBAL_BACKGROUND} 
            alt="Global Theme Background" 
            className="w-full h-full object-cover opacity-15 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-3xl" />
        </div>
      )}

      {/* Navigation Header - Hide on Intro */}
      {!isIntro && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/home" className="flex items-center gap-2 group">
                <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-sm group-hover:bg-emerald-700 transition-colors">
                  <Leaf size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-800">
                  Daksha AI
                </span>
              </Link>

              <nav className="hidden md:flex gap-8">
                <Link to="/citizen" className={clsx("text-sm font-medium transition-colors hover:text-emerald-600", location.pathname === "/citizen" ? "text-emerald-600" : "text-slate-600")}>Citizen Portal</Link>
                <Link to="/worker" className={clsx("text-sm font-medium transition-colors hover:text-emerald-600", location.pathname === "/worker" ? "text-emerald-600" : "text-slate-600")}>Worker App</Link>
                <Link to="/admin" className={clsx("text-sm font-medium transition-colors hover:text-emerald-600", location.pathname === "/admin" ? "text-emerald-600" : "text-slate-600")}>Admin Dashboard</Link>
                <Link to="/summary" className={clsx("text-sm font-medium transition-colors hover:text-emerald-600", location.pathname === "/summary" ? "text-emerald-600" : "text-slate-600")}>City Summary</Link>
              </nav>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-full border border-slate-200/50">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-xs font-semibold text-slate-600 tracking-wide">Server Active</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Container */}
      <main className={clsx("min-h-screen flex flex-col relative z-10", !isIntro && "pt-16")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              "flex-grow flex flex-col w-full text-slate-900",
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