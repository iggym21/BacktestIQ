import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from main import app
import services.backtest_service as backtest_service
from services.backtest_service import run_parameter_sweep, SweepConfigError
from schemas.backtest import StrategyPayload

client = TestClient(app)


def _synthetic_ohlcv(n=300, seed=7):
    np.random.seed(seed)
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5) + np.linspace(0, 30, n)
    return pd.DataFrame(
        {"open": prices, "high": prices * 1.01, "low": prices * 0.99,
         "close": prices, "volume": np.ones(n) * 1e6},
        index=pd.date_range("2021-01-04", periods=n, freq="B"),
    )


@pytest.fixture(autouse=True)
def stub_market_data(monkeypatch):
    monkeypatch.setattr(backtest_service, "fetch_ohlcv", lambda ticker, start, end: _synthetic_ohlcv())


def _sma_crossover_strategy():
    return StrategyPayload(
        mode="visual",
        rules={
            "entry": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_above",
                       "target": {"indicator": "SMA", "params": {"period": 50}}}],
            "exit": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_below",
                      "target": {"indicator": "SMA", "params": {"period": 50}}}],
            "logic": "AND",
        },
    )


def test_sweep_runs_one_point_per_value():
    strategy = _sma_crossover_strategy()
    points = run_parameter_sweep(
        "SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY",
        rule_group="entry", rule_index=0, param="period", start=10, stop=30, step=10,
    )
    assert [p["value"] for p in points] == [10, 20, 30]
    for p in points:
        assert p["error"] is None
        assert p["metrics"] is not None


def test_sweep_does_not_mutate_original_strategy():
    """Regression guard: each point must run against an independent copy of
    the rule tree, or a later sweep value would leak into earlier results."""
    strategy = _sma_crossover_strategy()
    original_period = strategy.rules.entry[0].params["period"]
    run_parameter_sweep(
        "SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY",
        rule_group="entry", rule_index=0, param="period", start=5, stop=15, step=5,
    )
    assert strategy.rules.entry[0].params["period"] == original_period


def test_sweep_rejects_code_mode():
    strategy = StrategyPayload(mode="code", code="def generate_signals(df):\n    return df['close'] * 0")
    with pytest.raises(SweepConfigError):
        run_parameter_sweep(
            "SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY",
            rule_group="entry", rule_index=0, param="period", start=10, stop=20, step=10,
        )


def test_sweep_rejects_unknown_param():
    strategy = _sma_crossover_strategy()
    with pytest.raises(SweepConfigError):
        run_parameter_sweep(
            "SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY",
            rule_group="entry", rule_index=0, param="not_a_real_param", start=10, stop=20, step=10,
        )


def test_sweep_rejects_out_of_range_rule_index():
    strategy = _sma_crossover_strategy()
    with pytest.raises(SweepConfigError):
        run_parameter_sweep(
            "SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY",
            rule_group="entry", rule_index=5, param="period", start=10, stop=20, step=10,
        )


def test_sweep_rejects_too_many_points():
    strategy = _sma_crossover_strategy()
    with pytest.raises(SweepConfigError):
        run_parameter_sweep(
            "SPY", "2021-01-01", "2022-01-01", strategy, 10000, "SPY",
            rule_group="entry", rule_index=0, param="period", start=1, stop=1000, step=1,
        )


def _auth_headers():
    email = "sweeper@test.com"
    client.post("/auth/register", json={"email": email, "password": "password123"})
    resp = client.post("/auth/login", data={"username": email, "password": "password123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _sweep_payload(**overrides):
    payload = {
        "ticker": "SPY", "start_date": "2021-01-01", "end_date": "2022-01-01",
        "benchmark": "SPY", "initial_capital": 10000,
        "strategy": {
            "mode": "visual",
            "rules": {
                "entry": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_above",
                           "target": {"indicator": "SMA", "params": {"period": 50}}}],
                "exit": [{"indicator": "SMA", "params": {"period": 10}, "operator": "crosses_below",
                          "target": {"indicator": "SMA", "params": {"period": 50}}}],
                "logic": "AND",
            },
        },
        "rule_group": "entry", "rule_index": 0, "param": "period",
        "start": 10, "stop": 30, "step": 10,
    }
    payload.update(overrides)
    return payload


def test_sweep_endpoint_returns_points():
    headers = _auth_headers()
    resp = client.post("/backtest/sweep", json=_sweep_payload(), headers=headers)
    assert resp.status_code == 200, resp.text
    points = resp.json()["points"]
    assert [p["value"] for p in points] == [10, 20, 30]
    assert all(p["metrics"] is not None for p in points)


def test_sweep_endpoint_rejects_bad_config():
    headers = _auth_headers()
    resp = client.post("/backtest/sweep", json=_sweep_payload(param="nonsense"), headers=headers)
    assert resp.status_code == 400


def test_sweep_endpoint_requires_auth():
    resp = client.post("/backtest/sweep", json=_sweep_payload())
    assert resp.status_code == 401
