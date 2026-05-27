import pandas as pd
import numpy as np
from typing import Any

def simulate_portfolio(df: pd.DataFrame, signals: pd.Series, initial_capital: float,
                       commission_pct: float = 0.0) -> dict[str, Any]:
    equity = initial_capital
    position = 0
    entry_price = 0.0
    trades = []
    equity_curve = []

    for date, row in df.iterrows():
        sig = signals.get(date, 0)
        price = row["close"]

        if sig == 1 and position == 0:
            shares = equity / price
            cost = shares * price * commission_pct
            position = shares
            entry_price = price
            equity -= cost
            trades.append({"date": str(date.date()), "type": "buy", "price": price,
                           "shares": shares, "pnl": 0.0})

        elif sig == -1 and position > 0:
            proceeds = position * price
            cost = proceeds * commission_pct
            pnl = position * (price - entry_price) - cost
            equity = position * price - cost
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
