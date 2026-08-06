from pydantic import BaseModel
from typing import Any, Literal


class StrategyRule(BaseModel):
    indicator: str
    params: dict[str, Any]
    operator: str
    target: dict[str, Any]


class StrategyRuleSet(BaseModel):
    entry: list[StrategyRule]
    exit: list[StrategyRule]
    logic: Literal["AND", "OR"] = "AND"


class PositionSizing(BaseModel):
    type: Literal["dollar", "shares", "percent"] = "percent"
    value: float = 100.0


class StrategyPayload(BaseModel):
    mode: Literal["visual", "code"]
    rules: StrategyRuleSet | None = None
    code: str | None = None
    position_sizing: PositionSizing = PositionSizing()


class BacktestRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: StrategyPayload
    initial_capital: float = 10000.0
    benchmark: str = "SPY"


class BacktestResponse(BaseModel):
    metrics: dict[str, Any]
    equity_curve: list[dict]
    drawdown: list[dict]
    trades: list[dict]


class CompareRequest(BaseModel):
    tickers: list[str]
    start_date: str
    end_date: str
    strategy: StrategyPayload
    initial_capital: float = 10000.0
    benchmark: str = "SPY"


class TickerResult(BaseModel):
    ticker: str
    metrics: dict[str, Any] | None = None
    equity_curve: list[dict] | None = None
    error: str | None = None


class CompareResponse(BaseModel):
    results: list[TickerResult]


class SweepRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: StrategyPayload
    initial_capital: float = 10000.0
    benchmark: str = "SPY"
    rule_group: Literal["entry", "exit"]
    rule_index: int
    param: str
    start: float
    stop: float
    step: float


class SweepPoint(BaseModel):
    value: float
    metrics: dict[str, Any] | None = None
    error: str | None = None


class SweepResponse(BaseModel):
    points: list[SweepPoint]


class WalkForwardRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: StrategyPayload
    initial_capital: float = 10000.0
    benchmark: str = "SPY"
    folds: int = 4


class WalkForwardFold(BaseModel):
    fold: int
    start_date: str
    end_date: str
    metrics: dict[str, Any] | None = None
    error: str | None = None


class WalkForwardResponse(BaseModel):
    folds: list[WalkForwardFold]
