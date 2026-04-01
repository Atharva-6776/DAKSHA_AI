import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Image as ImageIcon, CheckCircle, Target, ArrowLeft, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "../../context/AppProvider";
import { useNavigate } from "react-router";

export const Citizen = () => {
  const [mode, setMode] = useState<"select" | "camera" | "preview" | "success">("select");
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const { addReport } = useAppContext();
  const navigate = useNavigate();

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImg(imageSrc);
      setMode("preview");
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImg(reader.result as string);
        setMode("preview");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    
    // Get live browser location if available
    let locationStr = "Sector 14, North Ave";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { locationStr = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`; },
        () => {}
      );
    }

    const newId = `RPT-${Math.floor(Math.random() * 10000)}`;
    await addReport({
      id: newId,
      status: "Pending",
      date: new Date().toISOString(),
      location: locationStr
    }, capturedImg || "");
    
    setIsUploading(false);
    setMode("success");
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center py-12 px-4 relative z-10 text-slate-800">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md -z-10 rounded-3xl shadow-xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {mode === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full text-center"
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Report an Issue</h1>
            <p className="text-slate-600 mb-10">Help keep our city clean. Snap a photo of the uncleaned area.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <button
                onClick={() => setMode("camera")}
                className="group relative bg-white border-2 border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center transition-all hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="bg-emerald-50 text-emerald-600 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Camera size={40} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Use Live Camera</h3>
                <p className="text-sm text-slate-500 mt-2">Recommended for accuracy</p>
              </button>

              <label className="group relative bg-white border-2 border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center transition-all hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <div className="bg-blue-50 text-blue-600 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={40} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Upload Gallery</h3>
                <p className="text-sm text-slate-500 mt-2">Select an existing photo</p>
              </label>
            </div>
          </motion.div>
        )}

        {mode === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-6">
              <button onClick={() => setMode("select")} className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
                <ArrowLeft size={20} /> Back
              </button>
              <h2 className="text-xl font-bold">Live Capture</h2>
              <div className="w-20" /> {/* Spacer */}
            </div>

            <div className="relative w-full aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Landmark Anchor Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center border-4 border-dashed border-white/30 m-8 rounded-xl">
                <Target size={64} className="text-white/60 mb-4" />
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium text-center shadow-lg">
                  Include a static landmark (pole, tree, gate)
                </div>
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={handleCapture}
                  className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 shadow-xl hover:scale-105 active:scale-95 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}

        {mode === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex flex-col items-center"
          >
            <h2 className="text-2xl font-bold mb-6">Review Photo</h2>
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-lg border border-slate-200 mb-8">
              <img src={capturedImg!} alt="Captured" className="w-full h-full object-cover" />
            </div>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setMode("select")}
                className="flex-1 py-3 px-6 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                disabled={isUploading}
              >
                Retake
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud size={20} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {mode === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center flex flex-col items-center py-12"
          >
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Report Submitted!</h2>
            <p className="text-slate-600 mb-8">Your issue has been logged and assigned to a worker for resolution.</p>
            <button
              onClick={() => navigate("/admin")}
              className="py-3 px-8 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
            >
              View in Admin Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};