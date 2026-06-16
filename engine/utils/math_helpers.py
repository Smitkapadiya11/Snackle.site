import numpy as np


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    if abs(denominator) < 1e-9:
        return default
    return float(numerator / denominator)


def clip_non_negative(values: np.ndarray) -> np.ndarray:
    return np.maximum(values, 0)
