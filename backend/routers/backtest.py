from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.backtest import (
    BacktestRequest, BacktestResponse, CompareRequest, CompareResponse, TickerResult,
    SweepRequest, SweepResponse, SweepPoint,
    WalkForwardRequest, WalkForwardResponse, WalkForwardFold,
)
from services.backtest_service import (
    run_strategy_backtest, run_parameter_sweep, run_walk_forward,
    BacktestDataError, BacktestStrategyError, SweepConfigError, WalkForwardConfigError,
)
from routers.auth import get_current_user
from models.backtest_run import BacktestRun

router = APIRouter()

MAX_COMPARE_TICKERS = 5


@router.post("/run", response_model=BacktestResponse)
def run_backtest(
    req: BacktestRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    try:
        result = run_strategy_backtest(
            req.ticker, req.start_date, req.end_date,
            req.strategy, req.initial_capital, req.benchmark,
        )
    except BacktestDataError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except BacktestStrategyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    run = BacktestRun(
        user_id=user.id,
        ticker=req.ticker,
        start_date=date.fromisoformat(req.start_date),
        end_date=date.fromisoformat(req.end_date),
        initial_capital=req.initial_capital,
        benchmark=req.benchmark,
        metrics=result["metrics"],
    )
    db.add(run)
    db.commit()

    return BacktestResponse(**result)


@router.post("/compare", response_model=CompareResponse)
def compare_backtest(
    req: CompareRequest,
    user=Depends(get_current_user),
):
    if not req.tickers:
        raise HTTPException(status_code=400, detail="At least one ticker is required")
    if len(req.tickers) > MAX_COMPARE_TICKERS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_COMPARE_TICKERS} tickers per comparison")

    results = []
    for ticker in req.tickers:
        try:
            result = run_strategy_backtest(
                ticker, req.start_date, req.end_date,
                req.strategy, req.initial_capital, req.benchmark,
            )
            results.append(TickerResult(
                ticker=ticker, metrics=result["metrics"], equity_curve=result["equity_curve"],
            ))
        except (BacktestDataError, BacktestStrategyError) as e:
            results.append(TickerResult(ticker=ticker, error=str(e)))

    return CompareResponse(results=results)


@router.post("/sweep", response_model=SweepResponse)
def sweep_backtest(
    req: SweepRequest,
    user=Depends(get_current_user),
):
    try:
        points = run_parameter_sweep(
            req.ticker, req.start_date, req.end_date, req.strategy,
            req.initial_capital, req.benchmark,
            req.rule_group, req.rule_index, req.param,
            req.start, req.stop, req.step,
        )
    except SweepConfigError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BacktestDataError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return SweepResponse(points=[SweepPoint(**p) for p in points])


@router.post("/walkforward", response_model=WalkForwardResponse)
def walk_forward_backtest(
    req: WalkForwardRequest,
    user=Depends(get_current_user),
):
    try:
        folds = run_walk_forward(
            req.ticker, req.start_date, req.end_date, req.strategy,
            req.initial_capital, req.benchmark, req.folds,
        )
    except WalkForwardConfigError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except BacktestDataError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return WalkForwardResponse(folds=[WalkForwardFold(**f) for f in folds])
