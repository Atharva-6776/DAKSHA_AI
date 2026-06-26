from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import io, base64

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Load pretrained YOLO model
model = YOLO("yolov8n.pt")  # downloads automatically first time

# Waste-related class IDs in COCO dataset
# 0=person, but we care about these:
WASTE_CLASSES = ["bottle", "cup", "bowl", "banana", "apple", 
                 "sandwich", "orange", "broccoli", "carrot", 
                 "hot dog", "pizza", "donut", "cake", "bag"]

def run_ela(image_bytes, quality=90):
    """Error Level Analysis — detects image tampering"""
    original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Save at lower quality and compare
    buffer = io.BytesIO()
    original.save(buffer, "JPEG", quality=quality)
    buffer.seek(0)
    compressed = Image.open(buffer).convert("RGB")
    
    # Get difference
    ela_image = ImageChops.difference(original, compressed)
    extrema = ela_image.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    
    if max_diff == 0:
        max_diff = 1
    
    # Scale to highlight differences
    scale = 255.0 / max_diff
    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
    
    # Score: lower variance = more authentic (not edited)
    ela_array = np.array(ela_image)
    variance = np.var(ela_array)
    
    # Normalize to 0-100 integrity score
    integrity_score = max(0, min(100, int(100 - (variance / 500))))
    return integrity_score

def run_opencv(image_bytes):
    """OpenCV preprocessing and cleanliness scoring"""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert to HSV for color analysis
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Detect dark/dirty patches (low value, low saturation = dirty)
    lower_dirty = np.array([0, 0, 0])
    upper_dirty = np.array([180, 50, 80])
    dirty_mask = cv2.inRange(hsv, lower_dirty, upper_dirty)
    
    dirty_percentage = (np.sum(dirty_mask > 0) / dirty_mask.size) * 100
    cleanliness_score = max(0, min(100, int(100 - dirty_percentage)))
    
    return cleanliness_score

def run_yolo(image_bytes):
    """YOLO waste/garbage detection"""
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
    
    # Run all three checks
    ela_score = run_ela(image_bytes)
    opencv_score = run_opencv(image_bytes)
    waste_detected, yolo_score, detected_items = run_yolo(image_bytes)
    
    if type == "citizen":
        # For citizen: we WANT garbage to be detected
        passed = waste_detected
        status = "Pending" if waste_detected else "Rejected"
        message = f"Waste detected: {detected_items}" if waste_detected else "No waste detected in image"
    else:
        # For worker: we WANT area to be clean
        passed = opencv_score > 60 and ela_score > 50
        status = "Verified" if passed else "Rejected"
        message = "Area verified as clean" if passed else "Area not sufficiently clean or image tampered"
    
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