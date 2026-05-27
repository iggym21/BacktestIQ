import pytest
import pandas as pd
import numpy as np
from services.portfolio_simulator import simulate_portfolio

@pytest.fixture
def ohlcv():
    np.random.seed(42)
    n = 252
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5)
    return pd.DataFrame({"open": prices, "high": prices*1.01, "low": prices*0.99,
                         "close": prices, "volume": np.ones(n)*1e6},
                        index=pd.date_range("2022-01-01", periods=n, freq="B"))

@pytest.fixture
def simple_signals(ohlcv):
    s = pd.Series(0, index=ohlcv.index)
    s.iloc[10] = 1
    s.iloc[100] = -1
    return s

def test_portfolio_starts_at_capital(ohlcv, simple_signals):
    result = simulate_portfolio(ohlcv, simple_signals, 10000)
    assert result["equity_curve"].iloc[0] == pytest.approx(10000, rel=0.01)

def test_portfolio_has_required_keys(ohlcv, simple_signals):
    result = simulate_portfolio(ohlcv, simple_signals, 10000)
    assert "equity_curve" in result
    assert "trades" in result
    assert "drawdown" in result

def test_no_trades_means_flat_equity(ohlcv):
    signals = pd.Series(0, index=ohlcv.index)
    result = simulate_portfolio(ohlcv, signals, 10000)
    assert result["equity_curve"].iloc[-1] == pytest.approx(10000, rel=0.001)
