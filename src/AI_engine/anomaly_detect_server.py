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

# Response model for clarity
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
    # Print to console to debug
    print(f"\n[INFO] Received threshold: {threshold}")
    
    result = {
        "threshold_received": threshold,
        "anomalies_detected": []
    }

    if image is not None:
        print(f"[INFO] Received image: {image.filename}")
        img_bytes = await image.read()
        img = Image.open(io.BytesIO(img_bytes))
        width, height = img.size
        print(f"[INFO] Image size: {width}x{height}")

        # Example: generate dummy anomalies
        result["anomalies_detected"].append({
            "x": width // 4,
            "y": height // 4,
            "width": width // 2,
            "height": height // 2,
            "confidence": threshold
        })

    print(f"[INFO] Returning result: {result}")
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=32003, log_level="info")
