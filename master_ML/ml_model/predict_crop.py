from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib

from ml_model.data_utils import MODEL_PATH, build_input_frame, display_crop_name


def format_percentage(probability: float) -> str:
    percentage = round(probability * 100, 1)
    if percentage.is_integer():
        return f"{int(percentage)}%"
    return f"{percentage}%"


@lru_cache(maxsize=1)
def load_model(model_path: str | Path = MODEL_PATH) -> dict[str, Any]:
    model_path = Path(model_path)
    if not model_path.exists():
        raise FileNotFoundError(
            f"Trained model not found at {model_path}. "
            "Run: python -m ml_model.train_crop_model"
        )
    return joblib.load(model_path)


def predict_top_crops(input_data: dict[str, Any], top_k: int = 5) -> list[dict[str, Any]]:
    """Return the top crop recommendations with model probability scores."""
    if top_k < 1:
        raise ValueError("top_k must be at least 1.")

    artifact = load_model()
    model = artifact["model"]
    label_encoder = artifact["label_encoder"]

    input_frame = build_input_frame(input_data)
    probabilities = model.predict_proba(input_frame)[0]
    class_ids = model.named_steps["classifier"].classes_

    top_indices = probabilities.argsort()[::-1][:top_k]
    recommendations: list[dict[str, Any]] = []

    for rank, probability_index in enumerate(top_indices, start=1):
        encoded_class = int(class_ids[probability_index])
        crop_name = label_encoder.inverse_transform([encoded_class])[0]
        probability = float(probabilities[probability_index])
        recommendations.append(
            {
                "rank": rank,
                "crop": display_crop_name(crop_name),
                "suitability": format_percentage(probability),
                "probability": round(probability, 4),
            }
        )

    return recommendations


if __name__ == "__main__":
    sample_input = {
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
    for item in predict_top_crops(sample_input):
        print(item)
