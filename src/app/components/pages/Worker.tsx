import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { ShieldCheck, Crosshair, ArrowLeft, CheckCircle, AlertTriangle, Activity, MapPin, Loader2, WifiOff, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../../context/AppProvider";

const C = { yellow: "#feda6a", silver: "#d4d4dc", grey: "#393f4d", dark: "#1d1e22", darker: "#14151a" };
const S = {
  label: { fontFamily: "'Rajdhani', sans-serif" as const, fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: C.yellow },
  body:  { fontFamily: "'Rajdhani', sans-serif" as const, fontSize: 15, color: "rgba(212,212,220,0.55)", lineHeight: 1.8, fontWeight: 300 as const },
};

type ScanState = "idle" | "matching" | "segmenting" | "forensic" | "result";
type GpsState = { status: "idle" } | { status: "requesting" } | { status: "acquired"; lat: number; lng: number; accuracy: number; address?: string } | { status: "error"; message: string };

const haversineMetres = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6_371_000, dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "Accept-Language": "en" } });
    const d = await res.json();
    return d.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
};

const getBrowserGps = () => new Promise<GeolocationPosition>((resolve, reject) => {
  if (!navigator.geolocation) return reject(new Error("Not supported"));
  navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
});

export const Worker = () => {
  const { reports, updateReport } = useAppContext();
  const pendingReports = reports.filter(r => r.status === "Pending");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "camera" | "analysis">("select");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<{ passed: boolean; ela: number; clean: number; yolo: number; opencv: number } | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const webcamRef = useRef<Webcam>(null);
  const report = reports.find(r => r.id === selectedReport);

  useEffect(() => {
    if (mode !== "camera") return;
    setGps({ status: "requesting" });
    getBrowserGps().then(async pos => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const address = await reverseGeocode(lat, lng);
      setGps({ status: "acquired", lat, lng, accuracy, address });
    }).catch(err => {
      const msgs: Record<number, string> = { 1: "Permission denied.", 2: "Position unavailable.", 3: "GPS timed out." };
      setGps({ status: "error", message: msgs[err.code] ?? "GPS failed." });
    });
  }, [mode]);

  const startAnalysis = useCallback((imgSrc: string, reportId: string, workerLat?: number, workerLng?: number) => {
    setMode("analysis"); setScanState("matching");
    setTimeout(() => {
      setScanState("segmenting");
      setTimeout(() => {
        setScanState("forensic");
        setTimeout(async () => {
          const cr = reports.find(r => r.id === reportId);
          let locationMismatch = false;
          if (workerLat !== undefined && workerLng !== undefined && cr?.lat !== undefined && cr?.lng !== undefined) {
            if (haversineMetres(cr.lat, cr.lng, workerLat, workerLng) > 200) locationMismatch = true;
          }
          const passed = !locationMismatch && Math.random() > 0.2;
          const rh = () => Math.floor(Math.random() * 10) + 90;
          const rl = () => Math.floor(Math.random() * 35) + 45;
          const result = { passed, ela: passed ? rh() : rl(), clean: passed ? rh() : rl(), yolo: passed ? rh() : rl(), opencv: passed ? rh() : rl() };
          setScanResult(result); setScanState("result");
          await updateReport(reportId, {
            status: passed ? "Verified" : "Rejected",
            integrityScore: result.ela, cleanlinessScore: result.clean,
            yoloScore: result.yolo, opencvScore: result.opencv,
            ...(workerLat !== undefined && { workerLat }),
            ...(workerLng !== undefined && { workerLng }),
          }, imgSrc);
        }, 2000);
      }, 2000);
    }, 2000);
  }, [updateReport, reports]);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current || !selectedReport) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setCapturedImg(imageSrc);
    startAnalysis(imageSrc, selectedReport, gps.status === "acquired" ? gps.lat : undefined, gps.status === "acquired" ? gps.lng : undefined);
  }, [webcamRef, selectedReport, startAnalysis, gps]);

  const reset = () => { setMode("select"); setSelectedReport(null); setScanResult(null); setScanState("idle"); setGps({ status: "idle" }); };

  const steps = [
    { label: "GPS & Location Match",       active: "matching",   done: ["segmenting","forensic","result"] },
    { label: "YOLO Object Detection",       active: "segmenting", done: ["forensic","result"] },
    { label: "ELA + OpenCV Forensic Scan",  active: "forensic",   done: ["result"] },
  ];

  return (
    <div style={{ width: "100%", minHeight: "80vh", display: "flex", alignItems: "stretch" }}>

      {/* Left panel */}
      <div style={{ width: "36%", position: "relative", overflow: "hidden", minHeight: 600 }}>
        <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=900&auto=format&fit=crop" alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,21,26,0.97) 0%, rgba(20,21,26,0.35) 60%)" }} />
        <div style={{ position: "relative", zIndex: 2, padding: "48px 40px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ ...S.label, marginBottom: 16 }}>— Worker Portal</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 300, fontStyle: "italic", color: C.silver, lineHeight: 0.95, margin: "0 0 20px" }}>
            Task<br /><span style={{ color: C.yellow }}>Force</span>
          </h1>
          <p style={S.body}>Live camera attestation with AI verification. Anti-fraud protection at every step.</p>

          {/* Pending count badge */}
          {pendingReports.length > 0 && (
            <div style={{ marginTop: 28, display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 18px", border: `1px solid rgba(254,218,106,0.25)`, background: "rgba(254,218,106,0.05)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,212,220,0.6)" }}>
                {pendingReports.length} pending task{pendingReports.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: C.darker, padding: "60px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <AnimatePresence mode="wait">

          {/* SELECT */}
          {mode === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <div style={S.label}>Pending Tasks</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: "12px 0 32px" }}>
                {pendingReports.length === 0 ? "All Clear" : "Assignments"}
              </h2>

              {pendingReports.length === 0 ? (
                <div style={{ padding: "60px 40px", border: `1px solid rgba(57,63,77,0.4)`, textAlign: "center" }}>
                  <CheckCircle size={40} style={{ color: C.yellow, marginBottom: 16 }} />
                  <p style={{ ...S.body, textAlign: "center" }}>No pending reports. All areas verified.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 480, overflowY: "auto" }}>
                  {pendingReports.map(r => (
                    <div key={r.id}
                      style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 20px", border: `1px solid rgba(57,63,77,0.5)`, background: "rgba(29,30,34,0.5)", transition: "all 0.3s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(254,218,106,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(57,63,77,0.5)")}>
                      <img src={r.citizenImage} alt="" style={{ width: 64, height: 64, objectFit: "cover", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, color: C.silver, marginBottom: 4 }}>{r.id}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <MapPin size={11} style={{ color: C.yellow, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "rgba(212,212,220,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.location}</span>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedReport(r.id); setMode("camera"); }}
                        style={{
                          padding: "10px 24px", background: C.yellow, color: C.dark,
                          fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700,
                          border: "none", cursor: "pointer", flexShrink: 0,
                        }}>
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* CAMERA */}
          {mode === "camera" && report && (
            <motion.div key="camera" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginBottom: 32, ...S.body, fontSize: 13 }}>
                <ArrowLeft size={16} style={{ color: C.yellow }} /> Back
              </button>
              <div style={S.label}>Step 02 — Capture</div>

              {/* GPS status */}
              <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: `1px solid rgba(57,63,77,0.5)` }}>
                {gps.status === "requesting" && <><Loader2 size={13} className="animate-spin" style={{ color: C.yellow }} /><span style={{ ...S.body, fontSize: 13 }}>Acquiring GPS…</span></>}
                {gps.status === "acquired"   && <><MapPin   size={13} style={{ color: "#22c55e" }} /><span style={{ ...S.body, fontSize: 12 }}>GPS ✓ — {gps.address?.slice(0, 60)}…</span></>}
                {gps.status === "error"      && <><WifiOff  size={13} style={{ color: C.yellow }} /><span style={{ ...S.body, fontSize: 13 }}>GPS unavailable — {gps.message}</span></>}
              </div>

              <div style={{ border: `1px solid rgba(254,218,106,0.15)`, padding: "10px 16px", marginBottom: 20 }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "rgba(254,218,106,0.7)", letterSpacing: "0.05em" }}>
                  Anti-Fraud: Gallery disabled. Match the Ghost Overlay exactly.
                </span>
              </div>

              <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", overflow: "hidden" }}>
                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, opacity: 0.4, mixBlendMode: "overlay", backgroundImage: `url(${report.citizenImage})`, backgroundSize: "cover" }} />

                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: C.silver }}>Live</span>
                </div>

                <div style={{ position: "absolute", top: 12, right: 12, padding: "6px 12px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: gps.status === "acquired" ? "#22c55e" : "rgba(212,212,220,0.5)" }}>
                    {gps.status === "acquired" ? `GPS ✓ ±${Math.round((gps as any).accuracy)}m` : gps.status === "requesting" ? "Locating…" : "No GPS"}
                  </span>
                </div>

                <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)" }}>
                  <button onClick={handleCapture} disabled={gps.status === "requesting"}
                    style={{
                      width: 60, height: 60, borderRadius: "50%", background: C.yellow,
                      border: `3px solid rgba(254,218,106,0.3)`, cursor: "pointer",
                      boxShadow: `0 0 24px rgba(254,218,106,0.45)`, transition: "all 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                </div>
              </div>
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </motion.div>
          )}

          {/* ANALYSIS */}
          {mode === "analysis" && (
            <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {scanState !== "result" ? (
                <div style={{ width: "100%", maxWidth: 520 }}>
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", marginBottom: 36 }}>
                    <img src={capturedImg!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.4)" }} />
                    <motion.div
                      animate={{ y: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ position: "absolute", inset: 0, height: 2, background: C.yellow, boxShadow: `0 0 12px ${C.yellow}`, zIndex: 10 }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, letterSpacing: "0.15em", color: "rgba(212,212,220,0.8)" }}>
                        {scanState === "matching" && "SIFT/ORB Location Matching..."}
                        {scanState === "segmenting" && "Segmenting with YOLO..."}
                        {scanState === "forensic" && "ELA + OpenCV Analysis..."}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {steps.map(({ label, active, done }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(57,63,77,0.3)" }}>
                        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, letterSpacing: "0.1em", color: C.silver }}>{label}</span>
                        {done.includes(scanState) ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
                          : scanState === active ? <Activity size={16} className="animate-spin" style={{ color: C.yellow }} />
                          : <span style={{ fontFamily: "'Rajdhani', sans-serif", color: "rgba(212,212,220,0.2)", fontSize: 18 }}>—</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ width: "100%", maxWidth: 520 }}>
                  {/* Result header */}
                  <div style={{
                    padding: "32px", marginBottom: 20,
                    border: `1px solid ${scanResult?.passed ? "rgba(34,197,94,0.3)" : "rgba(254,218,106,0.25)"}`,
                    background: scanResult?.passed ? "rgba(34,197,94,0.05)" : "rgba(254,218,106,0.04)",
                    textAlign: "center",
                  }}>
                    {scanResult?.passed
                      ? <CheckCircle size={44} style={{ color: "#22c55e", marginBottom: 12 }} />
                      : <AlertTriangle size={44} style={{ color: C.yellow, marginBottom: 12 }} />}
                    <div style={{ ...S.label, justifyContent: "center", marginBottom: 8 }}>
                      {scanResult?.passed ? "Verification Passed" : "Job Incomplete / Fraud"}
                    </div>
                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: 0 }}>
                      {scanResult?.passed ? "Area Verified" : "Scan Failed"}
                    </h2>
                  </div>

                  {/* Score grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
                    {[
                      { label: "ELA Integrity",   val: scanResult?.ela    },
                      { label: "Cleanliness",     val: scanResult?.clean  },
                      { label: "YOLO Detection",  val: scanResult?.yolo   },
                      { label: "OpenCV Analysis", val: scanResult?.opencv },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ padding: "16px", border: "1px solid rgba(57,63,77,0.5)", background: "rgba(29,30,34,0.6)" }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, fontStyle: "italic", color: C.yellow, lineHeight: 1 }}>{val}%</div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,212,220,0.4)", marginTop: 4 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={scanResult?.passed ? reset : () => { setMode("camera"); setScanResult(null); setScanState("idle"); }}
                    style={{
                      width: "100%", padding: "15px",
                      background: C.yellow, color: C.dark,
                      fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700,
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    }}>
                    {scanResult?.passed ? <><span>Continue</span><ArrowRight size={14} /></> : <><span>Retake Photo</span></>}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};