import pandas as pd
import numpy as np
from typing import Any

DEFAULT_POSITION_SIZING = {"type": "percent", "value": 100.0}


def _invest_amount(equity: float, price: float, position_sizing: dict) -> float:
    sizing_type = position_sizing.get("type", "percent")
    value = position_sizing.get("value", 100.0)
    if sizing_type == "dollar":
        amount = value
    elif sizing_type == "shares":
        amount = value * price
    else:  # percent
        amount = equity * (value / 100)
    return max(0.0, min(amount, equity))


def simulate_portfolio(df: pd.DataFrame, signals: pd.Series, initial_capital: float,
                       commission_pct: float = 0.0, position_sizing: dict | None = None) -> dict[str, Any]:
    position_sizing = position_sizing or DEFAULT_POSITION_SIZING
    equity = initial_capital
    position = 0
    entry_price = 0.0
    trades = []
    equity_curve = []

    for date, row in df.iterrows():
        sig = signals.get(date, 0)
        price = row["close"]

        if sig == 1 and position == 0:
            invest_amount = _invest_amount(equity, price, position_sizing)
            cost = invest_amount * commission_pct
            shares = (invest_amount - cost) / price if invest_amount > 0 else 0.0
            if shares > 0:
                position = shares
                entry_price = price
                equity -= invest_amount
                trades.append({"date": str(date.date()), "type": "buy", "price": price,
                               "shares": shares, "pnl": 0.0})

        elif sig == -1 and position > 0:
            proceeds = position * price
            cost = proceeds * commission_pct
            pnl = position * (price - entry_price) - cost
            equity += proceeds - cost
            trades.append({"date": str(date.date()), "type": "sell", "price": price,
                           "shares": position, "pnl": round(pnl, 2)})
            position = 0
            entry_price = 0.0

        current_value = equity + position * price
        equity_curve.append({"date": str(date.date()), "equity": round(current_value, 2)})

    equity_series = pd.Series([e["equity"] for e in equity_curve], index=df.index)
    running_max = equity_series.cummax()
    drawdown = (equity_series - running_max) / running_max

    return {
        "equity_curve": equity_series,
        "equity_curve_records": equity_curve,
        "drawdown": drawdown,
        "trades": trades,
    }


def simulate_buy_and_hold(df: pd.DataFrame, initial_capital: float) -> dict[str, Any]:
    """Buy on the first bar and hold to the end — the standard benchmark comparison."""
    signals = pd.Series(0, index=df.index)
    if len(signals) > 0:
        signals.iloc[0] = 1
    return simulate_portfolio(df, signals, initial_capital)
