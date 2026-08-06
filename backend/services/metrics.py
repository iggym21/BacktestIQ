import pandas as pd
import numpy as np
from scipy import stats

TRADING_DAYS = 252

def calculate_metrics(equity: pd.Series, benchmark: pd.Series,
                      trades: list, initial_capital: float) -> dict:
    returns = equity.pct_change().dropna()
    bench_returns = benchmark.pct_change().dropna()

    total_return = (equity.iloc[-1] - initial_capital) / initial_capital
    n_years = len(equity) / TRADING_DAYS
    annualized_return = (1 + total_return) ** (1 / n_years) - 1 if n_years > 0 else 0

    sharpe = (returns.mean() / returns.std()) * np.sqrt(TRADING_DAYS) if returns.std() > 0 else 0
    downside = returns[returns < 0].std()
    sortino = (returns.mean() / downside) * np.sqrt(TRADING_DAYS) if downside > 0 else 0

    running_max = equity.cummax()
    drawdown_series = (equity - running_max) / running_max
    max_drawdown = drawdown_series.min()

    in_drawdown = drawdown_series < 0
    drawdown_duration = 0
    current_dd = 0
    for val in in_drawdown:
        if val:
            current_dd += 1
            drawdown_duration = max(drawdown_duration, current_dd)
        else:
            current_dd = 0

    calmar = annualized_return / abs(max_drawdown) if max_drawdown != 0 else 0

    winning = [t for t in trades if t.get("pnl", 0) > 0]
    losing = [t for t in trades if t.get("pnl", 0) < 0]
    win_rate = len(winning) / len(trades) if trades else 0
    avg_win = np.mean([t["pnl"] for t in winning]) if winning else 0
    avg_loss = np.mean([t["pnl"] for t in losing]) if losing else 0

    aligned = pd.concat([returns, bench_returns], axis=1).dropna()
    if len(aligned) > 2 and aligned.iloc[:, 1].std() > 0:
        slope, intercept, _, _, _ = stats.linregress(aligned.iloc[:, 1], aligned.iloc[:, 0])
        beta = slope
        alpha = (annualized_return - beta * ((1 + bench_returns.mean()) ** TRADING_DAYS - 1))
    else:
        beta, alpha = 0.0, 0.0

    return {
        "total_return": round(total_return, 4),
        "annualized_return": round(annualized_return, 4),
        "sharpe": round(sharpe, 4),
        "sortino": round(sortino, 4),
        "max_drawdown": round(max_drawdown, 4),
        "max_drawdown_duration": drawdown_duration,
        "win_rate": round(win_rate, 4),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "num_trades": len(trades),
        "alpha": round(alpha, 4),
        "beta": round(beta, 4),
        "calmar": round(calmar, 4),
    }
