from __future__ import annotations

import sys
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import asyncio
import json

sys.path.append(str(Path(__file__).parent))
from agent_logic import manager, run_agent_pipeline

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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/run")
async def run_debate():
    try:
        data_path = root_path / "AIagent" / "all_agent_data.json"
        with open(data_path, "r") as f:
            bundle = json.load(f)
        
        # Run in background
        asyncio.create_task(run_agent_pipeline(bundle))
        return {"status": "success", "message": "Pipeline started"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def update_agent_data(formatted_results, input_params):
    """Update AIagent/all_agent_data.json with fresh results."""
    data_path = root_path / "AIagent" / "all_agent_data.json"
    if not data_path.exists():
        return
    
    try:
        with open(data_path, "r") as f:
            data = json.load(f)
        
        # Update ML Engine Data
        data["ML_Engine_Data"] = [
            {"rank": i+1, "crop": r["name"], "suitability": r["score"], "confidence": 0.9}
            for i, r in enumerate(formatted_results)
        ]
        
        # Update Metadata
        data["Metadata"]["Location"] = input_params.get("location", "Pune, Maharashtra")
        
        # Update Soil Data if available
        if "N" in input_params:
            data["Soil_Health_Card"]["macronutrients"] = {
                "N": "Medium" if 20 <= input_params["N"] <= 100 else ("High" if input_params["N"] > 100 else "Low"),
                "P": "Medium" if 20 <= input_params["P"] <= 60 else ("High" if input_params["P"] > 60 else "Low"),
                "K": "Medium" if 20 <= input_params["K"] <= 60 else ("High" if input_params["K"] > 60 else "Low"),
            }
        
        with open(data_path, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Failed to update agent data: {e}")


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
        
        # Sync with AI Agent
        update_agent_data(formatted_results, input_dict)
        
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
