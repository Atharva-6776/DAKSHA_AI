import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { ShieldCheck, Crosshair, ArrowLeft, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../../context/AppProvider";
import { useNavigate } from "react-router";

type ScanState = "idle" | "matching" | "segmenting" | "forensic" | "result";

export const Worker = () => {
  const { reports, updateReport } = useAppContext();
  const navigate = useNavigate();
  const pendingReports = reports.filter(r => r.status === "Pending");
  
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "camera" | "analysis">("select");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<{ passed: boolean; ela: number; clean: number } | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const report = pendingReports.find(r => r.id === selectedReport);

  const startAnalysis = () => {
    setMode("analysis");
    setScanState("matching");
    
    // Simulate 3-layer analysis workflow
    setTimeout(() => {
      setScanState("segmenting"); // AI segments garbage zone
      setTimeout(() => {
        setScanState("forensic"); // Error Level Analysis
        setTimeout(async () => {
          // Final Result
          const passed = Math.random() > 0.2; // 80% pass rate simulation
          const result = {
            passed,
            ela: passed ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 40) + 40,
            clean: passed ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 30) + 50,
          };
          setScanResult(result);
          setScanState("result");
          
          if (report) {
            await updateReport(report.id, {
              status: passed ? "Verified" : "Rejected",
              integrityScore: result.ela,
              cleanlinessScore: result.clean
            }, capturedImg || "");
          }
        }, 2000);
      }, 2000);
    }, 2000);
  };

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImg(imageSrc);
      startAnalysis();
    }
  }, [webcamRef]);

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">
        {mode === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 flex justify-between items-center shadow-xl">
              <div>
                <h1 className="text-2xl font-bold mb-1">Worker Task Force</h1>
                <p className="text-slate-400 text-sm">Live Camera Attestation Required</p>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <ShieldCheck className="text-emerald-400" size={32} />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-slate-800">Pending Tasks</h2>
            {pendingReports.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-800">All caught up!</h3>
                <p className="text-slate-500">No pending reports in your sector.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingReports.map(r => (
                  <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <img src={r.citizenImage} alt="Before" className="w-20 h-20 rounded-xl object-cover" />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-slate-900">{r.id}</h3>
                        <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-md">Pending</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{r.location}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedReport(r.id); setMode("camera"); }}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {mode === "camera" && report && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
             <div className="w-full flex justify-between items-center mb-6">
              <button onClick={() => setMode("select")} className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                <ArrowLeft size={20} /> Back
              </button>
              <h2 className="text-xl font-bold flex items-center gap-2"><Crosshair size={20}/> Align Shot</h2>
              <div className="w-20" />
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-xl text-sm text-amber-800">
              <strong>Anti-Fraud Protection:</strong> Gallery upload disabled. Match the "Ghost Overlay" exactly to ensure location verification.
            </div>

            <div className="relative w-full aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Ghost Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-cover bg-center"
                style={{ backgroundImage: `url(${report.citizenImage})` }}
              />

              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Camera Only
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={handleCapture}
                  className="w-16 h-16 bg-white rounded-full border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}

        {mode === "analysis" && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center py-12"
          >
            {scanState !== "result" ? (
              <div className="text-center w-full max-w-md">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8 shadow-2xl">
                  <img src={capturedImg!} alt="Captured" className="w-full h-full object-cover brightness-50" />
                  
                  {/* Scanning Effect */}
                  <motion.div 
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)] z-10"
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center text-white/90 font-mono text-sm">
                    {scanState === "matching" && "SIFT/ORB Location Matching..."}
                    {scanState === "segmenting" && "Segmenting Garbage Zone..."}
                    {scanState === "forensic" && "Running Error Level Analysis (ELA)..."}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>1. Location Match</span>
                    {scanState !== "matching" ? <CheckCircle className="text-emerald-500" size={16} /> : <Activity className="text-blue-500 animate-spin" size={16} />}
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>2. Cleanliness Threshold</span>
                    {(scanState === "forensic" || scanState === "result") ? <CheckCircle className="text-emerald-500" size={16} /> : (scanState === "segmenting" ? <Activity className="text-blue-500 animate-spin" size={16} /> : <span className="text-slate-300">-</span>)}
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>3. Forensic Scan (ELA)</span>
                    {scanState === "result" ? <CheckCircle className="text-emerald-500" size={16} /> : (scanState === "forensic" ? <Activity className="text-blue-500 animate-spin" size={16} /> : <span className="text-slate-300">-</span>)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md text-center">
                {scanResult?.passed ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-3xl shadow-lg">
                    <CheckCircle className="mx-auto text-emerald-500 mb-4" size={56} />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Passed</h2>
                    <p className="text-slate-600 mb-6">The location matches and the area is clean.</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-xl border border-emerald-100">
                        <div className="text-2xl font-bold text-emerald-600">{scanResult.ela}%</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Integrity Score</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-emerald-100">
                        <div className="text-2xl font-bold text-emerald-600">{scanResult.clean}%</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cleanliness</div>
                      </div>
                    </div>
                    
                    <button onClick={() => { setMode("select"); setSelectedReport(null); }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium">Continue</button>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-8 rounded-3xl shadow-lg">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={56} />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Incomplete / Fraud</h2>
                    <p className="text-slate-600 mb-6">High-entropy pixels detected or ELA failed.</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-xl border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{scanResult?.ela}%</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Integrity Score</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-red-100">
                        <div className="text-2xl font-bold text-red-600">{scanResult?.clean}%</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Cleanliness</div>
                      </div>
                    </div>
                    
                    <button onClick={() => setMode("camera")} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium">Retake Photo</button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};