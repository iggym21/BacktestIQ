import pytest
import pandas as pd
import numpy as np
from services.metrics import calculate_metrics

@pytest.fixture
def equity_curve():
    np.random.seed(42)
    n = 252
    returns = np.random.randn(n) * 0.01 + 0.0003
    equity = 10000 * (1 + returns).cumprod()
    return pd.Series(equity, index=pd.date_range("2022-01-01", periods=n, freq="B"))

@pytest.fixture
def benchmark_curve(equity_curve):
    np.random.seed(123)
    returns = np.random.randn(len(equity_curve)) * 0.008 + 0.0002
    bench = 10000 * (1 + returns).cumprod()
    return pd.Series(bench, index=equity_curve.index)

def test_metrics_returns_all_required_keys(equity_curve, benchmark_curve):
    trades = [{"type": "buy", "pnl": 100}, {"type": "sell", "pnl": -50}]
    m = calculate_metrics(equity_curve, benchmark_curve, trades, 10000)
    required = ["total_return","annualized_return","sharpe","sortino","max_drawdown",
                "max_drawdown_duration","win_rate","avg_win","avg_loss","num_trades",
                "alpha","beta","calmar"]
    for k in required:
        assert k in m, f"Missing key: {k}"

def test_total_return_positive_on_growth(equity_curve, benchmark_curve):
    trades = []
    m = calculate_metrics(equity_curve, benchmark_curve, trades, 10000)
    if equity_curve.iloc[-1] > 10000:
        assert m["total_return"] > 0
