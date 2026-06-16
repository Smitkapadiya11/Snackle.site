import pandas as pd


def resample_weekly(series: pd.Series) -> pd.Series:
    if len(series) < 7:
        return series
    return series.resample("W").sum()
