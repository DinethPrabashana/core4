# anomaly_detect_server.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
from PIL import Image
import io

app = FastAPI()

# Allow CORS so your React frontend can call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for stricter control
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class Anomaly(BaseModel):
    x: int
    y: int
    width: int
    height: int
    confidence: float

class AnalyzeResponse(BaseModel):
    threshold_received: float
    anomalies_detected: List[Anomaly]

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(threshold: float = Form(...), image: UploadFile = File(None)):
    print("\n[INFO] --- New Analysis Request ---")
    print(f"[INFO] Threshold received: {threshold}")

    result = {
        "threshold_received": threshold,
        "anomalies_detected": []
    }

    if image is not None:
        try:
            print(f"[INFO] Received image: {image.filename}")
            img_bytes = await image.read()
            img = Image.open(io.BytesIO(img_bytes))
            
            # Print detailed image info
            print(f"[INFO] Image format: {img.format}")
            print(f"[INFO] Image mode: {img.mode}")
            width, height = img.size
            print(f"[INFO] Image size: {width}x{height}")

            # Example: generate dummy anomaly
            anomaly = {
                "x": width // 4,
                "y": height // 4,
                "width": width // 2,
                "height": height // 2,
                "confidence": threshold
            }
            result["anomalies_detected"].append(anomaly)
            print(f"[INFO] Generated anomaly: {anomaly}")

        except Exception as e:
            print(f"[ERROR] Failed to process image: {e}")
    
    else:
        print("[INFO] No image received.")

    print(f"[INFO] Returning result: {result}")
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=32010, log_level="info")
