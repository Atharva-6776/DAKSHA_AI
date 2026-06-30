from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import io
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load trained model — falls back to pretrained if best.pt not found
MODEL_PATH = "best.pt" if os.path.exists("best.pt") else "yolov8n.pt"
model = YOLO(MODEL_PATH)
print(f"Loaded model: {MODEL_PATH}")

# Your trained model's classes (from training results)
TRAINED_WASTE_CLASSES = [
    "biodegradable", "cardboard", "glass", "metal", "paper", "plastic"
]

# Fallback COCO classes if using pretrained model
COCO_WASTE_CLASSES = [
    "bottle", "cup", "bowl", "banana", "apple",
    "sandwich", "orange", "hot dog", "pizza",
    "donut", "cake", "backpack", "handbag", "suitcase"
]

ALL_WASTE = set(TRAINED_WASTE_CLASSES + COCO_WASTE_CLASSES)


def detect_waste(image_bytes: bytes):
    """Run YOLO detection and return waste findings"""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return False, 0, []

    results = model(img, verbose=False, conf=0.25)

    detected_waste = []
    confidence_scores = []

    for result in results:
        for box in result.boxes:
            class_name = model.names[int(box.cls)].lower()
            confidence = float(box.conf)
            if class_name in ALL_WASTE:
                detected_waste.append(class_name)
                confidence_scores.append(confidence)

    waste_detected = len(detected_waste) > 0
    avg_confidence = int(np.mean(confidence_scores) * 100) if confidence_scores else 0

    return waste_detected, avg_confidence, detected_waste


def run_ela(image_bytes: bytes, quality: int = 90) -> int:
    """Error Level Analysis — detects if image is fake/edited."""
    try:
        original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        buffer = io.BytesIO()
        original.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        compressed = Image.open(buffer).convert("RGB")

        ela_image = ImageChops.difference(original, compressed)
        extrema = ela_image.getextrema()
        max_diff = max([ex[1] for ex in extrema])

        if max_diff == 0:
            return 95

        scale = 255.0 / max_diff
        ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
        ela_array = np.array(ela_image)
        variance = np.var(ela_array)

        integrity_score = max(0, min(100, int(100 - (variance / 500))))
        return integrity_score

    except Exception:
        return 50


def run_opencv_cleanliness(image_bytes: bytes) -> int:
    """OpenCV cleanliness analysis."""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return 50

        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        lower_dirty = np.array([0, 0, 0])
        upper_dirty = np.array([180, 50, 80])
        dirty_mask = cv2.inRange(hsv, lower_dirty, upper_dirty)
        dirty_pct = (np.sum(dirty_mask > 0) / dirty_mask.size) * 100

        lower_garbage = np.array([10, 50, 20])
        upper_garbage = np.array([30, 255, 200])
        garbage_mask = cv2.inRange(hsv, lower_garbage, upper_garbage)
        garbage_pct = (np.sum(garbage_mask > 0) / garbage_mask.size) * 100

        combined_dirty = min(100, dirty_pct + (garbage_pct * 0.5))
        cleanliness = max(0, min(100, int(100 - combined_dirty)))

        return cleanliness

    except Exception:
        return 50


@app.post("/verify")
async def verify_image(
    file: UploadFile = File(...),
    type: str = Form("citizen")
):
    image_bytes = await file.read()

    waste_detected, yolo_score, detected_items = detect_waste(image_bytes)
    ela_score = run_ela(image_bytes)
    opencv_score = run_opencv_cleanliness(image_bytes)

    if type == "citizen":
        if not waste_detected:
            return {
                "passed": False,
                "status": "Rejected",
                "message": "No waste or garbage detected in the image. Please upload a clear photo of the waste.",
                "ela": ela_score,
                "yolo": yolo_score,
                "opencv": opencv_score,
                "cleanliness": opencv_score,
                "detected_items": []
            }

        return {
            "passed": True,
            "status": "Pending",
            "message": f"Waste confirmed: {', '.join(set(detected_items))}. Report accepted.",
            "ela": ela_score,
            "yolo": yolo_score,
            "opencv": opencv_score,
            "cleanliness": opencv_score,
            "detected_items": detected_items
        }

    else:
        if ela_score < 40:
            return {
                "passed": False,
                "status": "Rejected",
                "message": "Image appears to be edited or fake. Fraud detected.",
                "ela": ela_score,
                "yolo": yolo_score,
                "opencv": opencv_score,
                "cleanliness": opencv_score,
                "detected_items": detected_items
            }

        if waste_detected:
            return {
                "passed": False,
                "status": "Rejected",
                "message": f"Waste still detected in area: {', '.join(set(detected_items))}. Area not fully cleaned.",
                "ela": ela_score,
                "yolo": yolo_score,
                "opencv": opencv_score,
                "cleanliness": opencv_score,
                "detected_items": detected_items
            }

        if opencv_score < 45:
            return {
                "passed": False,
                "status": "Rejected",
                "message": "Area does not appear sufficiently clean. Please clean thoroughly.",
                "ela": ela_score,
                "yolo": yolo_score,
                "opencv": opencv_score,
                "cleanliness": opencv_score,
                "detected_items": []
            }

        return {
            "passed": True,
            "status": "Verified",
            "message": "Area verified as clean. No waste detected. Good work!",
            "ela": ela_score,
            "yolo": yolo_score,
            "opencv": opencv_score,
            "cleanliness": opencv_score,
            "detected_items": []
        }


@app.get("/health")
def health():
    return {
        "status": "running",
        "model": MODEL_PATH,
        "waste_classes": len(ALL_WASTE)
    }