import pandas as pd
import yfinance as yf
from cache.market_data_cache import get_cached, set_cached

def fetch_ohlcv(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    cached = get_cached(ticker, start_date, end_date)
    if cached is not None:
        return cached
    df = _fetch_from_yfinance(ticker, start_date, end_date)
    set_cached(ticker, start_date, end_date, df)
    return df

def _fetch_from_yfinance(ticker: str, start: str, end: str) -> pd.DataFrame:
    raw = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
    if raw.empty:
        raise ValueError(f"No data found for {ticker}")
    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.droplevel(1)
    df = raw[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.columns = ["open", "high", "low", "close", "volume"]
    return df

def search_tickers(query: str) -> list[dict]:
    ticker = yf.Ticker(query.upper())
    info = ticker.info
    return [{"symbol": query.upper(), "name": info.get("longName", query.upper())}]
