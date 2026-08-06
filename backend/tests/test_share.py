import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from main import app
import services.backtest_service as backtest_service

client = TestClient(app)


def _synthetic_ohlcv(n=60, seed=5):
    np.random.seed(seed)
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5) + np.linspace(0, 20, n)
    return pd.DataFrame(
        {"open": prices, "high": prices * 1.01, "low": prices * 0.99,
         "close": prices, "volume": np.ones(n) * 1e6},
        index=pd.date_range("2022-01-03", periods=n, freq="B"),
    )


@pytest.fixture(autouse=True)
def stub_market_data(monkeypatch):
    monkeypatch.setattr(backtest_service, "fetch_ohlcv", lambda ticker, start, end: _synthetic_ohlcv())


def _auth_headers(email="sharer@test.com"):
    client.post("/auth/register", json={"email": email, "password": "password123"})
    resp = client.post("/auth/login", data={"username": email, "password": "password123"})
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _run_backtest(headers):
    payload = {
        "ticker": "SPY", "start_date": "2022-01-01", "end_date": "2022-03-01",
        "benchmark": "SPY", "initial_capital": 10000,
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
    return resp.json()


def test_run_backtest_returns_a_run_id():
    headers = _auth_headers()
    body = _run_backtest(headers)
    assert body["run_id"]


def test_share_generates_a_token_and_public_endpoint_serves_it():
    headers = _auth_headers("sharer2@test.com")
    run = _run_backtest(headers)

    share_resp = client.post(f"/backtest/runs/{run['run_id']}/share", headers=headers)
    assert share_resp.status_code == 200, share_resp.text
    token = share_resp.json()["share_token"]
    assert token

    public_resp = client.get(f"/public/results/{token}")
    assert public_resp.status_code == 200, public_resp.text
    body = public_resp.json()
    assert body["ticker"] == "SPY"
    assert body["metrics"] == run["metrics"]
    assert body["equity_curve"] == run["equity_curve"]
    assert body["trades"] == run["trades"]
    # No auth header at all was sent — this is a genuinely public endpoint.


def test_share_is_idempotent_returns_same_token():
    headers = _auth_headers("sharer3@test.com")
    run = _run_backtest(headers)

    first = client.post(f"/backtest/runs/{run['run_id']}/share", headers=headers).json()
    second = client.post(f"/backtest/runs/{run['run_id']}/share", headers=headers).json()
    assert first["share_token"] == second["share_token"]


def test_share_requires_auth():
    resp = client.post("/backtest/runs/some-id/share")
    assert resp.status_code == 401


def test_share_rejects_run_not_found():
    headers = _auth_headers("sharer4@test.com")
    resp = client.post("/backtest/runs/nonexistent-id/share", headers=headers)
    assert resp.status_code == 404


def test_share_rejects_run_owned_by_another_user():
    headers_a = _auth_headers("owner-a@test.com")
    headers_b = _auth_headers("owner-b@test.com")
    run = _run_backtest(headers_a)

    resp = client.post(f"/backtest/runs/{run['run_id']}/share", headers=headers_b)
    assert resp.status_code == 404


def test_public_endpoint_returns_404_for_unknown_token():
    resp = client.get("/public/results/not-a-real-token")
    assert resp.status_code == 404


def test_unshared_run_is_not_publicly_accessible():
    """A run that was never explicitly shared has no token, and there's no
    other way to reach its data through the public endpoint."""
    headers = _auth_headers("private@test.com")
    run = _run_backtest(headers)
    resp = client.get(f"/public/results/{run['run_id']}")
    assert resp.status_code == 404
