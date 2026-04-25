from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from ml_model.predict_crop import predict_top_crops


app = FastAPI(
    title="Crop Decision Intelligence ML API",
    description="ML-only crop recommendation API. Returns Top 5 crop predictions.",
    version="1.0.0",
)


class CropPredictionRequest(BaseModel):
    N: float = Field(..., ge=0, description="Nitrogen value")
    P: float = Field(..., ge=0, description="Phosphorus value")
    K: float = Field(..., ge=0, description="Potassium value")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    rainfall: float = Field(..., ge=0, description="Rainfall in mm")
    soil_type: str = Field("unknown", description="Example: clay, loamy, sandy")
    water_availability: str = Field("unknown", description="Example: low, medium, high")
    season: str = Field("unknown", description="Example: kharif, rabi, zaid")

    class Config:
        json_schema_extra = {
            "example": {
                "N": 90,
                "P": 42,
                "K": 43,
                "temperature": 21.0,
                "humidity": 82.0,
                "ph": 6.5,
                "rainfall": 203.0,
                "soil_type": "clay",
                "water_availability": "high",
                "season": "kharif",
            }
        }


def request_to_dict(payload: CropPredictionRequest) -> dict[str, Any]:
    if hasattr(payload, "model_dump"):
        return payload.model_dump()
    return payload.dict()


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok", "message": "Crop ML API is running"}


@app.post("/predict-crop")
def predict_crop(payload: CropPredictionRequest) -> dict[str, Any]:
    try:
        recommendations = predict_top_crops(request_to_dict(payload), top_k=5)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"top_5_recommendations": recommendations}

