from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Dict, Any

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class FootfallModel:
    beta: np.ndarray
    feature_columns: list[str]  # X columns (excluding intercept)
    y_min: float
    y_max: float
    y_mean: float
    y_std: float


_MODEL: Optional[FootfallModel] = None


def _project_root_dir() -> Path:
    # predictor.py lives in backend/, datasets are in backend/datasets/
    return Path(__file__).resolve().parent


def train_model() -> FootfallModel:
    base_dir = _project_root_dir()

    footfall_files = (base_dir / "datasets" / "footfall").glob("*.csv")
    footfall_dfs = []
    for file in footfall_files:
        df = pd.read_csv(file)
        footfall_dfs.append(df)

    if not footfall_dfs:
        raise FileNotFoundError("No footfall CSV files found in backend/datasets/footfall")

    footfall = pd.concat(footfall_dfs, ignore_index=True)

    footfall["datetime"] = pd.to_datetime(
        footfall["Date"].astype(str) + " " + footfall["Hour"].astype(str),
        format="%d-%b-%y %H:%M",
        dayfirst=True,
        errors="coerce",
    )
    footfall.drop(columns=["Date", "Hour"], inplace=True)

    weather_file = base_dir / "datasets" / "weather" / "weather.csv"
    weather = pd.read_csv(weather_file, skiprows=2)
    weather["datetime"] = pd.to_datetime(weather["time"])
    weather.drop(columns=["time"], inplace=True)

    data = footfall.merge(weather, on="datetime", how="inner", validate="many_to_one")

    hourly = (
        data.groupby("datetime", as_index=False)
        .agg(
            InCount=("InCount", "sum"),
            OutCount=("OutCount", "sum"),
            temperature=("temperature_2m (°C)", "mean"),
            precipitation=("precipitation (mm)", "mean"),
            cloud_cover=("cloud_cover (%)", "mean"),
        )
        .sort_values("datetime")
    )
    hourly["hour"] = hourly["datetime"].dt.hour
    hourly["dow"] = hourly["datetime"].dt.dayofweek  # Monday=0 ... Sunday=6

    dow_encodings = pd.get_dummies(hourly["dow"], prefix="dow", drop_first=True)

    X = pd.concat(
        [
            hourly[["temperature", "precipitation", "cloud_cover", "hour"]],
            dow_encodings,
        ],
        axis=1,
    ).astype(float)

    y = hourly["InCount"].astype(float)

    mask = X.notna().all(axis=1) & y.notna()
    X = X.loc[mask]
    y = y.loc[mask]

    n = len(X)
    if n < 20:
        raise ValueError("Not enough data for training!")

    split_idx = int(0.8 * n)
    X_train = X.iloc[:split_idx]
    y_train = y.iloc[:split_idx]

    X_train_i = np.c_[np.ones(len(X_train)), X_train.to_numpy()]
    beta, *_ = np.linalg.lstsq(X_train_i, y_train.to_numpy(), rcond=None)

    y_np = y.to_numpy()
    y_std = float(np.std(y_np)) if float(np.std(y_np)) != 0.0 else 1.0

    return FootfallModel(
        beta=beta,
        feature_columns=X.columns.tolist(),
        y_min=float(np.min(y_np)),
        y_max=float(np.max(y_np)),
        y_mean=float(np.mean(y_np)),
        y_std=y_std,
    )


def get_model() -> FootfallModel:
    global _MODEL
    if _MODEL is None:
        _MODEL = train_model()
    return _MODEL


def _build_feature_row(
    model: FootfallModel,
    temperature: float,
    precipitation: float,
    cloud_cover: float,
    hour: int,
    dow: int,
) -> np.ndarray:
    base: Dict[str, float] = {
        "temperature": float(temperature),
        "precipitation": float(precipitation),
        "cloud_cover": float(cloud_cover),
        "hour": float(hour),
    }

    # Because we trained with drop_first=True, Monday(0) is baseline (no dummy column).
    # Dummy columns in training will look like: dow_1 ... dow_6 if they exist in data.
    for d in range(1, 7):
        base[f"dow_{d}"] = 1.0 if int(dow) == d else 0.0

    row = np.array([base.get(col, 0.0) for col in model.feature_columns], dtype=float)
    return row


def predict(
    temperature: float,
    precipitation: float,
    cloud_cover: float,
    hour: int,
    dow: int,
) -> Dict[str, Any]:
    model = get_model()

    x = _build_feature_row(
        model=model,
        temperature=temperature,
        precipitation=precipitation,
        cloud_cover=cloud_cover,
        hour=hour,
        dow=dow,
    )
    x_i = np.r_[1.0, x]  # intercept
    pred_incount = float(x_i @ model.beta)

    # Convert predicted footfall into a 0..1 "likelihood" score.
    # Prefer min-max scaling based on training distribution; fallback to z-score sigmoid if needed.
    denom = (model.y_max - model.y_min)
    if denom > 0:
        likelihood = (pred_incount - model.y_min) / denom
    else:
        z = (pred_incount - model.y_mean) / model.y_std
        likelihood = 1.0 / (1.0 + float(np.exp(-z)))

    likelihood = float(np.clip(likelihood, 0.0, 1.0))

    return {
        "predicted_incount": pred_incount,
        "likelihood": likelihood,
        "model_info": {
            "y_min": model.y_min,
            "y_max": model.y_max,
        },
    }
