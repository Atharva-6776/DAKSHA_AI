from roboflow import Roboflow
from ultralytics import YOLO

def main():
    print("Downloading dataset...")
    rf = Roboflow(api_key="DFXNMGD59LnvmMx9FChK")
    project = rf.workspace("material-identification").project("garbage-classification-3")
    version = project.version(2)
    dataset = version.download("yolov8")

    print("Starting training...")
    model = YOLO("yolov8n.pt")

    results = model.train(
        data=f"{dataset.location}/data.yaml",
        epochs=50,
        imgsz=640,
        batch=8,
        name="daksha_waste_v1",
        patience=10,
        augment=True,
        device=0,
        workers=0
    )

    print("Training complete!")
    print("Best model saved at: runs/detect/daksha_waste_v1/weights/best.pt")

if __name__ == '__main__':
    main()