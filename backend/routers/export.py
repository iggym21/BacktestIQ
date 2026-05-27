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
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=tearsheet_{req.ticker}.pdf"},
    )
