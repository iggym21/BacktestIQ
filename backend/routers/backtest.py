from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.backtest import BacktestRequest, BacktestResponse
from services.data_service import fetch_ohlcv
from services.signal_generator import generate_signals_from_rules, generate_signals_from_code
from services.portfolio_simulator import simulate_portfolio, simulate_buy_and_hold
from services.metrics import calculate_metrics
from routers.auth import get_current_user
from models.backtest_run import BacktestRun

router = APIRouter()


@router.post("/run", response_model=BacktestResponse)
def run_backtest(
    req: BacktestRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        df = fetch_ohlcv(req.ticker, req.start_date, req.end_date)
        benchmark_df = fetch_ohlcv(req.benchmark, req.start_date, req.end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if req.strategy.mode == "visual":
        if not req.strategy.rules:
            raise HTTPException(status_code=400, detail="Visual mode requires rules")
        rules_dict = {
            "entry": [r.model_dump() for r in req.strategy.rules.entry],
            "exit": [r.model_dump() for r in req.strategy.rules.exit],
            "logic": req.strategy.rules.logic,
        }
        signals = generate_signals_from_rules(df, rules_dict)
    else:
        if not req.strategy.code:
            raise HTTPException(status_code=400, detail="Code mode requires code")
        try:
            signals = generate_signals_from_code(df, req.strategy.code)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Code error: {str(e)}")

    result = simulate_portfolio(df, signals, req.initial_capital)
    bench_result = simulate_buy_and_hold(benchmark_df, req.initial_capital)

    metrics = calculate_metrics(
        result["equity_curve"],
        bench_result["equity_curve"],
        result["trades"],
        req.initial_capital,
    )

    equity_records = result["equity_curve_records"]
    bench_records = bench_result["equity_curve_records"]
    bench_map = {r["date"]: r["equity"] for r in bench_records}
    for rec in equity_records:
        rec["benchmark_equity"] = bench_map.get(rec["date"], req.initial_capital)

    drawdown_records = [
        {"date": str(d.date()), "drawdown": round(v, 4)}
        for d, v in result["drawdown"].items()
    ]

    run = BacktestRun(
        user_id=user.id,
        ticker=req.ticker,
        start_date=req.start_date,
        end_date=req.end_date,
        initial_capital=req.initial_capital,
        benchmark=req.benchmark,
        metrics=metrics,
    )
    db.add(run)
    db.commit()

    return BacktestResponse(
        metrics=metrics,
        equity_curve=equity_records,
        drawdown=drawdown_records,
        trades=result["trades"],
    )
