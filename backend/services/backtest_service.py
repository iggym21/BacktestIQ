from typing import Any

from schemas.backtest import StrategyPayload
from services.data_service import fetch_ohlcv
from services.signal_generator import generate_signals_from_rules, generate_signals_from_code
from services.portfolio_simulator import simulate_portfolio, simulate_buy_and_hold
from services.metrics import calculate_metrics


class BacktestDataError(Exception):
    """Raised when historical data can't be fetched for a ticker."""


class BacktestStrategyError(Exception):
    """Raised when the strategy payload is invalid or code fails to run."""


def run_strategy_backtest(
    ticker: str,
    start_date: str,
    end_date: str,
    strategy: StrategyPayload,
    initial_capital: float,
    benchmark: str,
) -> dict[str, Any]:
    """Core backtest pipeline shared by the single-run and compare endpoints.

    Fetches data, generates signals, simulates the strategy and a
    buy-and-hold benchmark, and computes performance metrics. Raises
    BacktestDataError / BacktestStrategyError on failure so callers can
    translate them into the appropriate HTTP status.
    """
    try:
        df = fetch_ohlcv(ticker, start_date, end_date)
        benchmark_df = fetch_ohlcv(benchmark, start_date, end_date)
    except ValueError as e:
        raise BacktestDataError(str(e)) from e

    if strategy.mode == "visual":
        if not strategy.rules:
            raise BacktestStrategyError("Visual mode requires rules")
        rules_dict = {
            "entry": [r.model_dump() for r in strategy.rules.entry],
            "exit": [r.model_dump() for r in strategy.rules.exit],
            "logic": strategy.rules.logic,
        }
        signals = generate_signals_from_rules(df, rules_dict)
    else:
        if not strategy.code:
            raise BacktestStrategyError("Code mode requires code")
        try:
            signals = generate_signals_from_code(df, strategy.code)
        except Exception as e:
            raise BacktestStrategyError(f"Code error: {str(e)}") from e

    result = simulate_portfolio(df, signals, initial_capital, position_sizing=strategy.position_sizing.model_dump())
    bench_result = simulate_buy_and_hold(benchmark_df, initial_capital)

    metrics = calculate_metrics(
        result["equity_curve"],
        bench_result["equity_curve"],
        result["trades"],
        initial_capital,
    )

    equity_records = result["equity_curve_records"]
    bench_records = bench_result["equity_curve_records"]
    bench_map = {r["date"]: r["equity"] for r in bench_records}
    for rec in equity_records:
        rec["benchmark_equity"] = bench_map.get(rec["date"], initial_capital)

    drawdown_records = [
        {"date": str(d.date()), "drawdown": round(v, 4)}
        for d, v in result["drawdown"].items()
    ]

    return {
        "metrics": metrics,
        "equity_curve": equity_records,
        "drawdown": drawdown_records,
        "trades": result["trades"],
    }
