import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Image as ImageIcon, CheckCircle, Target, ArrowLeft, UploadCloud, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../../context/AppProvider";
import { useNavigate } from "react-router";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  navy:  "#091f36",
  blue:  "#0f2862",
  red:   "#9e363a",
  slate: "#4f5f76",
  light: "#c8d4e3",
};

export const Citizen = () => {
  const [mode, setMode] = useState<"select" | "camera" | "preview" | "success">("select");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{ label: string; lat?: number; lng?: number } | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const { addReport } = useAppContext();
  const navigate = useNavigate();

  // ── Capture + resolve GPS & address simultaneously ────────────────────────
  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setCapturedImg(imageSrc);

    // Start GPS resolution immediately on capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude: lat, longitude: lng } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            const label = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setLocationInfo({ label, lat, lng });
          } catch {
            setLocationInfo({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
          }
        },
        () => setLocationInfo({ label: "Location unavailable" }),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
      );
    } else {
      setLocationInfo({ label: "Location not supported" });
    }

    setMode("preview");
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImg(reader.result as string);
      // For gallery uploads, try GPS too
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { "Accept-Language": "en" } }
              );
              const data = await res.json();
              setLocationInfo({ label: data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
            } catch {
              setLocationInfo({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
            }
          },
          () => setLocationInfo({ label: "Location unavailable" })
        );
      }
      setMode("preview");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    const newId = `RPT-${Math.floor(Math.random() * 9000) + 1000}`;

    // ✅ Pass lat/lng to addReport so they get saved in the server
    await addReport(
      {
        id: newId,
        status: "Pending",
        date: new Date().toISOString(),
        location: locationInfo?.label ?? "Unknown location",
        lat:  locationInfo?.lat,   // ✅ NEW
        lng:  locationInfo?.lng,   // ✅ NEW
      },
      capturedImg ?? ""
    );

    setIsUploading(false);
    setMode("success");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center py-12 px-4 relative z-10">

      <AnimatePresence mode="wait">

        {/* SELECT */}
        {mode === "select" && (
          <motion.div key="select"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Report an Issue</h1>
            <p className="mb-10" style={{ color: C.light }}>
              Help keep our city clean. Snap a photo of the uncleaned area.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setMode("camera")}
                className="group relative p-8 rounded-2xl flex flex-col items-center justify-center border transition-all hover:scale-[1.02]"
                style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.4)" }}>
                <div className="p-5 rounded-full mb-4 transition-transform group-hover:scale-110"
                  style={{ background: "rgba(158,54,58,0.2)" }}>
                  <Camera size={40} style={{ color: C.red }} />
                </div>
                <h3 className="text-lg font-semibold text-white">Use Live Camera</h3>
                <p className="text-sm mt-2" style={{ color: C.light }}>Recommended for accuracy</p>
              </button>

              <label className="group relative p-8 rounded-2xl flex flex-col items-center justify-center border transition-all hover:scale-[1.02] cursor-pointer"
                style={{ background: "rgba(15,40,98,0.35)", borderColor: "rgba(79,95,118,0.4)" }}>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <div className="p-5 rounded-full mb-4 transition-transform group-hover:scale-110"
                  style={{ background: "rgba(79,95,118,0.25)" }}>
                  <ImageIcon size={40} style={{ color: C.light }} />
                </div>
                <h3 className="text-lg font-semibold text-white">Upload Gallery</h3>
                <p className="text-sm mt-2" style={{ color: C.light }}>Select an existing photo</p>
              </label>
            </div>
          </motion.div>
        )}

        {/* CAMERA */}
        {mode === "camera" && (
          <motion.div key="camera"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <button onClick={() => setMode("select")}
                className="flex items-center gap-2 transition-colors" style={{ color: C.light }}>
                <ArrowLeft size={20} /> Back
              </button>
              <h2 className="text-xl font-bold text-white">Live Capture</h2>
              <div className="w-20" />
            </div>

            <div className="relative w-full aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="absolute inset-0 w-full h-full object-cover" />

              {/* Landmark overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center border-4 border-dashed border-white/30 m-8 rounded-xl">
                <Target size={64} className="mb-4" style={{ color: "rgba(255,255,255,0.6)" }} />
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium text-center">
                  Include a static landmark (pole, tree, gate)
                </div>
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button onClick={handleCapture}
                  className="w-16 h-16 bg-white rounded-full border-4 hover:scale-105 active:scale-95 transition-all shadow-xl"
                  style={{ borderColor: C.red, boxShadow: `0 0 20px rgba(158,54,58,0.5)` }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* PREVIEW */}
        {mode === "preview" && (
          <motion.div key="preview"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-6">Review Photo</h2>

            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-lg border mb-4"
              style={{ borderColor: "rgba(79,95,118,0.4)" }}>
              <img src={capturedImg!} alt="Captured" className="w-full h-full object-cover" />
            </div>

            {/* Location preview */}
            {locationInfo && (
              <div className="w-full flex items-start gap-2 rounded-xl px-4 py-3 mb-6 border text-sm"
                style={{ background: "rgba(15,40,98,0.4)", borderColor: "rgba(79,95,118,0.35)" }}>
                <MapPin size={14} className="mt-0.5 shrink-0" style={{ color: C.red }} />
                <div>
                  <p className="font-semibold text-white text-xs uppercase tracking-wider mb-0.5">Location Detected</p>
                  <p className="break-all" style={{ color: C.light, fontSize: "11px" }}>{locationInfo.label}</p>
                  {locationInfo.lat !== undefined && (
                    <p className="font-mono mt-0.5" style={{ color: C.slate, fontSize: "11px" }}>
                      {locationInfo.lat.toFixed(5)}, {locationInfo.lng?.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 w-full">
              <button onClick={() => setMode("select")} disabled={isUploading}
                className="flex-1 py-3 px-6 rounded-xl font-semibold border transition-colors"
                style={{ borderColor: C.slate, color: C.light }}>
                Retake
              </button>
              <button onClick={handleSubmit} disabled={isUploading}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-white flex justify-center items-center gap-2 transition-colors"
                style={{ background: isUploading ? C.slate : C.red }}>
                {isUploading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} /> Submit Report
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* SUCCESS */}
        {mode === "success" && (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center flex flex-col items-center py-12">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.4)" }}>
              <CheckCircle size={48} style={{ color: "#22c55e" }} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Report Submitted!</h2>
            <p className="mb-8" style={{ color: C.light }}>
              Your issue has been logged and assigned to a worker for resolution.
            </p>
            {locationInfo?.lat !== undefined && (
              <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: C.light }}>
                <MapPin size={14} style={{ color: C.red }} />
                {locationInfo.label}
              </div>
            )}
            <button onClick={() => navigate("/admin")}
              className="py-3 px-8 rounded-xl font-semibold text-white"
              style={{ background: C.blue }}>
              View in Admin Dashboard
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};