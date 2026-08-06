import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from main import app
import routers.backtest as backtest_router

client = TestClient(app)


def _synthetic_ohlcv(n=60, seed=1):
    np.random.seed(seed)
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5) + np.linspace(0, 20, n)
    return pd.DataFrame(
        {"open": prices, "high": prices * 1.01, "low": prices * 0.99,
         "close": prices, "volume": np.ones(n) * 1e6},
        index=pd.date_range("2022-01-03", periods=n, freq="B"),
    )


@pytest.fixture(autouse=True)
def stub_market_data(monkeypatch):
    """The backtest endpoint should never hit the real network in tests."""
    monkeypatch.setattr(backtest_router, "fetch_ohlcv", lambda ticker, start, end: _synthetic_ohlcv())


def _auth_headers():
    email = "backtester@test.com"
    client.post("/auth/register", json={"email": email, "password": "password123"})
    resp = client.post("/auth/login", data={"username": email, "password": "password123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_run_backtest_end_to_end_returns_200():
    """Regression test for the full golden path: string dates from the request
    body used to be passed straight into a SQLAlchemy Date column and crash
    with 'SQLite Date type only accepts Python date objects as input'."""
    headers = _auth_headers()
    payload = {
        "ticker": "SPY",
        "start_date": "2022-01-01",
        "end_date": "2022-03-01",
        "benchmark": "SPY",
        "initial_capital": 10000,
        "strategy": {
            "mode": "visual",
            "rules": {
                "entry": [{"indicator": "CLOSE", "params": {}, "operator": ">", "target": {"value": 0}}],
                "exit": [{"indicator": "CLOSE", "params": {}, "operator": "<", "target": {"value": 0}}],
                "logic": "AND",
            },
        },
    }
    resp = client.post("/backtest/run", json=payload, headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "metrics" in body
    assert "equity_curve" in body
    assert body["equity_curve"][0]["benchmark_equity"] == pytest.approx(10000, rel=0.01)
    # Entry rule (CLOSE > 0) fires on bar one, so the strategy should be fully
    # invested and its equity curve should track the benchmark's buy-and-hold curve.
    assert body["metrics"]["num_trades"] >= 1


def test_run_backtest_requires_auth():
    payload = {
        "ticker": "SPY", "start_date": "2022-01-01", "end_date": "2022-03-01",
        "strategy": {"mode": "visual", "rules": {"entry": [], "exit": [], "logic": "AND"}},
    }
    resp = client.post("/backtest/run", json=payload)
    assert resp.status_code == 401
