import pytest
import pandas as pd
from services.data_service import fetch_ohlcv

def test_fetch_ohlcv_returns_dataframe():
    df = fetch_ohlcv("SPY", "2023-01-01", "2023-03-31")
    assert isinstance(df, pd.DataFrame)
    assert set(["open", "high", "low", "close", "volume"]).issubset(df.columns)
    assert len(df) > 0

def test_fetch_ohlcv_dates_in_range():
    df = fetch_ohlcv("SPY", "2023-01-01", "2023-01-31")
    assert df.index[0].date().isoformat() >= "2023-01-01"
    assert df.index[-1].date().isoformat() <= "2023-01-31"

def test_cache_returns_same_data_second_call():
    df1 = fetch_ohlcv("AAPL", "2023-01-01", "2023-06-30")
    df2 = fetch_ohlcv("AAPL", "2023-01-01", "2023-06-30")
    assert len(df1) == len(df2)
