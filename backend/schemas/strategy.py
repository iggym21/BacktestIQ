from pydantic import BaseModel
from typing import Any
from datetime import datetime


class StrategySaveRequest(BaseModel):
    name: str
    mode: str
    config: dict[str, Any]


class StrategyResponse(BaseModel):
    id: str
    name: str
    mode: str
    config: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
