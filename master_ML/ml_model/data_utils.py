from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_PATH = ROOT_DIR / "dataset" / "crop_recommendation_dataset.xlsx"
MODEL_DIR = ROOT_DIR / "models"
MODEL_PATH = MODEL_DIR / "crop_recommendation_model.joblib"
METRICS_PATH = MODEL_DIR / "crop_model_metrics.json"

TARGET_COLUMN = "crop"

NUMERIC_FEATURES = [
    "nitrogen",
    "phosphorus",
    "potassium",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]

CATEGORICAL_FEATURES = [
    "soil_type",
    "water_availability",
    "season",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

COLUMN_ALIASES = {
    "n": "nitrogen",
    "nitrogen": "nitrogen",
    "p": "phosphorus",
    "phosphorus": "phosphorus",
    "k": "potassium",
    "potassium": "potassium",
    "temp": "temperature",
    "temperature": "temperature",
    "humidity": "humidity",
    "ph": "ph",
    "p_h": "ph",
    "rainfall": "rainfall",
    "rain": "rainfall",
    "label": "crop",
    "crop": "crop",
    "crop_name": "crop",
    "soil": "soil_type",
    "soiltype": "soil_type",
    "soil_type": "soil_type",
    "water": "water_availability",
    "water_availability": "water_availability",
    "wateravailability": "water_availability",
    "season": "season",
}

INPUT_ALIASES = {
    "N": "nitrogen",
    "n": "nitrogen",
    "nitrogen": "nitrogen",
    "P": "phosphorus",
    "p": "phosphorus",
    "phosphorus": "phosphorus",
    "K": "potassium",
    "k": "potassium",
    "potassium": "potassium",
    "temperature": "temperature",
    "temp": "temperature",
    "humidity": "humidity",
    "ph": "ph",
    "pH": "ph",
    "PH": "ph",
    "rainfall": "rainfall",
    "rain": "rainfall",
    "soil_type": "soil_type",
    "soilType": "soil_type",
    "soil": "soil_type",
    "water_availability": "water_availability",
    "waterAvailability": "water_availability",
    "water": "water_availability",
    "season": "season",
}


def normalize_name(value: str) -> str:
    """Convert spreadsheet/API names into simple snake_case keys."""
    cleaned = str(value).strip()
    cleaned = re.sub(r"[^0-9a-zA-Z]+", "_", cleaned)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned.lower()


def canonicalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed = {}
    for column in df.columns:
        normalized = normalize_name(column)
        renamed[column] = COLUMN_ALIASES.get(normalized, normalized)
    return df.rename(columns=renamed)


def load_and_clean_dataset(dataset_path: str | Path = DEFAULT_DATASET_PATH) -> pd.DataFrame:
    """Load the Excel dataset and return a clean training dataframe."""
    dataset_path = Path(dataset_path)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")

    df = pd.read_excel(dataset_path)
    df = canonicalize_columns(df)

    required_columns = NUMERIC_FEATURES + [TARGET_COLUMN]
    missing = [column for column in required_columns if column not in df.columns]
    if missing:
        raise ValueError(
            "Dataset is missing required columns: "
            + ", ".join(missing)
            + ". Expected at least N, P, K, temperature, humidity, ph, rainfall, label/crop."
        )

    for feature in NUMERIC_FEATURES:
        df[feature] = pd.to_numeric(df[feature], errors="coerce")

    for feature in CATEGORICAL_FEATURES:
        if feature not in df.columns:
            # The provided dataset does not include these fields. Keeping them as
            # constants lets the API accept them now and learn from them later if
            # a richer dataset is supplied.
            df[feature] = "unknown"
        df[feature] = (
            df[feature]
            .fillna("unknown")
            .astype(str)
            .str.strip()
            .str.lower()
            .replace("", "unknown")
        )

    df[TARGET_COLUMN] = (
        df[TARGET_COLUMN]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.lower()
    )

    df = df.dropna(subset=NUMERIC_FEATURES)
    df = df[df[TARGET_COLUMN] != ""]
    df = df.drop_duplicates().reset_index(drop=True)
    return df[ALL_FEATURES + [TARGET_COLUMN]]


def build_input_frame(input_data: dict[str, Any]) -> pd.DataFrame:
    """Validate one request payload and convert it to the model feature frame."""
    canonical: dict[str, Any] = {}
    for key, value in input_data.items():
        mapped_key = INPUT_ALIASES.get(key, INPUT_ALIASES.get(normalize_name(key), normalize_name(key)))
        canonical[mapped_key] = value

    missing = [feature for feature in NUMERIC_FEATURES if feature not in canonical]
    if missing:
        raise ValueError(f"Missing required numeric input(s): {', '.join(missing)}")

    row: dict[str, Any] = {}
    for feature in NUMERIC_FEATURES:
        try:
            row[feature] = float(canonical[feature])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Input '{feature}' must be a number.") from exc

    for feature in CATEGORICAL_FEATURES:
        value = canonical.get(feature, "unknown")
        if value is None or str(value).strip() == "":
            value = "unknown"
        row[feature] = str(value).strip().lower()

    return pd.DataFrame([row], columns=ALL_FEATURES)


def display_crop_name(crop: str) -> str:
    return str(crop).replace("_", " ").title()

