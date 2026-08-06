from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def _auth_headers():
    email = "exporter@test.com"
    client.post("/auth/register", json={"email": email, "password": "password123"})
    resp = client.post("/auth/login", data={"username": email, "password": "password123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _payload(ticker: str):
    return {
        "metrics": {"total_return": 0.1},
        "equity_curve": [],
        "trades": [],
        "ticker": ticker,
        "start_date": "2020-01-01",
        "end_date": "2023-12-31",
    }


def test_export_tearsheet_returns_pdf():
    headers = _auth_headers()
    resp = client.post("/export/tearsheet", json=_payload("SPY"), headers=headers)
    assert resp.status_code == 200
    assert resp.content.startswith(b"%PDF")
    assert resp.headers["content-disposition"] == "attachment; filename=tearsheet_SPY.pdf"


def test_export_tearsheet_sanitizes_ticker_in_filename_header():
    """ticker is free-form client input embedded directly in a response
    header — a value containing CR/LF or other header-breaking characters
    must never reach the raw header, since that's a response-splitting
    vector. A crafted ticker should still produce a valid PDF, just with a
    sanitized filename."""
    headers = _auth_headers()
    malicious_ticker = 'SPY"; evil=1\r\nX-Injected: yes'
    resp = client.post("/export/tearsheet", json=_payload(malicious_ticker), headers=headers)
    assert resp.status_code == 200
    assert resp.content.startswith(b"%PDF")
    assert "\r" not in resp.headers["content-disposition"]
    assert "\n" not in resp.headers["content-disposition"]
    assert "X-Injected" not in resp.headers
    assert resp.headers["content-disposition"] == "attachment; filename=tearsheet_SPYevil1X-Injectedyes.pdf"


def test_export_tearsheet_requires_auth():
    resp = client.post("/export/tearsheet", json=_payload("SPY"))
    assert resp.status_code == 401
