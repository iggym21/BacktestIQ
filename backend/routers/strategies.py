from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.strategy import StrategySaveRequest, StrategyResponse
from models.strategy import Strategy
from routers.auth import get_current_user

router = APIRouter()


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
    s = db.query(Strategy).filter(
        Strategy.id == strategy_id, Strategy.user_id == user.id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return s


@router.delete("/{strategy_id}", status_code=204)
def delete_strategy(
    strategy_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    s = db.query(Strategy).filter(
        Strategy.id == strategy_id, Strategy.user_id == user.id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    db.delete(s)
    db.commit()
