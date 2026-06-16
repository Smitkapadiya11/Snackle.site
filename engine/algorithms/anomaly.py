"""
Sales Anomaly Detection
Methods:
  1. Isolation Forest (ML-based)
  2. CUSUM — Cumulative Sum control chart for change point detection
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from models.schemas import AnomalyResult, SalesRecord
from algorithms.demand_forecast import prepare_daily_series


def detect_anomalies_isolation_forest(series: pd.Series) -> tuple[list[str], list[float], list[str]]:
    """Isolation Forest anomaly detection."""
    if len(series) < 10:
        return [], [], []

    values = series.values.reshape(-1, 1)

    model = IsolationForest(
        contamination=0.05,
        random_state=42,
        n_estimators=100,
    )
    predictions = model.fit_predict(values)
    scores = model.score_samples(values)

    anomaly_dates = []
    anomaly_scores = []
    directions = []

    mean_val = float(series.mean())

    for i, (pred, score) in enumerate(zip(predictions, scores)):
        if pred == -1:
            date = str(series.index[i].date())
            direction = "SPIKE" if series.iloc[i] > mean_val * 1.5 else "DROP"
            anomaly_dates.append(date)
            anomaly_scores.append(round(float(-score), 3))
            directions.append(direction)

    return anomaly_dates, anomaly_scores, directions


def detect_change_point_cusum(series: pd.Series) -> tuple[str | None, str | None]:
    """CUSUM control chart for demand level shifts."""
    if len(series) < 20:
        return None, None

    mu_0 = float(series.mean())
    sigma = float(series.std()) + 1e-6
    k = 0.5 * sigma
    h = 4.0 * sigma

    S_high = 0.0
    S_low = 0.0

    change_point_date = None
    change_direction = None

    for date, val in series.items():
        S_high = max(0, S_high + (val - mu_0 - k))
        S_low = max(0, S_low - (val - mu_0 + k))

        if S_high > h and change_point_date is None:
            change_point_date = str(date.date())
            change_direction = "INCREASE"
        elif S_low > h and change_point_date is None:
            change_point_date = str(date.date())
            change_direction = "DECREASE"

    return change_point_date, change_direction


def analyze_anomalies(sales_history: list[SalesRecord]) -> AnomalyResult:
    """Full anomaly analysis pipeline."""
    series = prepare_daily_series(sales_history)

    if len(series) < 10:
        return AnomalyResult(
            has_anomalies=False, anomaly_dates=[], anomaly_scores=[],
            anomaly_direction=[], latest_change_point=None,
            change_point_direction=None,
            adjusted_avg_daily_sales=float(series.mean()) if len(series) > 0 else 0,
        )

    dates, scores, directions = detect_anomalies_isolation_forest(series)
    cp_date, cp_direction = detect_change_point_cusum(series)

    if dates:
        anomaly_idx = pd.DatetimeIndex([pd.to_datetime(d) for d in dates])
        clean_series = series.drop(labels=anomaly_idx, errors="ignore")
    else:
        clean_series = series

    adjusted_avg = float(clean_series.mean()) if len(clean_series) > 0 else float(series.mean())

    return AnomalyResult(
        has_anomalies=len(dates) > 0,
        anomaly_dates=dates[:10],
        anomaly_scores=scores[:10],
        anomaly_direction=directions[:10],
        latest_change_point=cp_date,
        change_point_direction=cp_direction,
        adjusted_avg_daily_sales=round(adjusted_avg, 3),
    )
