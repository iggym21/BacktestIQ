from fastapi import APIRouter, Depends, HTTPException
from services.data_service import fetch_ohlcv, search_tickers
from routers.auth import get_current_user

router = APIRouter()

@router.get("/ohlcv/{ticker}")
def get_ohlcv(ticker: str, start: str, end: str, _=Depends(get_current_user)):
    try:
        df = fetch_ohlcv(ticker, start, end)
        return {"ticker": ticker, "data": df.reset_index().to_dict(orient="records")}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/search")
def search(q: str, _=Depends(get_current_user)):
    return search_tickers(q)
