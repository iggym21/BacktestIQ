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

    if logic == "AND":
        entry = pd.concat(entry_masks, axis=1).all(axis=1)
        exit_ = pd.concat(exit_masks, axis=1).all(axis=1)
    else:
        entry = pd.concat(entry_masks, axis=1).any(axis=1)
        exit_ = pd.concat(exit_masks, axis=1).any(axis=1)

    signals[entry] = 1
    signals[exit_] = -1
    return signals

def generate_signals_from_code(df: pd.DataFrame, code: str) -> pd.Series:
    namespace = {}
    exec(compile(code, "<string>", "exec"), namespace)
    if "generate_signals" not in namespace:
        raise ValueError("Code must define generate_signals(df) function")
    return namespace["generate_signals"](df)
