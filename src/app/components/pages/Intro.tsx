import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Shield, Leaf, Target, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

const slides = [
  {
    id: "intro",
    title: "Welcome to Daksha AI",
    subtitle: "The future of verifiable civic cleanliness.",
    description: "Daksha AI bridges the gap between citizen reporting and on-ground action. We ensure every corner of our city is not just claimed to be clean, but cryptographically proven to be spotless.",
    image: "https://images.unsplash.com/photo-1709637510936-5355f3beabba?q=80&w=2000&auto=format&fit=crop",
    icon: <Leaf className="text-emerald-400" size={32} />
  },
  {
    id: "technology",
    title: "Powered by Vision",
    subtitle: "3-Layer Integrity Verification",
    description: "We employ advanced SIFT/ORB mapping to lock geographic locations, cross-reference pixel entropy for dirt segmentation, and use Error Level Analysis (ELA) to guarantee no photo has been manipulated.",
    image: "https://images.unsplash.com/photo-1708924908152-aa8df3576b86?q=80&w=2000&auto=format&fit=crop",
    icon: <Target className="text-blue-400" size={32} />
  },
  {
    id: "mission",
    title: "Empowering Citizens",
    subtitle: "Transparency at every step.",
    description: "From the moment you snap an uncleaned area, to the live-camera attestation of the worker resolving it, Daksha AI keeps the data transparent, immutable, and accessible.",
    image: "https://images.unsplash.com/photo-1630414799274-63992d84a5ce?q=80&w=2000&auto=format&fit=crop",
    icon: <Shield className="text-amber-400" size={32} />
  }
];

export const Intro = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 6000); // Auto advance every 6s

    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/home");
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 -mt-16 flex flex-col justify-center">
      {/* Background Images with Crossfade */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentSlide}
            src={slides[currentSlide].image}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Slide Background"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col h-full justify-end pb-24">
        
        {/* Navigation / Skip */}
        <div className="absolute top-24 right-6 md:right-12">
           <button 
             onClick={handleSkip}
             className="text-white/60 hover:text-white text-sm font-medium tracking-wide uppercase transition-colors"
           >
             Skip Intro
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
          {/* Text Content */}
          <div className="min-h-[250px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="mb-6 inline-flex p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  {slides[currentSlide].icon}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                  {slides[currentSlide].title}
                </h1>
                <h2 className="text-xl md:text-2xl text-emerald-400 font-medium mb-6">
                  {slides[currentSlide].subtitle}
                </h2>
                <p className="text-slate-300 text-lg leading-relaxed max-w-lg">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-start md:items-end justify-end space-y-8">
            {/* Indicators */}
            <div className="flex gap-3">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-500",
                    currentSlide === idx ? "w-12 bg-emerald-500" : "w-4 bg-white/30 hover:bg-white/50"
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next/Enter Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold shadow-lg shadow-emerald-900/50 transition-colors"
            >
              {currentSlide === slides.length - 1 ? (
                <>Enter Platform <ArrowRight size={20} /></>
              ) : (
                <>Next <ChevronRight size={20} /></>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};