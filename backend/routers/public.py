from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.backtest import PublicResultResponse
from models.backtest_run import BacktestRun

router = APIRouter()


@router.get("/results/{token}", response_model=PublicResultResponse)
def get_public_result(token: str, db: Session = Depends(get_db)):
    """Unauthenticated lookup of a shared backtest run by its share token.

    Intentionally does not expose the run's database id or owning user —
    only the token in the URL identifies it, and knowing the token is what
    grants access (the same model as any unguessable-link share feature).
    """
    run = db.query(BacktestRun).filter(BacktestRun.share_token == token).first()
    if not run or run.equity_curve is None:
        raise HTTPException(status_code=404, detail="Shared result not found")

    return PublicResultResponse(
        ticker=run.ticker,
        start_date=str(run.start_date),
        end_date=str(run.end_date),
        benchmark=run.benchmark,
        initial_capital=run.initial_capital,
        created_at=run.created_at,
        metrics=run.metrics,
        equity_curve=run.equity_curve,
        drawdown=run.drawdown,
        trades=run.trades,
    )
