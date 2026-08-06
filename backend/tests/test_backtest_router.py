import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from main import app
import services.backtest_service as backtest_service

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
    monkeypatch.setattr(backtest_service, "fetch_ohlcv", lambda ticker, start, end: _synthetic_ohlcv())


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


def _compare_payload(tickers):
    return {
        "tickers": tickers,
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


def test_compare_backtest_runs_same_strategy_across_tickers():
    headers = _auth_headers()
    resp = client.post("/backtest/compare", json=_compare_payload(["AAPL", "MSFT", "GOOGL"]), headers=headers)
    assert resp.status_code == 200, resp.text
    results = resp.json()["results"]
    assert [r["ticker"] for r in results] == ["AAPL", "MSFT", "GOOGL"]
    for r in results:
        assert r["error"] is None
        assert r["metrics"]["num_trades"] >= 1


def test_compare_backtest_one_bad_ticker_does_not_fail_the_others(monkeypatch):
    headers = _auth_headers()

    def flaky_fetch(ticker, start, end):
        if ticker == "BADTICKER":
            raise ValueError(f"No data found for {ticker}")
        return _synthetic_ohlcv()

    monkeypatch.setattr(backtest_service, "fetch_ohlcv", flaky_fetch)
    resp = client.post("/backtest/compare", json=_compare_payload(["AAPL", "BADTICKER"]), headers=headers)
    assert resp.status_code == 200, resp.text
    results = {r["ticker"]: r for r in resp.json()["results"]}
    assert results["AAPL"]["error"] is None
    assert results["AAPL"]["metrics"] is not None
    assert results["BADTICKER"]["error"] == "No data found for BADTICKER"
    assert results["BADTICKER"]["metrics"] is None


def test_compare_backtest_rejects_too_many_tickers():
    headers = _auth_headers()
    resp = client.post("/backtest/compare", json=_compare_payload(["A", "B", "C", "D", "E", "F"]), headers=headers)
    assert resp.status_code == 400


def test_compare_backtest_requires_auth():
    resp = client.post("/backtest/compare", json=_compare_payload(["AAPL"]))
    assert resp.status_code == 401
