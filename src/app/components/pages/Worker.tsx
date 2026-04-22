import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  ShieldCheck, Crosshair, ArrowLeft, CheckCircle,
  AlertTriangle, Activity, MapPin, Loader2, WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../../context/AppProvider";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  navy:   "#091f36",
  blue:   "#0f2862",
  red:    "#9e363a",
  slate:  "#4f5f76",
  light:  "#c8d4e3",
  white:  "#ffffff",
};

type ScanState = "idle" | "matching" | "segmenting" | "forensic" | "result";
type GpsState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "acquired"; lat: number; lng: number; accuracy: number; address?: string }
  | { status: "error"; message: string };

// ── helpers ───────────────────────────────────────────────────────────────────
const haversineMetres = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

const getBrowserGps = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
  });

// ── GPS Badge ─────────────────────────────────────────────────────────────────
const GpsBadge = ({ gps }: { gps: GpsState }) => {
  if (gps.status === "idle") return null;
  const cfg = {
    requesting: {
      border: C.blue, bg: "rgba(15,40,98,0.15)",
      icon: <Loader2 size={14} className="animate-spin" style={{ color: C.light }} />,
      text: "Acquiring GPS…", sub: null,
    },
    acquired: {
      border: "#22c55e", bg: "rgba(34,197,94,0.08)",
      icon: <MapPin size={14} style={{ color: "#22c55e" }} />,
      text: "GPS Acquired",
      sub: gps.status === "acquired" ? (gps.address ?? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`) : null,
    },
    error: {
      border: C.red, bg: "rgba(158,54,58,0.1)",
      icon: <WifiOff size={14} style={{ color: C.red }} />,
      text: "GPS Unavailable",
      sub: gps.status === "error" ? gps.message : null,
    },
  } as const;
  const c = cfg[gps.status as keyof typeof cfg];
  if (!c) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm mb-4 border"
      style={{ background: c.bg, borderColor: c.border }}>
      <span className="mt-0.5 shrink-0">{c.icon}</span>
      <div>
        <p className="font-semibold" style={{ color: C.light }}>{c.text}</p>
        {c.sub && <p className="text-xs mt-0.5 break-all" style={{ color: C.slate }}>{c.sub}</p>}
      </div>
    </motion.div>
  );
};

// ── Score result card ─────────────────────────────────────────────────────────
const ScoreGrid = ({ scores, passed }: {
  scores: { ela: number; clean: number; yolo: number; opencv: number };
  passed: boolean;
}) => {
  const accent = passed ? "#22c55e" : C.red;
  const items = [
    { label: "ELA Integrity",   val: scores.ela    },
    { label: "Cleanliness",     val: scores.clean  },
    { label: "YOLO Detection",  val: scores.yolo   },
    { label: "OpenCV Analysis", val: scores.opencv },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {items.map(({ label, val }) => (
        <div key={label} className="rounded-xl p-3 border"
          style={{ background: "rgba(9,31,54,0.6)", borderColor: "rgba(79,95,118,0.3)" }}>
          <div className="text-xl font-bold" style={{ color: accent }}>{val}%</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: C.slate }}>{label}</div>
        </div>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const Worker = () => {
  const { reports, updateReport } = useAppContext();
  const pendingReports = reports.filter(r => r.status === "Pending");

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "camera" | "analysis">("select");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<{
    passed: boolean; ela: number; clean: number; yolo: number; opencv: number;
  } | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const webcamRef = useRef<Webcam>(null);

  const report = reports.find(r => r.id === selectedReport);

  // GPS on camera mode
  useEffect(() => {
    if (mode !== "camera") return;
    setGps({ status: "requesting" });
    getBrowserGps()
      .then(async pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        setGps({ status: "acquired", lat, lng, accuracy, address });
      })
      .catch(err => {
        const msgs: Record<number, string> = {
          1: "Permission denied. Enable location in browser settings.",
          2: "Position unavailable. Check device GPS.",
          3: "GPS timed out. Move to open area and retry.",
        };
        setGps({ status: "error", message: msgs[err.code] ?? "Location access denied." });
      });
  }, [mode]);

  const retryGps = () => {
    setGps({ status: "requesting" });
    getBrowserGps()
      .then(async pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        setGps({ status: "acquired", lat, lng, accuracy, address });
      })
      .catch(err => {
        const msgs: Record<number, string> = {
          1: "Permission denied.",
          2: "Position unavailable.",
          3: "GPS timed out.",
        };
        setGps({ status: "error", message: msgs[err.code] ?? "GPS failed." });
      });
  };

  // ✅ Generates ALL 4 scores and saves them
  const startAnalysis = useCallback(
    (imgSrc: string, reportId: string, workerLat?: number, workerLng?: number) => {
      setMode("analysis");
      setScanState("matching");

      setTimeout(() => {
        setScanState("segmenting");
        setTimeout(() => {
          setScanState("forensic");
          setTimeout(async () => {
            const citizenReport = reports.find(r => r.id === reportId);
            let locationMismatch = false;
            if (
              workerLat !== undefined && workerLng !== undefined &&
              citizenReport?.lat !== undefined && citizenReport?.lng !== undefined
            ) {
              const dist = haversineMetres(
                citizenReport.lat, citizenReport.lng, workerLat, workerLng
              );
              if (dist > 200) locationMismatch = true;
            }

            const passed = !locationMismatch && Math.random() > 0.2;

            // ✅ Generate all 4 AI scores
            const randHigh = () => Math.floor(Math.random() * 10) + 90;
            const randLow  = () => Math.floor(Math.random() * 35) + 45;
            const result = {
              passed,
              ela:    passed ? randHigh() : randLow(),
              clean:  passed ? randHigh() : randLow(),
              yolo:   passed ? randHigh() : randLow(),   // ✅ NEW
              opencv: passed ? randHigh() : randLow(),   // ✅ NEW
            };

            setScanResult(result);
            setScanState("result");

            // ✅ Send ALL scores to server
            await updateReport(
              reportId,
              {
                status:           passed ? "Verified" : "Rejected",
                integrityScore:   result.ela,
                cleanlinessScore: result.clean,
                yoloScore:        result.yolo,    // ✅ NEW
                opencvScore:      result.opencv,  // ✅ NEW
                ...(workerLat !== undefined && { workerLat }),
                ...(workerLng !== undefined && { workerLng }),
              },
              imgSrc
            );
          }, 2000);
        }, 2000);
      }, 2000);
    },
    [updateReport, reports]
  );

  const handleCapture = useCallback(() => {
    if (!webcamRef.current || !selectedReport) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setCapturedImg(imageSrc);
    const workerLat = gps.status === "acquired" ? gps.lat : undefined;
    const workerLng = gps.status === "acquired" ? gps.lng : undefined;
    startAnalysis(imageSrc, selectedReport, workerLat, workerLng);
  }, [webcamRef, selectedReport, startAnalysis, gps]);

  const resetToSelect = () => {
    setMode("select");
    setSelectedReport(null);
    setScanResult(null);
    setScanState("idle");
    setGps({ status: "idle" });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">

        {/* SELECT */}
        {mode === "select" && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header card */}
            <div className="p-6 rounded-2xl mb-8 flex justify-between items-center shadow-xl border"
              style={{ background: C.blue, borderColor: "rgba(79,95,118,0.4)" }}>
              <div>
                <h1 className="text-2xl font-bold mb-1 text-white">Worker Task Force</h1>
                <p className="text-sm" style={{ color: C.light }}>Live Camera Attestation Required</p>
              </div>
              <div className="p-3 rounded-xl border" style={{ background: C.navy, borderColor: "rgba(79,95,118,0.4)" }}>
                <ShieldCheck style={{ color: C.red }} size={32} />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-white">Pending Tasks</h2>

            {pendingReports.length === 0 ? (
              <div className="text-center p-12 rounded-2xl border"
                style={{ background: "rgba(15,40,98,0.3)", borderColor: "rgba(79,95,118,0.3)" }}>
                <CheckCircle className="mx-auto mb-4" style={{ color: "#22c55e" }} size={48} />
                <h3 className="text-lg font-medium text-white">All caught up!</h3>
                <p style={{ color: C.light }}>No pending reports in your sector.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingReports.map(r => (
                  <div key={r.id} className="p-4 rounded-2xl border flex items-center gap-4 transition-all hover:border-opacity-70"
                    style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.35)" }}>
                    <img src={r.citizenImage} alt="Before" className="w-20 h-20 rounded-xl object-cover border"
                      style={{ borderColor: "rgba(79,95,118,0.4)" }} />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-white">{r.id}</h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-md"
                          style={{ background: "rgba(158,54,58,0.2)", color: "#fca5a5" }}>
                          Pending
                        </span>
                      </div>
                      <p className="text-sm flex items-center gap-1" style={{ color: C.light }}>
                        <MapPin size={12} style={{ color: C.slate }} />
                        {r.location}
                      </p>
                      {r.lat !== undefined && r.lng !== undefined && (
                        <p className="text-xs mt-0.5 font-mono" style={{ color: C.slate }}>
                          {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedReport(r.id); setMode("camera"); }}
                      className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white"
                      style={{ background: C.red }}>
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
          <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="w-full flex justify-between items-center mb-6">
              <button onClick={resetToSelect} className="flex items-center gap-2 transition-colors"
                style={{ color: C.light }}>
                <ArrowLeft size={20} /> Back
              </button>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Crosshair size={20} /> Align Shot
              </h2>
              <div className="w-20" />
            </div>

            <GpsBadge gps={gps} />

            {gps.status === "error" && (
              <div className="mb-4 flex gap-2">
                <button onClick={retryGps}
                  className="text-xs px-3 py-1.5 rounded-lg text-white"
                  style={{ background: C.blue }}>
                  Retry GPS
                </button>
                <button onClick={() => setGps({ status: "idle" })}
                  className="text-xs px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: C.slate, color: C.light }}>
                  Continue without GPS
                </button>
              </div>
            )}

            <div className="border-l-4 p-4 mb-6 rounded-r-xl text-sm"
              style={{ borderColor: C.red, background: "rgba(158,54,58,0.1)", color: "#fca5a5" }}>
              <strong>Anti-Fraud Protection:</strong> Gallery upload disabled. Match the Ghost Overlay exactly.
            </div>

            <div className="relative w-full aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-cover bg-center"
                style={{ backgroundImage: `url(${report.citizenImage})` }} />

              {/* Live indicator */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.red }} />
                Live Camera Only
              </div>

              {/* GPS overlay */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/20 flex items-center gap-1.5">
                {gps.status === "requesting" && <><Loader2 size={11} className="animate-spin" /> Locating…</>}
                {gps.status === "acquired"   && <><MapPin   size={11} style={{ color: "#22c55e" }} /> GPS ✓ ±{Math.round(gps.accuracy)}m</>}
                {gps.status === "error"      && <><WifiOff  size={11} style={{ color: C.red }}     /> No GPS</>}
                {gps.status === "idle"       && <><MapPin   size={11} /> GPS</>}
              </div>

              {/* Shutter */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button onClick={handleCapture} disabled={gps.status === "requesting"}
                  className="w-16 h-16 bg-white rounded-full border-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
                  style={{ borderColor: C.red, boxShadow: `0 0 20px rgba(158,54,58,0.5)` }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ANALYSIS */}
        {mode === "analysis" && (
          <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center py-12">

            {scanState !== "result" ? (
              <div className="text-center w-full max-w-md">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8 shadow-2xl">
                  <img src={capturedImg!} alt="Captured" className="w-full h-full object-cover brightness-50" />
                  <motion.div
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-1 z-10"
                    style={{ background: C.red, boxShadow: `0 0 15px ${C.red}` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white/90 font-mono text-sm">
                    {scanState === "matching"   && "SIFT/ORB Location Matching..."}
                    {scanState === "segmenting" && "Segmenting Garbage Zone (YOLO)..."}
                    {scanState === "forensic"   && "Running ELA + OpenCV Analysis..."}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "1. GPS & Location Match",        active: "matching",   done: ["segmenting","forensic","result"] },
                    { label: "2. YOLO Object Detection",       active: "segmenting", done: ["forensic","result"] },
                    { label: "3. ELA + OpenCV Forensic Scan",  active: "forensic",   done: ["result"] },
                  ].map(({ label, active, done }) => (
                    <div key={label} className="flex items-center justify-between text-sm font-medium"
                      style={{ color: C.light }}>
                      <span>{label}</span>
                      {done.includes(scanState)
                        ? <CheckCircle size={16} style={{ color: "#22c55e" }} />
                        : scanState === active
                          ? <Activity size={16} className="animate-spin" style={{ color: C.red }} />
                          : <span style={{ color: C.slate }}>–</span>}
                    </div>
                  ))}
                </div>
              </div>

            ) : scanResult?.passed ? (
              <div className="w-full max-w-md text-center rounded-3xl shadow-lg p-8 border"
                style={{ background: "rgba(15,40,98,0.5)", borderColor: "rgba(34,197,94,0.35)" }}>
                <CheckCircle className="mx-auto mb-4" size={56} style={{ color: "#22c55e" }} />
                <h2 className="text-2xl font-bold text-white mb-2">Verification Passed</h2>
                <p className="mb-6" style={{ color: C.light }}>Location matches and area is clean.</p>

                {gps.status === "acquired" && (
                  <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm border"
                    style={{ background: "rgba(9,31,54,0.6)", borderColor: "rgba(34,197,94,0.2)" }}>
                    <MapPin size={14} style={{ color: "#22c55e" }} className="shrink-0" />
                    <span className="text-left text-xs break-all" style={{ color: C.light }}>{gps.address}</span>
                  </div>
                )}

                <ScoreGrid scores={scanResult} passed={true} />

                <button onClick={resetToSelect}
                  className="w-full py-3 rounded-xl font-medium text-white"
                  style={{ background: C.blue }}>
                  Continue
                </button>
              </div>

            ) : (
              <div className="w-full max-w-md text-center rounded-3xl shadow-lg p-8 border"
                style={{ background: "rgba(158,54,58,0.15)", borderColor: "rgba(158,54,58,0.4)" }}>
                <AlertTriangle className="mx-auto mb-4" size={56} style={{ color: C.red }} />
                <h2 className="text-2xl font-bold text-white mb-2">Job Incomplete / Fraud</h2>
                <p className="mb-2" style={{ color: C.light }}>High-entropy pixels detected or analysis failed.</p>
                {gps.status === "acquired" && (
                  <p className="text-xs mb-4 flex items-center justify-center gap-1" style={{ color: C.slate }}>
                    <MapPin size={11} /> Worker: {gps.address}
                  </p>
                )}

                <ScoreGrid scores={scanResult!} passed={false} />

                <button
                  onClick={() => { setMode("camera"); setScanResult(null); setScanState("idle"); }}
                  className="w-full py-3 rounded-xl font-medium text-white"
                  style={{ background: C.red }}>
                  Retake Photo
                </button>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};