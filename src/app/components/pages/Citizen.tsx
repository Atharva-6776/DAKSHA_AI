import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Image as ImageIcon, CheckCircle, Target, ArrowLeft, ArrowRight, UploadCloud, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../../context/AppProvider";
import { useNavigate } from "react-router";

const C = { yellow: "#feda6a", silver: "#d4d4dc", grey: "#393f4d", dark: "#1d1e22", darker: "#14151a" };
const S = {
  label: { fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase" as const, color: C.yellow },
  title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 72, fontWeight: 300, fontStyle: "italic" as const, color: C.silver, lineHeight: 0.95, margin: 0 },
  body:  { fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "rgba(212,212,220,0.55)", lineHeight: 1.8, fontWeight: 300 as const, letterSpacing: "0.02em" },
};

export const Citizen = () => {
  const [mode, setMode] = useState<"select" | "camera" | "preview" | "success">("select");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{ label: string; lat?: number; lng?: number } | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const { addReport } = useAppContext();
  const navigate = useNavigate();

  const resolveLocation = (cb: (info: { label: string; lat?: number; lng?: number }) => void) => {
    if (!navigator.geolocation) return cb({ label: "Location not supported" });
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "Accept-Language": "en" } });
          const data = await res.json();
          cb({ label: data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
        } catch { cb({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng }); }
      },
      () => cb({ label: "Location unavailable" })
    );
  };

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const img = webcamRef.current.getScreenshot();
    if (!img) return;
    setCapturedImg(img);
    resolveLocation(setLocationInfo);
    setMode("preview");
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImg(reader.result as string);
      resolveLocation(setLocationInfo);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    const newId = `RPT-${Math.floor(Math.random() * 9000) + 1000}`;
    await addReport({
      id: newId, status: "Pending",
      date: new Date().toISOString(),
      location: locationInfo?.label ?? "Unknown",
      lat: locationInfo?.lat,
      lng: locationInfo?.lng,
    }, capturedImg ?? "");
    setIsUploading(false);
    setMode("success");
  };

  const divider = <div style={{ width: 32, height: 1, background: C.yellow, display: "inline-block" }} />;

  return (
    <div style={{ width: "100%", minHeight: "80vh", display: "flex", alignItems: "stretch" }}>

      {/* Left panel — hero image */}
      <div style={{
        width: "40%", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        minHeight: 600,
      }}>
        <img
          src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=900&auto=format&fit=crop"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,21,26,0.95) 0%, rgba(20,21,26,0.3) 60%)" }} />
        <div style={{ position: "relative", zIndex: 2, padding: "48px 40px" }}>
          <div style={{ ...S.label, marginBottom: 16 }}>— Citizen Portal</div>
          <h1 style={{ ...S.title, fontSize: 64 }}>
            Report<br /><span style={{ color: C.yellow }}>Issue</span>
          </h1>
          <p style={{ ...S.body, marginTop: 20 }}>
            Snap or upload a photo of an uncleaned area. GPS-tagged and submitted to our AI verification queue instantly.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, padding: "60px 60px",
        background: C.darker,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <AnimatePresence mode="wait">

          {/* SELECT */}
          {mode === "select" && (
            <motion.div key="select"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}>
              <div style={S.label}>Step 01</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: "12px 0 8px" }}>
                Choose Method
              </h2>
              <p style={{ ...S.body, marginBottom: 48 }}>Select how you'd like to capture the uncleaned area.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Live Camera", sub: "Recommended for accuracy", icon: Camera, action: () => setMode("camera") },
                  { label: "Upload Photo", sub: "Select existing image", icon: ImageIcon, action: null },
                ].map(({ label, sub, icon: Icon, action }, i) => (
                  <div key={i}
                    style={{
                      border: `1px solid rgba(57,63,77,0.6)`,
                      padding: "36px 28px", cursor: "pointer",
                      transition: "all 0.35s", background: "rgba(29,30,34,0.5)",
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16,
                      position: "relative",
                    }}
                    onClick={action ?? undefined}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = C.yellow;
                      e.currentTarget.style.background = "rgba(254,218,106,0.04)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(57,63,77,0.6)";
                      e.currentTarget.style.background = "rgba(29,30,34,0.5)";
                    }}>
                    {i === 1 && (
                      <label style={{ position: "absolute", inset: 0, cursor: "pointer" }}>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
                      </label>
                    )}
                    <div style={{ padding: "10px", border: `1px solid rgba(254,218,106,0.2)`, background: "rgba(254,218,106,0.05)" }}>
                      <Icon size={22} style={{ color: C.yellow }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16, fontWeight: 600, color: C.silver, marginBottom: 4 }}>{label}</div>
                      <div style={{ ...S.body, fontSize: 13 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CAMERA */}
          {mode === "camera" && (
            <motion.div key="camera"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <button onClick={() => setMode("select")}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginBottom: 32, ...S.body, fontSize: 13 }}>
                <ArrowLeft size={16} style={{ color: C.yellow }} /> Back
              </button>
              <div style={{ ...S.label, marginBottom: 24 }}>Step 02 — Capture</div>

              <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000", overflow: "hidden" }}>
                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", inset: "24px", border: "1px dashed rgba(254,218,106,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12,
                }}>
                  <Target size={40} style={{ color: "rgba(254,218,106,0.5)" }} />
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(254,218,106,0.5)" }}>
                    Include a landmark
                  </div>
                </div>
                {/* Shutter */}
                <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
                  <button onClick={handleCapture}
                    style={{
                      width: 60, height: 60, borderRadius: "50%", background: C.yellow,
                      border: `3px solid rgba(254,218,106,0.3)`, cursor: "pointer",
                      boxShadow: `0 0 24px rgba(254,218,106,0.4)`, transition: "all 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                </div>
              </div>
            </motion.div>
          )}

          {/* PREVIEW */}
          {mode === "preview" && (
            <motion.div key="preview"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}>
              <div style={{ ...S.label, marginBottom: 24 }}>Step 03 — Review</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: "0 0 24px" }}>
                Review Photo
              </h2>

              <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", marginBottom: 20 }}>
                <img src={capturedImg!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, border: `1px solid rgba(254,218,106,0.15)`, pointerEvents: "none" }} />
              </div>

              {locationInfo && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "14px 18px", border: `1px solid rgba(57,63,77,0.5)`,
                  background: "rgba(29,30,34,0.6)", marginBottom: 28,
                }}>
                  <MapPin size={14} style={{ color: C.yellow, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(212,212,220,0.4)", marginBottom: 4 }}>Location Detected</div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "rgba(212,212,220,0.6)", wordBreak: "break-all" }}>{locationInfo.label}</div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setMode("select")} disabled={isUploading}
                  style={{
                    flex: 1, padding: "15px", background: "transparent",
                    border: `1px solid rgba(57,63,77,0.6)`, color: C.silver,
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600,
                    cursor: "pointer", transition: "all 0.3s",
                  }}>
                  Retake
                </button>
                <button onClick={handleSubmit} disabled={isUploading}
                  style={{
                    flex: 2, padding: "15px",
                    background: isUploading ? C.grey : C.yellow,
                    border: "none", color: C.dark,
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700,
                    cursor: "pointer", transition: "all 0.3s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}>
                  {isUploading ? (
                    <><div style={{ width: 16, height: 16, border: "2px solid rgba(29,30,34,0.3)", borderTopColor: C.dark, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Uploading...</>
                  ) : (
                    <><UploadCloud size={16} /> Submit Report</>
                  )}
                </button>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          )}

          {/* SUCCESS */}
          {mode === "success" && (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
              <div style={{
                width: 80, height: 80, border: `1px solid rgba(254,218,106,0.3)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 32, background: "rgba(254,218,106,0.05)",
              }}>
                <CheckCircle size={36} style={{ color: C.yellow }} />
              </div>
              <div style={{ ...S.label, marginBottom: 16 }}>Report Submitted</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 300, fontStyle: "italic", color: C.silver, margin: "0 0 16px" }}>
                Thank You
              </h2>
              <p style={{ ...S.body, maxWidth: 360, marginBottom: 40 }}>
                Your issue has been logged and assigned to a worker for resolution.
              </p>
              <button onClick={() => navigate("/admin")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 14,
                  padding: "15px 36px", background: C.yellow, color: C.dark,
                  fontFamily: "'Rajdhani', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700,
                  border: "none", cursor: "pointer",
                }}>
                View Dashboard <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};