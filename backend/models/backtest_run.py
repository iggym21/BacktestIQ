import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, DateTime, Date, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    strategy_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("strategies.id", ondelete="SET NULL"), nullable=True
    )
    ticker: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    initial_capital: Mapped[float] = mapped_column(Float, nullable=False)
    benchmark: Mapped[str] = mapped_column(String, default="SPY")
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    equity_curve: Mapped[list | None] = mapped_column(JSON, nullable=True)
    drawdown: Mapped[list | None] = mapped_column(JSON, nullable=True)
    trades: Mapped[list | None] = mapped_column(JSON, nullable=True)
    share_token: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="backtest_runs")
