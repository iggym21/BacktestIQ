import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from main import app
import services.backtest_service as backtest_service
from services.backtest_service import run_walk_forward, WalkForwardConfigError
from schemas.backtest import StrategyPayload

client = TestClient(app)


def _synthetic_ohlcv(n=300, seed=3):
    np.random.seed(seed)
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5) + np.linspace(0, 30, n)
    return pd.DataFrame(
        {"open": prices, "high": prices * 1.01, "low": prices * 0.99,
         "close": prices, "volume": np.ones(n) * 1e6},
        index=pd.date_range("2020-01-06", periods=n, freq="B"),
    )


@pytest.fixture(autouse=True)
def stub_market_data(monkeypatch):
    monkeypatch.setattr(backtest_service, "fetch_ohlcv", lambda ticker, start, end: _synthetic_ohlcv())


def _crossover_strategy():
    return StrategyPayload(
        mode="visual",
        rules={
            "entry": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_above",
                       "target": {"indicator": "SMA", "params": {"period": 30}}}],
            "exit": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_below",
                      "target": {"indicator": "SMA", "params": {"period": 30}}}],
            "logic": "AND",
        },
    )


def test_walk_forward_produces_one_result_per_fold():
    strategy = _crossover_strategy()
    folds = run_walk_forward("SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY", folds=4)
    assert [f["fold"] for f in folds] == [1, 2, 3, 4]
    for f in folds:
        assert f["error"] is None
        assert f["metrics"] is not None


def test_walk_forward_folds_are_contiguous_and_cover_the_full_range():
    strategy = _crossover_strategy()
    folds = run_walk_forward("SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY", folds=3)
    assert folds[0]["start_date"] == "2021-01-01"
    assert folds[-1]["end_date"] == "2022-01-01"
    for prev, nxt in zip(folds, folds[1:]):
        assert prev["end_date"] == nxt["start_date"]


def test_walk_forward_rejects_too_few_folds():
    strategy = _crossover_strategy()
    with pytest.raises(WalkForwardConfigError):
        run_walk_forward("SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY", folds=1)


def test_walk_forward_rejects_too_many_folds():
    strategy = _crossover_strategy()
    with pytest.raises(WalkForwardConfigError):
        run_walk_forward("SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY", folds=13)


def test_walk_forward_rejects_range_shorter_than_fold_count():
    strategy = _crossover_strategy()
    with pytest.raises(WalkForwardConfigError):
        run_walk_forward("SPY", "2021-01-01", "2021-01-02", strategy, 10000, "SPY", folds=8)


def test_walk_forward_rejects_end_before_start():
    strategy = _crossover_strategy()
    with pytest.raises(WalkForwardConfigError):
        run_walk_forward("SPY", "2022-01-01", "2021-01-01", strategy, 10000, "SPY", folds=2)


def _auth_headers():
    email = "walkforward@test.com"
    client.post("/auth/register", json={"email": email, "password": "password123"})
    resp = client.post("/auth/login", data={"username": email, "password": "password123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _walk_forward_payload(**overrides):
    payload = {
        "ticker": "SPY", "start_date": "2021-01-01", "end_date": "2022-01-01",
        "benchmark": "SPY", "initial_capital": 10000, "folds": 4,
        "strategy": {
            "mode": "visual",
            "rules": {
                "entry": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_above",
                           "target": {"indicator": "SMA", "params": {"period": 30}}}],
                "exit": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_below",
                          "target": {"indicator": "SMA", "params": {"period": 30}}}],
                "logic": "AND",
            },
        },
    }
    payload.update(overrides)
    return payload


def test_walk_forward_endpoint_returns_folds():
    headers = _auth_headers()
    resp = client.post("/backtest/walkforward", json=_walk_forward_payload(), headers=headers)
    assert resp.status_code == 200, resp.text
    folds = resp.json()["folds"]
    assert len(folds) == 4
    assert all(f["metrics"] is not None for f in folds)


def test_walk_forward_endpoint_rejects_bad_config():
    headers = _auth_headers()
    resp = client.post("/backtest/walkforward", json=_walk_forward_payload(folds=1), headers=headers)
    assert resp.status_code == 400


def test_walk_forward_endpoint_requires_auth():
    resp = client.post("/backtest/walkforward", json=_walk_forward_payload())
    assert resp.status_code == 401
