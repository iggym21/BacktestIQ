import re
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Any
from services.export_service import generate_tearsheet
from routers.auth import get_current_user

router = APIRouter()


class ExportRequest(BaseModel):
    metrics: dict[str, Any]
    equity_curve: list[dict]
    trades: list[dict]
    ticker: str
    start_date: str
    end_date: str


@router.post("/tearsheet")
def export_tearsheet(req: ExportRequest, _=Depends(get_current_user)):
    pdf = generate_tearsheet(
        req.metrics, req.equity_curve, req.trades,
        req.ticker, req.start_date, req.end_date,
    )
    # req.ticker is free-form client input with no charset constraint —
    # embedding it raw in a response header risks header/response-splitting
    # if it ever contains CR/LF or other control characters. Strip to a safe
    # filename charset instead of trusting it.
    safe_ticker = re.sub(r"[^A-Za-z0-9_-]", "", req.ticker)[:40] or "export"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=tearsheet_{safe_ticker}.pdf"},
    )
