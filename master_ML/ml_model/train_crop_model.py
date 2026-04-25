from __future__ import annotations

import json
from datetime import datetime, timezone

import joblib
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, top_k_accuracy_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

from ml_model.data_utils import (
    ALL_FEATURES,
    CATEGORICAL_FEATURES,
    DEFAULT_DATASET_PATH,
    METRICS_PATH,
    MODEL_DIR,
    MODEL_PATH,
    NUMERIC_FEATURES,
    TARGET_COLUMN,
    load_and_clean_dataset,
)


def build_preprocessor() -> ColumnTransformer:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, NUMERIC_FEATURES),
            ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )


def candidate_models() -> dict[str, object]:
    models: dict[str, object] = {
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            class_weight="balanced",
            n_jobs=1,
        ),
        "Logistic Regression": LogisticRegression(
            max_iter=3000,
            class_weight="balanced",
            n_jobs=1,
        ),
    }

    try:
        from xgboost import XGBClassifier

        models["XGBoost"] = XGBClassifier(
            objective="multi:softprob",
            eval_metric="mlogloss",
            n_estimators=250,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=42,
            n_jobs=1,
        )
    except Exception as exc:  # pragma: no cover - depends on local install
        print(f"Skipping XGBoost because it is not available: {exc}")

    return models


def evaluate_model(
    name: str,
    classifier: object,
    X_train,
    X_test,
    y_train,
    y_test,
    labels: np.ndarray,
) -> tuple[Pipeline, dict[str, float | str]]:
    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("classifier", classifier),
        ]
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="accuracy")

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    metrics: dict[str, float | str] = {
        "model": name,
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "macro_f1": round(float(f1_score(y_test, y_pred, average="macro")), 4),
        "top_5_accuracy": round(
            float(top_k_accuracy_score(y_test, y_proba, k=5, labels=labels)),
            4,
        ),
        "cv_accuracy_mean": round(float(np.mean(cv_scores)), 4),
        "cv_accuracy_std": round(float(np.std(cv_scores)), 4),
    }
    return pipeline, metrics


def train_and_save_model(dataset_path=DEFAULT_DATASET_PATH) -> dict:
    df = load_and_clean_dataset(dataset_path)

    X = df[ALL_FEATURES]
    y_text = df[TARGET_COLUMN]

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_text)
    all_labels = np.arange(len(label_encoder.classes_))

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    results = []
    trained_pipelines: dict[str, Pipeline] = {}

    for name, classifier in candidate_models().items():
        print(f"Training {name}...")
        pipeline, metrics = evaluate_model(
            name,
            classifier,
            X_train,
            X_test,
            y_train,
            y_test,
            labels=all_labels,
        )
        results.append(metrics)
        trained_pipelines[name] = pipeline
        print(
            f"  accuracy={metrics['accuracy']} "
            f"top5={metrics['top_5_accuracy']} "
            f"cv={metrics['cv_accuracy_mean']} +/- {metrics['cv_accuracy_std']}"
        )

    # Reliability score favors models that perform well in cross-validation and
    # are stable across folds, then uses holdout accuracy as a tie-breaker.
    for result in results:
        result["selection_score"] = round(
            float(result["cv_accuracy_mean"]) - (0.5 * float(result["cv_accuracy_std"])),
            4,
        )

    best_result = sorted(
        results,
        key=lambda item: (
            float(item["selection_score"]),
            float(item["accuracy"]),
            float(item["macro_f1"]),
            float(item["top_5_accuracy"]),
        ),
        reverse=True,
    )[0]

    best_model_name = str(best_result["model"])
    best_pipeline = trained_pipelines[best_model_name]

    artifact = {
        "model": best_pipeline,
        "label_encoder": label_encoder,
        "features": ALL_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_column": TARGET_COLUMN,
        "metrics": results,
        "best_model": best_model_name,
        "dataset_path": str(dataset_path),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "note": (
            "The supplied crop dataset has no soil_type, water_availability, or "
            "season columns. The pipeline accepts these fields for API compatibility; "
            "they will start influencing predictions when included in the training data."
        ),
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)

    metrics_report = {
        key: value
        for key, value in artifact.items()
        if key not in {"model", "label_encoder"}
    }
    METRICS_PATH.write_text(json.dumps(metrics_report, indent=2), encoding="utf-8")

    print("\nModel comparison:")
    for result in sorted(results, key=lambda item: float(item["selection_score"]), reverse=True):
        print(
            f"- {result['model']}: accuracy={result['accuracy']}, "
            f"macro_f1={result['macro_f1']}, top5={result['top_5_accuracy']}, "
            f"cv={result['cv_accuracy_mean']} +/- {result['cv_accuracy_std']}"
        )

    print(f"\nBest model: {best_model_name}")
    print(f"Saved model: {MODEL_PATH}")
    print(f"Saved metrics: {METRICS_PATH}")
    return metrics_report


if __name__ == "__main__":
    train_and_save_model()
