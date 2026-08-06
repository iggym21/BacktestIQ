from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.strategy import (
    StrategySaveRequest, StrategyResponse, StrategyUpdateRequest, StrategyVersionResponse,
)
from models.strategy import Strategy
from models.strategy_version import StrategyVersion
from routers.auth import get_current_user

router = APIRouter()


def _get_owned_strategy(db: Session, strategy_id: str, user_id: str) -> Strategy:
    s = db.query(Strategy).filter(
        Strategy.id == strategy_id, Strategy.user_id == user_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return s


@router.get("/", response_model=list[StrategyResponse])
def list_strategies(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Strategy).filter(Strategy.user_id == user.id).all()


@router.post("/", response_model=StrategyResponse, status_code=201)
def save_strategy(
    req: StrategySaveRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    count = db.query(Strategy).filter(Strategy.user_id == user.id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 strategies reached")
    s = Strategy(user_id=user.id, name=req.name, mode=req.mode, config=req.config)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.get("/{strategy_id}", response_model=StrategyResponse)
def get_strategy(
    strategy_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return _get_owned_strategy(db, strategy_id, user.id)


@router.put("/{strategy_id}", response_model=StrategyResponse)
def update_strategy(
    strategy_id: str,
    req: StrategyUpdateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Update a saved strategy in place, archiving its current name/mode/
    config as a StrategyVersion snapshot first so it can be reviewed later.
    """
    s = _get_owned_strategy(db, strategy_id, user.id)

    snapshot = StrategyVersion(
        strategy_id=s.id, name=s.name, mode=s.mode, config=s.config, created_at=s.updated_at,
    )
    db.add(snapshot)

    s.name = req.name
    s.mode = req.mode
    s.config = req.config
    s.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(s)
    return s


@router.get("/{strategy_id}/versions", response_model=list[StrategyVersionResponse])
def list_strategy_versions(
    strategy_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    _get_owned_strategy(db, strategy_id, user.id)
    return (
        db.query(StrategyVersion)
        .filter(StrategyVersion.strategy_id == strategy_id)
        .order_by(StrategyVersion.created_at.desc())
        .all()
    )


@router.delete("/{strategy_id}", status_code=204)
def delete_strategy(
    strategy_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    s = _get_owned_strategy(db, strategy_id, user.id)
    db.delete(s)
    db.commit()
