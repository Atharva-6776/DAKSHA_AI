import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Camera, Image as ImageIcon, Map, Shield, Activity, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const backgrounds = [
  "https://images.unsplash.com/photo-1655999689114-f425b45a8efe?q=80&w=2000&auto=format&fit=crop", // Diversity
  "https://images.unsplash.com/photo-1648662594772-786f95b9e58b?q=80&w=2000&auto=format&fit=crop", // Sweeper/worker
  "https://images.unsplash.com/photo-1591202481328-2f4b7835df02?q=80&w=2000&auto=format&fit=crop"  // Citizen taking pic
];

export const Home = () => {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex-grow flex flex-col items-center justify-center -mt-16 overflow-hidden min-h-screen">
      {/* Auto-scroll Backgrounds */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-overlay">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentBg}
            src={backgrounds[currentBg]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Background"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-medium mb-6">
            <Shield size={16} />
            AI-Powered Civic Verification
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Building cleaner cities <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              with absolute integrity.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-12">
            Daksha AI uses advanced computer vision to verify civic cleaning efforts in real-time. Eliminating fraud, empowering workers, and keeping our communities clean.
          </p>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link to="/citizen" className="group">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl flex flex-col items-center text-center transition-all hover:bg-white/20 hover:border-emerald-400/50"
            >
              <div className="bg-emerald-500 p-4 rounded-full text-white mb-6 group-hover:scale-110 transition-transform">
                <Camera size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Report Issue</h3>
              <p className="text-slate-300 text-sm">Citizen portal to capture and report uncleaned areas instantly.</p>
            </motion.div>
          </Link>

          <Link to="/worker" className="group">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl flex flex-col items-center text-center transition-all hover:bg-white/20 hover:border-emerald-400/50"
            >
              <div className="bg-blue-500 p-4 rounded-full text-white mb-6 group-hover:scale-110 transition-transform">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Worker App</h3>
              <p className="text-slate-300 text-sm">Live camera attestation and dual-capture flow for workers.</p>
            </motion.div>
          </Link>

          <Link to="/admin" className="group">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl flex flex-col items-center text-center transition-all hover:bg-white/20 hover:border-emerald-400/50"
            >
              <div className="bg-purple-500 p-4 rounded-full text-white mb-6 group-hover:scale-110 transition-transform">
                <Activity size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Admin Dashboard</h3>
              <p className="text-slate-300 text-sm">Monitor operations, view integrity scores, and manage data.</p>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
};