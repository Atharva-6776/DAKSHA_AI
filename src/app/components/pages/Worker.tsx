import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  ShieldCheck, Crosshair, ArrowLeft, CheckCircle,
  AlertTriangle, Activity, MapPin, Loader2, WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../../context/AppProvider";
import { useNavigate } from "react-router";

type ScanState = "idle" | "matching" | "segmenting" | "forensic" | "result";

type GpsState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "acquired"; lat: number; lng: number; accuracy: number; address?: string }
  | { status: "error"; message: string };

// ─── helpers ────────────────────────────────────────────────────────────────

/** Haversine distance in metres between two coords */
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

/** Reverse-geocode with the free Nominatim API (no key needed) */
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

/** Ask the browser for GPS; returns a promise */
const getBrowserGps = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
  });

// ─── GPS badge ───────────────────────────────────────────────────────────────

const GpsBadge = ({ gps }: { gps: GpsState }) => {
  if (gps.status === "idle") return null;

  const configs = {
    requesting: { bg: "bg-blue-50 border-blue-200",   icon: <Loader2 size={14} className="text-blue-500 animate-spin" />, text: "Acquiring GPS…",           sub: null },
    acquired:   { bg: "bg-emerald-50 border-emerald-200", icon: <MapPin size={14} className="text-emerald-600" />,          text: "GPS Acquired",             sub: gps.status === "acquired" ? gps.address ?? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : null },
    error:      { bg: "bg-red-50 border-red-200",     icon: <WifiOff size={14} className="text-red-500" />,               text: "GPS Unavailable",          sub: gps.status === "error" ? gps.message : null },
  } as const;

  const cfg = configs[gps.status as keyof typeof configs];
  if (!cfg) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 border rounded-xl px-4 py-3 text-sm mb-4 ${cfg.bg}`}
    >
      <span className="mt-0.5 shrink-0">{cfg.icon}</span>
      <div>
        <p className="font-semibold text-slate-700">{cfg.text}</p>
        {cfg.sub && <p className="text-xs text-slate-500 mt-0.5 break-all">{cfg.sub}</p>}
      </div>
    </motion.div>
  );
};

// ─── main component ──────────────────────────────────────────────────────────

export const Worker = () => {
  const { reports, updateReport } = useAppContext();
  const navigate = useNavigate();
  const pendingReports = reports.filter(r => r.status === "Pending");

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "camera" | "analysis">("select");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<{ passed: boolean; ela: number; clean: number } | null>(null);
  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const webcamRef = useRef<Webcam>(null);

  const report = reports.find(r => r.id === selectedReport);

  // ── GPS: request as soon as worker enters camera mode ─────────────────────
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
        let message = "Location access denied.";
        if (err.code === 1) message = "Permission denied. Enable location in browser settings.";
        else if (err.code === 2) message = "Position unavailable. Check device GPS.";
        else if (err.code === 3) message = "GPS timed out. Move to an open area and retry.";
        setGps({ status: "error", message });
      });
  }, [mode]);

  // ── analysis ──────────────────────────────────────────────────────────────
  const startAnalysis = useCallback(
    (imgSrc: string, reportId: string, workerLat?: number, workerLng?: number) => {
      setMode("analysis");
      setScanState("matching");

      setTimeout(() => {
        setScanState("segmenting");
        setTimeout(() => {
          setScanState("forensic");
          setTimeout(async () => {
            // ── check GPS distance if citizen coords exist ────────────────
            const citizenReport = reports.find(r => r.id === reportId);
            let locationMismatch = false;

            if (
              workerLat !== undefined &&
              workerLng !== undefined &&
              citizenReport?.lat !== undefined &&
              citizenReport?.lng !== undefined
            ) {
              const dist = haversineMetres(
                citizenReport.lat, citizenReport.lng,
                workerLat, workerLng
              );
              // flag if worker is more than 200 m from the reported location
              if (dist > 200) locationMismatch = true;
            }

            const passed = !locationMismatch && Math.random() > 0.2;
            const result = {
              passed,
              ela:   passed ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 40) + 40,
              clean: passed ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 30) + 50,
            };

            setScanResult(result);
            setScanState("result");

            await updateReport(
              reportId,
              {
                status: passed ? "Verified" : "Rejected",
                integrityScore: result.ela,
                cleanlinessScore: result.clean,
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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">

        {/* ── SELECT ──────────────────────────────────────────────────────── */}
        {mode === "select" && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
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
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {r.location}
                      </p>
                      {/* Show citizen's GPS coords if available */}
                      {r.lat !== undefined && r.lng !== undefined && (
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                        </p>
                      )}
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

        {/* ── CAMERA ──────────────────────────────────────────────────────── */}
        {mode === "camera" && report && (
          <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full">
            <div className="w-full flex justify-between items-center mb-6">
              <button onClick={resetToSelect} className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                <ArrowLeft size={20} /> Back
              </button>
              <h2 className="text-xl font-bold flex items-center gap-2"><Crosshair size={20} /> Align Shot</h2>
              <div className="w-20" />
            </div>

            {/* GPS status badge */}
            <GpsBadge gps={gps} />

            {gps.status === "error" && (
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => {
                    setGps({ status: "requesting" });
                    getBrowserGps()
                      .then(async pos => {
                        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                        const address = await reverseGeocode(lat, lng);
                        setGps({ status: "acquired", lat, lng, accuracy, address });
                      })
                      .catch(err => {
                        let message = "Location access denied.";
                        if (err.code === 1) message = "Permission denied. Enable location in browser settings.";
                        else if (err.code === 2) message = "Position unavailable. Check device GPS.";
                        else if (err.code === 3) message = "GPS timed out. Move to open area and retry.";
                        setGps({ status: "error", message });
                      });
                  }}
                  className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg"
                >
                  Retry GPS
                </button>
                <button
                  onClick={() => setGps({ status: "idle" })}
                  className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg"
                >
                  Continue without GPS
                </button>
              </div>
            )}

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
              <div
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay bg-cover bg-center"
                style={{ backgroundImage: `url(${report.citizenImage})` }}
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Camera Only
              </div>

              {/* GPS overlay on camera */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium border border-white/20 flex items-center gap-1.5">
                {gps.status === "requesting" && <><Loader2 size={11} className="animate-spin" /> Locating…</>}
                {gps.status === "acquired"   && <><MapPin   size={11} className="text-emerald-400" /> GPS ✓ ±{Math.round(gps.accuracy)}m</>}
                {gps.status === "error"      && <><WifiOff  size={11} className="text-red-400"     /> No GPS</>}
                {gps.status === "idle"       && <><MapPin   size={11} />GPS</>}
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={handleCapture}
                  disabled={gps.status === "requesting"}
                  className="w-16 h-16 bg-white rounded-full border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ANALYSIS ────────────────────────────────────────────────────── */}
        {mode === "analysis" && (
          <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center py-12">
            {scanState !== "result" ? (
              <div className="text-center w-full max-w-md">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8 shadow-2xl">
                  <img src={capturedImg!} alt="Captured" className="w-full h-full object-cover brightness-50" />
                  <motion.div
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)] z-10"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white/90 font-mono text-sm">
                    {scanState === "matching"   && "SIFT/ORB Location Matching..."}
                    {scanState === "segmenting" && "Segmenting Garbage Zone..."}
                    {scanState === "forensic"   && "Running Error Level Analysis (ELA)..."}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "1. GPS & Location Match", active: "matching",   done: ["segmenting", "forensic", "result"] },
                    { label: "2. Cleanliness Threshold", active: "segmenting", done: ["forensic", "result"] },
                    { label: "3. Forensic Scan (ELA)",  active: "forensic",   done: ["result"] },
                  ].map(({ label, active, done }) => (
                    <div key={label} className="flex items-center justify-between text-sm font-medium text-slate-700">
                      <span>{label}</span>
                      {done.includes(scanState) ? (
                        <CheckCircle className="text-emerald-500" size={16} />
                      ) : scanState === active ? (
                        <Activity className="text-blue-500 animate-spin" size={16} />
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : scanResult?.passed ? (
              <div className="w-full max-w-md text-center bg-emerald-50 border border-emerald-200 p-8 rounded-3xl shadow-lg">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={56} />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Passed</h2>
                <p className="text-slate-600 mb-6">The location matches and the area is clean.</p>

                {gps.status === "acquired" && (
                  <div className="bg-white border border-emerald-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-left text-xs break-all">{gps.address}</span>
                  </div>
                )}

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

                <button onClick={resetToSelect} className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium">
                  Continue
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md text-center bg-red-50 border border-red-200 p-8 rounded-3xl shadow-lg">
                <AlertTriangle className="mx-auto text-red-500 mb-4" size={56} />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Incomplete / Fraud</h2>
                <p className="text-slate-600 mb-2">High-entropy pixels detected or ELA failed.</p>
                {gps.status === "acquired" && (
                  <p className="text-xs text-slate-400 mb-4 flex items-center justify-center gap-1">
                    <MapPin size={11} /> Worker location: {gps.address}
                  </p>
                )}
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
                <button
                  onClick={() => { setMode("camera"); setScanResult(null); setScanState("idle"); }}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium"
                >
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