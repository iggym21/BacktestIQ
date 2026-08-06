import pandas as pd
import numpy as np
from services.indicators import calculate_sma, calculate_ema, calculate_rsi, calculate_macd, calculate_bollinger

def _get_indicator_series(df: pd.DataFrame, indicator: str, params: dict) -> pd.Series:
    c = df["close"]
    if indicator == "SMA":
        return calculate_sma(c, params["period"])
    elif indicator == "EMA":
        return calculate_ema(c, params["period"])
    elif indicator == "RSI":
        return calculate_rsi(c, params.get("period", 14))
    elif indicator == "MACD":
        macd, _, _ = calculate_macd(c)
        return macd
    elif indicator == "MACD_SIGNAL":
        _, signal, _ = calculate_macd(c)
        return signal
    elif indicator == "BB_UPPER":
        upper, _, _ = calculate_bollinger(c)
        return upper
    elif indicator == "BB_LOWER":
        _, _, lower = calculate_bollinger(c)
        return lower
    elif indicator == "VOLUME":
        return df["volume"].astype(float)
    elif indicator == "CLOSE":
        return c
    raise ValueError(f"Unknown indicator: {indicator}")

def _apply_operator(series_a: pd.Series, op: str, target) -> pd.Series:
    if op == ">":
        return series_a > target
    elif op == "<":
        return series_a < target
    elif op == ">=":
        return series_a >= target
    elif op == "<=":
        return series_a <= target
    elif op == "crosses_above":
        if isinstance(target, pd.Series):
            return (series_a > target) & (series_a.shift(1) <= target.shift(1))
        return (series_a > target) & (series_a.shift(1) <= target)
    elif op == "crosses_below":
        if isinstance(target, pd.Series):
            return (series_a < target) & (series_a.shift(1) >= target.shift(1))
        return (series_a < target) & (series_a.shift(1) >= target)
    raise ValueError(f"Unknown operator: {op}")

def _evaluate_rule(df: pd.DataFrame, rule: dict) -> pd.Series:
    series_a = _get_indicator_series(df, rule["indicator"], rule["params"])
    t = rule["target"]
    if "value" in t:
        target = t["value"]
    else:
        target = _get_indicator_series(df, t["indicator"], t["params"])
    return _apply_operator(series_a, rule["operator"], target)

def generate_signals_from_rules(df: pd.DataFrame, rules: dict) -> pd.Series:
    signals = pd.Series(0, index=df.index, dtype=int)
    logic = rules.get("logic", "AND")

    entry_masks = [_evaluate_rule(df, r) for r in rules["entry"]]
    exit_masks = [_evaluate_rule(df, r) for r in rules["exit"]]

    # An empty rule list (e.g. a strategy with entry conditions but no
    # explicit exit — hold once entered until the backtest period ends) is
    # valid input, not an error: pd.concat([]) raises "No objects to
    # concatenate", so it must be handled before reaching pandas, as a mask
    # that never fires rather than a crash.
    combine = (lambda masks: pd.concat(masks, axis=1).all(axis=1)) if logic == "AND" \
        else (lambda masks: pd.concat(masks, axis=1).any(axis=1))
    false_mask = pd.Series(False, index=df.index)
    entry = combine(entry_masks) if entry_masks else false_mask
    exit_ = combine(exit_masks) if exit_masks else false_mask

    signals[entry] = 1
    signals[exit_] = -1
    return signals

def generate_signals_from_code(df: pd.DataFrame, code: str) -> pd.Series:
    namespace = {}
    exec(compile(code, "<string>", "exec"), namespace)
    if "generate_signals" not in namespace:
        raise ValueError("Code must define generate_signals(df) function")
    return namespace["generate_signals"](df)
