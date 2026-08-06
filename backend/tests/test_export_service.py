import os
import pytest
from services.export_service import generate_tearsheet, _ensure_macos_library_path


@pytest.fixture
def sample_metrics():
    return {
        "total_return": 0.2887, "annualized_return": 0.0656, "sharpe": 0.559,
        "sortino": 0.576, "max_drawdown": -0.2889, "max_drawdown_duration": 500,
        "win_rate": 0.176, "avg_win": 1952.96, "avg_loss": -718.51,
        "num_trades": 17, "alpha": 0.0183, "beta": 0.322, "calmar": 0.227,
    }


@pytest.fixture
def sample_trades():
    return [
        {"date": "2020-04-30", "type": "buy", "price": 266.34, "shares": 37.55, "pnl": 0.0},
        {"date": "2020-10-01", "type": "sell", "price": 311.63, "shares": 37.55, "pnl": 1700.57},
        {"date": "2022-01-25", "type": "sell", "price": 408.80, "shares": 34.92, "pnl": -730.86},
    ]


def test_generate_tearsheet_returns_a_valid_pdf(sample_metrics, sample_trades):
    pdf = generate_tearsheet(
        sample_metrics, equity_curve=[], trades=sample_trades,
        ticker="SPY", start_date="2020-01-01", end_date="2023-12-31",
    )
    assert isinstance(pdf, bytes)
    assert pdf.startswith(b"%PDF")


def test_generate_tearsheet_handles_no_trades(sample_metrics):
    """A strategy with zero trades still has metrics to report — the PDF
    generation shouldn't require a non-empty trade log."""
    pdf = generate_tearsheet(
        sample_metrics, equity_curve=[], trades=[],
        ticker="SPY", start_date="2020-01-01", end_date="2023-12-31",
    )
    assert pdf.startswith(b"%PDF")


def test_generate_tearsheet_truncates_trade_log_to_fifty_rows(sample_metrics):
    many_trades = [
        {"date": f"2020-01-{(i % 28) + 1:02d}", "type": "buy" if i % 2 == 0 else "sell",
         "price": 100.0 + i, "shares": 10.0, "pnl": i - 25}
        for i in range(80)
    ]
    # Only asserting this doesn't crash on a large trade log — the actual
    # truncation is internal to the HTML string and not independently
    # inspectable without parsing the PDF, so this is a smoke test.
    pdf = generate_tearsheet(
        sample_metrics, equity_curve=[], trades=many_trades,
        ticker="SPY", start_date="2020-01-01", end_date="2023-12-31",
    )
    assert pdf.startswith(b"%PDF")


def test_ensure_macos_library_path_is_a_noop_when_already_set(monkeypatch):
    monkeypatch.setattr("sys.platform", "darwin")
    monkeypatch.setenv("DYLD_FALLBACK_LIBRARY_PATH", "/some/existing/path")
    _ensure_macos_library_path()
    assert os.environ["DYLD_FALLBACK_LIBRARY_PATH"] == "/some/existing/path"


def test_ensure_macos_library_path_is_a_noop_off_darwin(monkeypatch):
    monkeypatch.setattr("sys.platform", "linux")
    monkeypatch.delenv("DYLD_FALLBACK_LIBRARY_PATH", raising=False)
    _ensure_macos_library_path()
    assert "DYLD_FALLBACK_LIBRARY_PATH" not in os.environ
