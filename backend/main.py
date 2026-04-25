from __future__ import annotations

import sys
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add the parent directory to sys.path so we can import master_ML
# This assumes the structure:
# /root
#   /backend
#     main.py
#   /master_ML
#     /ml_model
#       predict_crop.py
root_path = Path(__file__).resolve().parents[1]
sys.path.append(str(root_path))

try:
    from master_ML.ml_model.predict_crop import predict_top_crops
except ImportError as e:
    # Fallback if the above doesn't work due to package structure
    sys.path.append(str(root_path / "master_ML"))
    from ml_model.predict_crop import predict_top_crops

app = FastAPI(
    title="Aristos Crop Recommendation Backend",
    description="Backend API to serve ML model predictions to the Aristos frontend.",
    version="1.0.0",
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CropPredictionRequest(BaseModel):
    N: float = Field(..., description="Nitrogen value")
    P: float = Field(..., description="Phosphorus value")
    K: float = Field(..., description="Potassium value")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Humidity percentage")
    ph: float = Field(..., description="Soil pH")
    rainfall: float = Field(..., description="Rainfall in mm")
    soil_type: str = Field("unknown", description="Soil type")
    water_availability: str = Field("unknown", description="Water availability")
    season: str = Field("unknown", description="Season")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Aristos Backend is running"}

@app.post("/predict")
def predict_crop(payload: CropPredictionRequest):
    try:
        # Convert Pydantic model to dict
        input_dict = payload.dict()
        
        # Get top 5 recommendations from the ML model
        recommendations = predict_top_crops(input_dict, top_k=5)
        
        # Transform the output to match what the frontend MLResults component expects
        # Frontend expects: { name: str, score: number }
        formatted_results = [
            {
                "name": item["crop"],
                "score": int(item["probability"] * 100)
            }
            for item in recommendations
        ]
        
        return {"results": formatted_results}
        
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=f"Model file not found: {str(exc)}")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(exc)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
