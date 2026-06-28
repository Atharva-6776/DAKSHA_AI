from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

model = YOLO("yolov8n.pt")

WASTE_CLASSES = [
    "bottle", "cup", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot",
    "hot dog", "pizza", "donut", "cake"
]

def run_ela(image_bytes, quality=90):
    original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    buffer = io.BytesIO()
    original.save(buffer, "JPEG", quality=quality)
    buffer.seek(0)
    compressed = Image.open(buffer).convert("RGB")
    ela_image = ImageChops.difference(original, compressed)
    extrema = ela_image.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    if max_diff == 0:
        max_diff = 1
    scale = 255.0 / max_diff
    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
    ela_array = np.array(ela_image)
    variance = np.var(ela_array)
    integrity_score = max(0, min(100, int(100 - (variance / 500))))
    return integrity_score

def run_opencv(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_dirty = np.array([0, 0, 0])
    upper_dirty = np.array([180, 50, 80])
    dirty_mask = cv2.inRange(hsv, lower_dirty, upper_dirty)
    dirty_percentage = (np.sum(dirty_mask > 0) / dirty_mask.size) * 100
    cleanliness_score = max(0, min(100, int(100 - dirty_percentage)))
    return cleanliness_score

def run_yolo(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    results = model(img, verbose=False)
    detected_waste = []
    confidence_scores = []
    for result in results:
        for box in result.boxes:
            class_name = model.names[int(box.cls)]
            confidence = float(box.conf)
            if class_name in WASTE_CLASSES and confidence > 0.3:
                detected_waste.append(class_name)
                confidence_scores.append(confidence)
    waste_detected = len(detected_waste) > 0
    avg_confidence = int(np.mean(confidence_scores) * 100) if confidence_scores else 0
    return waste_detected, avg_confidence, detected_waste

@app.post("/verify")
async def verify_image(file: UploadFile = File(...), type: str = "citizen"):
    image_bytes = await file.read()
    ela_score = run_ela(image_bytes)
    opencv_score = run_opencv(image_bytes)
    waste_detected, yolo_score, detected_items = run_yolo(image_bytes)

    if type == "citizen":
        passed = waste_detected
        status = "Pending" if waste_detected else "Rejected"
        message = f"Waste detected: {detected_items}" if waste_detected else "No waste detected"
    else:
        passed = opencv_score > 60 and ela_score > 50
        status = "Verified" if passed else "Rejected"
        message = "Area verified clean" if passed else "Not clean or image tampered"

    return {
        "passed": passed,
        "status": status,
        "message": message,
        "ela": ela_score,
        "yolo": yolo_score,
        "opencv": opencv_score,
        "cleanliness": opencv_score,
        "detected_items": detected_items
    }

@app.get("/health")
def health():
    return {"status": "running"}