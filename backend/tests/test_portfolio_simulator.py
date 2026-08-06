import pytest
import pandas as pd
import numpy as np
from services.portfolio_simulator import simulate_portfolio, simulate_buy_and_hold

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

def test_buy_and_hold_tracks_price_return(ohlcv):
    """Regression test: benchmark used to be simulated with all-zero signals
    (never buys), producing a flat equity curve regardless of price movement."""
    result = simulate_buy_and_hold(ohlcv, 10000)
    price_return = ohlcv["close"].iloc[-1] / ohlcv["close"].iloc[0] - 1
    equity_return = result["equity_curve"].iloc[-1] / 10000 - 1
    assert equity_return == pytest.approx(price_return, rel=0.001)
    assert len(result["trades"]) == 1
    assert result["trades"][0]["type"] == "buy"

def test_full_buy_sell_roundtrip_conserves_value():
    """Regression test: buying used to leave cash un-deducted, so equity while
    holding a position was cash + position value double-counted."""
    prices = [100.0, 110.0, 120.0]
    df = pd.DataFrame({"close": prices}, index=pd.date_range("2022-01-01", periods=3, freq="D"))
    signals = pd.Series([1, 0, -1], index=df.index)
    result = simulate_portfolio(df, signals, 10000)
    equity = result["equity_curve"]
    # Bought fully at 100 -> equity while holding should track price, not double it.
    assert equity.iloc[1] == pytest.approx(11000, rel=0.001)
    # Sold at 120 -> cash equals shares * final price.
    assert equity.iloc[2] == pytest.approx(12000, rel=0.001)
    assert result["trades"][-1]["pnl"] == pytest.approx(2000, rel=0.001)

def test_buy_and_hold_empty_df_returns_no_trades():
    empty = pd.DataFrame({"close": []}, index=pd.DatetimeIndex([]))
    result = simulate_buy_and_hold(empty, 10000)
    assert result["trades"] == []


def test_position_sizing_percent_invests_partial_capital():
    """Regression test: position_sizing was accepted by the API but never
    actually consulted — every backtest always invested 100% of equity
    regardless of what the user configured."""
    prices = [100.0, 110.0, 120.0]
    df = pd.DataFrame({"close": prices}, index=pd.date_range("2022-01-01", periods=3, freq="D"))
    signals = pd.Series([1, 0, -1], index=df.index)
    result = simulate_portfolio(df, signals, 10000, position_sizing={"type": "percent", "value": 25})
    assert result["trades"][0]["shares"] == pytest.approx(25, rel=0.001)  # 2500 / 100
    # 75% of capital (7500) stays idle cash; only 25 shares track the price move.
    assert result["equity_curve"].iloc[1] == pytest.approx(7500 + 25 * 110, rel=0.001)
    assert result["equity_curve"].iloc[2] == pytest.approx(10000 + 25 * 20, rel=0.001)


def test_position_sizing_dollar_invests_fixed_amount():
    prices = [100.0, 120.0]
    df = pd.DataFrame({"close": prices}, index=pd.date_range("2022-01-01", periods=2, freq="D"))
    signals = pd.Series([1, 0], index=df.index)
    result = simulate_portfolio(df, signals, 10000, position_sizing={"type": "dollar", "value": 2000})
    assert result["trades"][0]["shares"] == pytest.approx(20, rel=0.001)  # 2000 / 100
    assert result["equity_curve"].iloc[1] == pytest.approx(8000 + 20 * 120, rel=0.001)


def test_position_sizing_shares_buys_fixed_share_count():
    prices = [100.0, 120.0]
    df = pd.DataFrame({"close": prices}, index=pd.date_range("2022-01-01", periods=2, freq="D"))
    signals = pd.Series([1, 0], index=df.index)
    result = simulate_portfolio(df, signals, 10000, position_sizing={"type": "shares", "value": 10})
    assert result["trades"][0]["shares"] == pytest.approx(10, rel=0.001)
    assert result["equity_curve"].iloc[1] == pytest.approx(9000 + 10 * 120, rel=0.001)


def test_position_sizing_dollar_amount_larger_than_equity_is_capped():
    prices = [100.0, 120.0]
    df = pd.DataFrame({"close": prices}, index=pd.date_range("2022-01-01", periods=2, freq="D"))
    signals = pd.Series([1, 0], index=df.index)
    result = simulate_portfolio(df, signals, 10000, position_sizing={"type": "dollar", "value": 50000})
    # Can't invest more than available equity, even if the requested dollar amount is larger.
    assert result["trades"][0]["shares"] == pytest.approx(100, rel=0.001)  # all 10000 / 100


def test_default_position_sizing_is_fully_invested():
    """No position_sizing passed -> behaves exactly as before (100% invested)."""
    prices = [100.0, 120.0]
    df = pd.DataFrame({"close": prices}, index=pd.date_range("2022-01-01", periods=2, freq="D"))
    signals = pd.Series([1, 0], index=df.index)
    result = simulate_portfolio(df, signals, 10000)
    assert result["trades"][0]["shares"] == pytest.approx(100, rel=0.001)
