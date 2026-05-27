import pytest
import pandas as pd
import numpy as np
from services.indicators import calculate_sma, calculate_ema, calculate_rsi, calculate_macd, calculate_bollinger

@pytest.fixture
def price_series():
    np.random.seed(42)
    prices = 100 + np.random.randn(300).cumsum()
    return pd.Series(prices, name="close")

def test_sma_length(price_series):
    sma = calculate_sma(price_series, 20)
    assert len(sma) == len(price_series)
    assert pd.isna(sma.iloc[18])
    assert not pd.isna(sma.iloc[19])

def test_ema_length(price_series):
    ema = calculate_ema(price_series, 20)
    assert len(ema) == len(price_series)

def test_rsi_range(price_series):
    rsi = calculate_rsi(price_series, 14)
    valid = rsi.dropna()
    assert (valid >= 0).all() and (valid <= 100).all()

def test_macd_returns_three_series(price_series):
    macd, signal, hist = calculate_macd(price_series)
    assert len(macd) == len(price_series)
    assert len(signal) == len(price_series)

def test_bollinger_bands(price_series):
    upper, mid, lower = calculate_bollinger(price_series, 20, 2)
    valid = ~(upper.isna() | mid.isna() | lower.isna())
    assert (upper[valid] >= mid[valid]).all()
    assert (mid[valid] >= lower[valid]).all()
