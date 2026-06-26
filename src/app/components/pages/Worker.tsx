const startAnalysis = useCallback(async (imgSrc: string, reportId: string, workerLat?: number, workerLng?: number) => {
  setMode("analysis");
  setScanState("matching");

  // Convert base64 to blob
  const base64Response = await fetch(imgSrc);
  const blob = await base64Response.blob();
  const formData = new FormData();
  formData.append("file", blob, "worker_image.jpg");
  formData.append("type", "worker");

  setScanState("segmenting");

  try {
    const response = await fetch("https://your-backend-url/verify", {
      method: "POST",
      body: formData,
    });

    setScanState("forensic");
    const result = await response.json();

    // Check GPS mismatch
    const cr = reports.find(r => r.id === reportId);
    let locationMismatch = false;
    if (workerLat && workerLng && cr?.lat && cr?.lng) {
      if (haversineMetres(cr.lat, cr.lng, workerLat, workerLng) > 200) {
        locationMismatch = true;
      }
    }

    const finalPassed = result.passed && !locationMismatch;

    setScanResult({
      passed: finalPassed,
      ela: result.ela,
      clean: result.opencv,
      yolo: result.yolo,
      opencv: result.opencv,
    });

    setScanState("result");

    await updateReport(reportId, {
      status: finalPassed ? "Verified" : "Rejected",
      integrityScore: result.ela,
      cleanlinessScore: result.opencv,
      yoloScore: result.yolo,
      opencvScore: result.opencv,
    }, imgSrc);

  } catch (err) {
    console.error("AI verification failed:", err);
    setScanState("result");
    setScanResult({ passed: false, ela: 0, clean: 0, yolo: 0, opencv: 0 });
  }
}, [updateReport, reports]);