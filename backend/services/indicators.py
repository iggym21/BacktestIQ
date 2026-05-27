import pandas as pd
import numpy as np

def calculate_sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(window=period).mean()

def calculate_ema(close: pd.Series, period: int) -> pd.Series:
    return close.ewm(span=period, adjust=False).mean()

def calculate_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))

def calculate_macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = calculate_ema(close, fast)
    ema_slow = calculate_ema(close, slow)
    macd_line = ema_fast - ema_slow
    signal_line = calculate_ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

def calculate_bollinger(close: pd.Series, period: int = 20, std_dev: float = 2):
    mid = calculate_sma(close, period)
    std = close.rolling(period).std()
    return mid + std_dev * std, mid, mid - std_dev * std

def add_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    c = df["close"]
    df["sma_20"] = calculate_sma(c, 20)
    df["sma_50"] = calculate_sma(c, 50)
    df["sma_200"] = calculate_sma(c, 200)
    df["ema_12"] = calculate_ema(c, 12)
    df["ema_26"] = calculate_ema(c, 26)
    df["rsi_14"] = calculate_rsi(c, 14)
    df["macd"], df["macd_signal"], df["macd_hist"] = calculate_macd(c)
    df["bb_upper"], df["bb_mid"], df["bb_lower"] = calculate_bollinger(c)
    return df
