from datetime import date, timedelta
from typing import Any

from schemas.backtest import StrategyPayload
from services.data_service import fetch_ohlcv
from services.signal_generator import generate_signals_from_rules, generate_signals_from_code
from services.portfolio_simulator import simulate_portfolio, simulate_buy_and_hold
from services.metrics import calculate_metrics

MAX_SWEEP_POINTS = 20
MIN_WALK_FORWARD_FOLDS = 2
MAX_WALK_FORWARD_FOLDS = 12


class BacktestDataError(Exception):
    """Raised when historical data can't be fetched for a ticker."""


class BacktestStrategyError(Exception):
    """Raised when the strategy payload is invalid or code fails to run."""


class SweepConfigError(Exception):
    """Raised when the sweep request itself is malformed (bad rule index, too many points, etc)."""


class WalkForwardConfigError(Exception):
    """Raised when the walk-forward request itself is malformed (bad fold count, range too short, etc)."""


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
        try:
            signals = generate_signals_from_rules(df, rules_dict)
        except (ValueError, KeyError, TypeError) as e:
            raise BacktestStrategyError(f"Invalid rule: {str(e)}") from e
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


def _sweep_values(start: float, stop: float, step: float) -> list[float]:
    if step <= 0:
        raise SweepConfigError("step must be positive")
    if stop < start:
        raise SweepConfigError("stop must be >= start")
    n = int(round((stop - start) / step)) + 1
    if n > MAX_SWEEP_POINTS:
        raise SweepConfigError(f"Sweep would produce {n} points, maximum is {MAX_SWEEP_POINTS}")
    values = [round(start + i * step, 6) for i in range(n)]
    # Guard against float drift pushing the last value past `stop`.
    return [v for v in values if v <= stop + 1e-9]


def run_parameter_sweep(
    ticker: str,
    start_date: str,
    end_date: str,
    strategy: StrategyPayload,
    initial_capital: float,
    benchmark: str,
    rule_group: str,
    rule_index: int,
    param: str,
    start: float,
    stop: float,
    step: float,
) -> list[dict]:
    """Run the same strategy repeatedly, sweeping one numeric rule parameter
    (e.g. a moving-average period) across a range, holding everything else
    fixed. Only supports visual-mode strategies — code-mode strategies don't
    have a structured parameter to target.
    """
    if strategy.mode != "visual" or not strategy.rules:
        raise SweepConfigError("Parameter sweep requires a visual-mode strategy with rules")

    rules = strategy.rules.entry if rule_group == "entry" else strategy.rules.exit
    if rule_index < 0 or rule_index >= len(rules):
        raise SweepConfigError(f"rule_index {rule_index} out of range for {rule_group} rules (has {len(rules)})")
    if param not in rules[rule_index].params:
        raise SweepConfigError(f"Rule at {rule_group}[{rule_index}] has no parameter '{param}'")
    # Indicator params like SMA/EMA/RSI period are integers (pandas .rolling()
    # rejects a float window); preserve whatever type the original had.
    cast = type(rules[rule_index].params[param])

    values = _sweep_values(start, stop, step)

    points = []
    for value in values:
        swept_strategy = strategy.model_copy(deep=True)
        swept_rules = swept_strategy.rules.entry if rule_group == "entry" else swept_strategy.rules.exit
        swept_rules[rule_index].params[param] = cast(value)
        try:
            result = run_strategy_backtest(
                ticker, start_date, end_date, swept_strategy, initial_capital, benchmark,
            )
            points.append({"value": value, "metrics": result["metrics"], "error": None})
        except (BacktestDataError, BacktestStrategyError) as e:
            points.append({"value": value, "metrics": None, "error": str(e)})

    return points


def _fold_date_ranges(start_date: str, end_date: str, folds: int) -> list[tuple[str, str]]:
    if folds < MIN_WALK_FORWARD_FOLDS or folds > MAX_WALK_FORWARD_FOLDS:
        raise WalkForwardConfigError(
            f"folds must be between {MIN_WALK_FORWARD_FOLDS} and {MAX_WALK_FORWARD_FOLDS}"
        )
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    if end <= start:
        raise WalkForwardConfigError("end_date must be after start_date")

    total_days = (end - start).days
    if total_days < folds:
        raise WalkForwardConfigError("Date range is too short for the requested number of folds")

    fold_days = total_days // folds
    ranges = []
    cursor = start
    for i in range(folds):
        fold_end = end if i == folds - 1 else cursor + timedelta(days=fold_days)
        ranges.append((cursor.isoformat(), fold_end.isoformat()))
        cursor = fold_end
    return ranges


def run_walk_forward(
    ticker: str,
    start_date: str,
    end_date: str,
    strategy: StrategyPayload,
    initial_capital: float,
    benchmark: str,
    folds: int,
) -> list[dict]:
    """Split the date range into `folds` equal, consecutive, non-overlapping
    windows and run the same fixed strategy independently on each one (each
    fold restarts at initial_capital, so folds are directly comparable).

    This does not re-fit or re-optimize anything between folds — it's a
    robustness check: a strategy whose Sharpe/return swings wildly fold to
    fold is regime-dependent even if its full-period metrics look great.
    Pair with the Optimize sweep to check whether a tuned parameter holds up
    out of the window it was tuned on.
    """
    ranges = _fold_date_ranges(start_date, end_date, folds)

    results = []
    for i, (fold_start, fold_end) in enumerate(ranges, start=1):
        try:
            result = run_strategy_backtest(
                ticker, fold_start, fold_end, strategy, initial_capital, benchmark,
            )
            results.append({
                "fold": i, "start_date": fold_start, "end_date": fold_end,
                "metrics": result["metrics"], "error": None,
            })
        except (BacktestDataError, BacktestStrategyError) as e:
            results.append({
                "fold": i, "start_date": fold_start, "end_date": fold_end,
                "metrics": None, "error": str(e),
            })

    return results
