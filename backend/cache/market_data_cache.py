import sqlite3
import json
import pandas as pd
from datetime import datetime
from config import settings

def _get_conn():
    conn = sqlite3.connect(settings.cache_db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ohlcv_cache (
            ticker TEXT, start_date TEXT, end_date TEXT,
            data TEXT, cached_at TEXT,
            PRIMARY KEY (ticker, start_date, end_date)
        )
    """)
    conn.commit()
    return conn

def get_cached(ticker: str, start: str, end: str) -> pd.DataFrame | None:
    conn = _get_conn()
    row = conn.execute(
        "SELECT data FROM ohlcv_cache WHERE ticker=? AND start_date=? AND end_date=?",
        (ticker, start, end)
    ).fetchone()
    conn.close()
    if not row:
        return None
    records = json.loads(row[0])
    df = pd.DataFrame(records)
    df.index = pd.to_datetime(df["date"])
    return df.drop(columns=["date"])

def set_cached(ticker: str, start: str, end: str, df: pd.DataFrame):
    records = df.copy()
    records["date"] = records.index.strftime("%Y-%m-%d")
    data = records.reset_index(drop=True).to_json(orient="records")
    conn = _get_conn()
    conn.execute(
        "INSERT OR REPLACE INTO ohlcv_cache VALUES (?,?,?,?,?)",
        (ticker, start, end, data, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
