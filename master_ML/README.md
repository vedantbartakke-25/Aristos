# Crop Decision Intelligence System - ML Backend

This folder contains only the ML model and FastAPI backend for crop recommendation.

The model predicts the Top 5 most suitable crops based on soil nutrients, weather, and field conditions.

## Folder Location

All ML/backend files are now grouped inside:

```text
BfB/
`-- master_ML/
```

If you are at the repository root, first move into the ML folder:

```bash
cd master_ML
```

All commands below should be run from inside `master_ML`.

## Current Scope

Implemented:

- Dataset loading and cleaning
- Model training and comparison
- Top 5 crop prediction with suitability percentage
- Saved trained model using `joblib`
- FastAPI backend with `/predict-crop` endpoint

Not implemented yet:

- Frontend
- Login system
- OpenWeather API integration
- Soil Health Card upload parser
- Market/profit filtering
- AI agent layer

## Input Features

The API accepts:

- `N` - Nitrogen
- `P` - Phosphorus
- `K` - Potassium
- `temperature`
- `humidity`
- `ph`
- `rainfall`
- `soil_type`
- `water_availability`
- `season`

Important: the provided crop dataset currently contains only:

- `N`
- `P`
- `K`
- `temperature`
- `humidity`
- `ph`
- `rainfall`
- `label`

So `soil_type`, `water_availability`, and `season` are accepted by the API, but they do not yet influence predictions unless these columns are added to the training dataset.

## Project Structure

```text
BfB/
`-- master_ML/
    |-- api/
    |   `-- main.py
    |-- dataset/
    |   `-- crop_recommendation_dataset.xlsx
    |-- ml_model/
    |   |-- __init__.py
    |   |-- data_utils.py
    |   |-- predict_crop.py
    |   `-- train_crop_model.py
    |-- models/
    |   |-- crop_recommendation_model.joblib
    |   `-- crop_model_metrics.json
    |-- .gitignore
    |-- README.md
    `-- requirements.txt
```

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
```

## Train the Model

Run:

```bash
python -m ml_model.train_crop_model
```

The training script compares:

- Decision Tree
- Random Forest
- Logistic Regression
- XGBoost

The best model is saved to:

```text
models/crop_recommendation_model.joblib
```

Model metrics are saved to:

```text
models/crop_model_metrics.json
```

## Run Prediction from Python

```bash
python -m ml_model.predict_crop
```

## Run the FastAPI Server

```bash
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Open API docs:

```text
http://127.0.0.1:8000/docs
```

## API Endpoint

```text
POST /predict-crop
```

Example request:

```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 21.0,
  "humidity": 82.0,
  "ph": 6.5,
  "rainfall": 203.0,
  "soil_type": "clay",
  "water_availability": "high",
  "season": "kharif"
}
```

Example response:

```json
{
  "top_5_recommendations": [
    {
      "rank": 1,
      "crop": "Rice",
      "suitability": "95%",
      "probability": 0.95
    },
    {
      "rank": 2,
      "crop": "Jute",
      "suitability": "4%",
      "probability": 0.04
    },
    {
      "rank": 3,
      "crop": "Maize",
      "suitability": "0.3%",
      "probability": 0.0033
    },
    {
      "rank": 4,
      "crop": "Cotton",
      "suitability": "0.3%",
      "probability": 0.0033
    },
    {
      "rank": 5,
      "crop": "Papaya",
      "suitability": "0.3%",
      "probability": 0.0033
    }
  ]
}
```

## Current Best Model

Latest metrics:

- Accuracy: `99.32%`
- Macro F1: `99.32%`
- Top-5 Accuracy: `100%`


