from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime


class StrategySaveRequest(BaseModel):
    name: str
    mode: str
    config: dict[str, Any]


class StrategyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    mode: str
    config: dict[str, Any]
    created_at: datetime
