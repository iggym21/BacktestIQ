import pytest
import pandas as pd
import numpy as np
from services.signal_generator import generate_signals_from_rules, generate_signals_from_code

@pytest.fixture
def sample_df():
    np.random.seed(42)
    n = 300
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5)
    df = pd.DataFrame({"open": prices, "high": prices * 1.01, "low": prices * 0.99,
                       "close": prices, "volume": np.random.randint(1000000, 5000000, n)},
                      index=pd.date_range("2020-01-01", periods=n, freq="B"))
    return df

def test_sma_crossover_signal(sample_df):
    rules = {
        "entry": [{"indicator": "SMA", "params": {"period": 20}, "operator": "crosses_above",
                   "target": {"indicator": "SMA", "params": {"period": 50}}}],
        "exit": [{"indicator": "SMA", "params": {"period": 20}, "operator": "crosses_below",
                  "target": {"indicator": "SMA", "params": {"period": 50}}}],
        "logic": "AND"
    }
    signals = generate_signals_from_rules(sample_df, rules)
    assert isinstance(signals, pd.Series)
    assert set(signals.unique()).issubset({0, 1, -1})

def test_rsi_threshold_signal(sample_df):
    rules = {
        "entry": [{"indicator": "RSI", "params": {"period": 14}, "operator": "<", "target": {"value": 30}}],
        "exit": [{"indicator": "RSI", "params": {"period": 14}, "operator": ">", "target": {"value": 70}}],
        "logic": "AND"
    }
    signals = generate_signals_from_rules(sample_df, rules)
    assert isinstance(signals, pd.Series)

def test_empty_exit_rules_holds_forever_instead_of_crashing(sample_df):
    """pd.concat([]) raises "No objects to concatenate" — an empty exit list
    (a valid strategy design: enter on a signal, never explicitly exit, let
    the backtest period end decide) used to crash instead of just never
    firing an exit signal."""
    rules = {
        "entry": [{"indicator": "CLOSE", "params": {}, "operator": ">", "target": {"value": 0}}],
        "exit": [],
        "logic": "AND",
    }
    signals = generate_signals_from_rules(sample_df, rules)
    assert (signals != -1).all()
    assert (signals == 1).any()


def test_empty_entry_rules_never_enters_instead_of_crashing(sample_df):
    rules = {
        "entry": [],
        "exit": [{"indicator": "CLOSE", "params": {}, "operator": "<", "target": {"value": 0}}],
        "logic": "AND",
    }
    signals = generate_signals_from_rules(sample_df, rules)
    assert (signals == 0).all()


def test_code_mode_signal(sample_df):
    code = """
def generate_signals(df):
    import pandas as pd
    signals = pd.Series(0, index=df.index)
    signals.iloc[10] = 1
    signals.iloc[20] = -1
    return signals
"""
    signals = generate_signals_from_code(sample_df, code)
    assert signals.iloc[10] == 1
    assert signals.iloc[20] == -1
