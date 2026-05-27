# BacktestIQ MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack backtesting platform with visual strategy builder, backtest engine, results dashboard, AI strategy generation, and PDF export.

**Architecture:** FastAPI backend with PostgreSQL + SQLite cache; React + Tailwind frontend; vectorized pandas backtest engine; Claude API for NL strategy generation; WeasyPrint for PDF export.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic, pandas, numpy, anthropic SDK, yfinance, alpaca-trade-api, WeasyPrint, React 18, TypeScript, Vite, Tailwind CSS v3, Recharts, Monaco Editor, react-router-dom v6.

---

## File Structure

```
BacktestIQ/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/user.py, strategy.py, backtest_run.py
│   ├── schemas/auth.py, strategy.py, backtest.py
│   ├── routers/auth.py, strategies.py, backtest.py, data.py, ai.py, export.py
│   ├── services/auth_service.py, data_service.py, indicators.py,
│   │           signal_generator.py, portfolio_simulator.py, metrics.py,
│   │           ai_service.py, export_service.py
│   ├── cache/market_data_cache.py
│   ├── tests/conftest.py, test_auth.py, test_indicators.py,
│   │         test_signal_generator.py, test_portfolio_simulator.py, test_metrics.py
│   ├── alembic/ (migrations)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts, auth.ts, strategies.ts, backtest.ts, ai.ts
│   │   ├── components/auth/, strategy/, dashboard/, layout/
│   │   ├── pages/LoginPage, RegisterPage, HomePage, StrategyPage, ResultsPage, SavedStrategiesPage
│   │   ├── context/AuthContext.tsx
│   │   └── types/index.ts
│   ├── package.json, vite.config.ts, tailwind.config.ts
├── docker-compose.yml
└── .env.example
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/config.py`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `frontend/` via `npm create vite@latest frontend -- --template react-ts`

- [ ] Create `backend/` directory with `__init__.py` files
- [ ] Write `backend/requirements.txt`:
```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pydantic-settings==2.3.1
pandas==2.2.2
numpy==1.26.4
yfinance==0.2.40
anthropic==0.28.0
weasyprint==62.3
httpx==0.27.0
pytest==8.2.2
pytest-asyncio==0.23.7
```
- [ ] Write `backend/config.py`:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://backtestiq:secret@localhost:5432/backtestiq"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    anthropic_api_key: str = ""
    alpaca_api_key: str = ""
    alpaca_secret_key: str = ""
    cache_db_path: str = "./market_data_cache.db"

    class Config:
        env_file = ".env"

settings = Settings()
```
- [ ] Write `backend/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, strategies, backtest, data, ai, export

app = FastAPI(title="BacktestIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(strategies.router, prefix="/strategies", tags=["strategies"])
app.include_router(backtest.router, prefix="/backtest", tags=["backtest"])
app.include_router(data.router, prefix="/data", tags=["data"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(export.router, prefix="/export", tags=["export"])

@app.get("/health")
def health():
    return {"status": "ok"}
```
- [ ] Write `docker-compose.yml`:
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: backtestiq
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: backtestiq
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```
- [ ] Write `.env.example`:
```
DATABASE_URL=postgresql://backtestiq:secret@localhost:5432/backtestiq
SECRET_KEY=change-me-in-production
ANTHROPIC_API_KEY=
ALPACA_API_KEY=
ALPACA_SECRET_KEY=
CACHE_DB_PATH=./market_data_cache.db
```
- [ ] Scaffold frontend: `npm create vite@latest frontend -- --template react-ts`
- [ ] Install frontend deps: `cd frontend && npm install recharts @monaco-editor/react axios react-router-dom react-hot-toast`
- [ ] Install Tailwind: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
- [ ] Configure `frontend/tailwind.config.ts` with dark mode and content paths
- [ ] Run `docker-compose up -d`, verify postgres starts
- [ ] Run `cd backend && pip install -r requirements.txt`
- [ ] Verify `uvicorn main:app --reload` starts without errors
- [ ] Commit: `feat: project scaffold — FastAPI + React + docker-compose`

---

## Task 2: Database Models + Migrations

**Files:**
- Create: `backend/database.py`
- Create: `backend/models/__init__.py`, `backend/models/user.py`, `backend/models/strategy.py`, `backend/models/backtest_run.py`
- Create: Alembic initial migration

- [ ] Write `backend/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```
- [ ] Write `backend/models/user.py`:
```python
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    strategies: Mapped[list["Strategy"]] = relationship(back_populates="user")
    backtest_runs: Mapped[list["BacktestRun"]] = relationship(back_populates="user")
```
- [ ] Write `backend/models/strategy.py`:
```python
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class Strategy(Base):
    __tablename__ = "strategies"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    mode: Mapped[str] = mapped_column(String, nullable=False)  # "visual" or "code"
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user: Mapped["User"] = relationship(back_populates="strategies")
```
- [ ] Write `backend/models/backtest_run.py`:
```python
import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class BacktestRun(Base):
    __tablename__ = "backtest_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    strategy_id: Mapped[str | None] = mapped_column(String, ForeignKey("strategies.id", ondelete="SET NULL"), nullable=True)
    ticker: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    initial_capital: Mapped[float] = mapped_column(Float, nullable=False)
    benchmark: Mapped[str] = mapped_column(String, default="SPY")
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user: Mapped["User"] = relationship(back_populates="backtest_runs")
```
- [ ] Init alembic: `cd backend && alembic init alembic`
- [ ] Configure `backend/alembic/env.py` to import Base and use settings.database_url
- [ ] Generate initial migration: `alembic revision --autogenerate -m "initial"`
- [ ] Run migration: `alembic upgrade head`
- [ ] Verify tables exist in postgres
- [ ] Commit: `feat: db models and initial migration`

---

## Task 3: Auth Backend

**Files:**
- Create: `backend/services/auth_service.py`
- Create: `backend/schemas/auth.py`
- Create: `backend/routers/auth.py`
- Create: `backend/tests/conftest.py`, `backend/tests/test_auth.py`

- [ ] Write failing test `backend/tests/test_auth.py`:
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_creates_user():
    resp = client.post("/auth/register", json={"email": "test@test.com", "password": "password123"})
    assert resp.status_code == 201
    assert resp.json()["email"] == "test@test.com"

def test_register_duplicate_email_fails():
    client.post("/auth/register", json={"email": "dup@test.com", "password": "password123"})
    resp = client.post("/auth/register", json={"email": "dup@test.com", "password": "password123"})
    assert resp.status_code == 400

def test_login_returns_token():
    client.post("/auth/register", json={"email": "login@test.com", "password": "password123"})
    resp = client.post("/auth/login", data={"username": "login@test.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_login_wrong_password_fails():
    client.post("/auth/register", json={"email": "wrong@test.com", "password": "password123"})
    resp = client.post("/auth/login", data={"username": "wrong@test.com", "password": "badpass"})
    assert resp.status_code == 401
```
- [ ] Run test: `cd backend && pytest tests/test_auth.py -v` — expect FAIL
- [ ] Write `backend/services/auth_service.py`:
```python
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models.user import User
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, password: str) -> User:
    user = User(email=email, hashed_password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
```
- [ ] Write `backend/schemas/auth.py`:
```python
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```
- [ ] Write `backend/routers/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from schemas.auth import RegisterRequest, UserResponse, TokenResponse
from services import auth_service

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register", response_model=UserResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return auth_service.create_user(db, req.email, req.password)

@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth_service.create_access_token({"sub": user.id})
    return TokenResponse(access_token=token)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = auth_service.decode_token(token)
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    from models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```
- [ ] Write `backend/tests/conftest.py` using a test SQLite DB:
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from database import Base, get_db
from main import app

TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
```
- [ ] Run tests: `pytest tests/test_auth.py -v` — expect PASS
- [ ] Commit: `feat: auth backend — register, login, JWT`

---

## Task 4: Auth Frontend

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/api/client.ts`, `frontend/src/api/auth.ts`
- Create: `frontend/src/components/auth/LoginForm.tsx`, `RegisterForm.tsx`
- Create: `frontend/src/components/layout/ProtectedRoute.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`, `RegisterPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] Write `frontend/src/types/index.ts`:
```typescript
export interface User { id: string; email: string; }
export interface AuthTokens { access_token: string; token_type: string; }
export interface StrategyRule {
  indicator: string;
  params: Record<string, number>;
  operator: string;
  target: { indicator?: string; params?: Record<string, number>; value?: number };
}
export interface StrategyConfig {
  mode: "visual" | "code";
  rules?: { entry: StrategyRule[]; exit: StrategyRule[]; logic: "AND" | "OR" };
  code?: string;
  position_sizing: { type: "dollar" | "shares" | "percent"; value: number };
}
export interface BacktestRequest {
  ticker: string; start_date: string; end_date: string;
  strategy: StrategyConfig; initial_capital: number; benchmark: string;
}
export interface BacktestMetrics {
  total_return: number; annualized_return: number; sharpe: number;
  sortino: number; max_drawdown: number; max_drawdown_duration: number;
  win_rate: number; avg_win: number; avg_loss: number;
  num_trades: number; alpha: number; beta: number; calmar: number;
}
export interface BacktestResult {
  metrics: BacktestMetrics;
  equity_curve: { date: string; equity: number; benchmark_equity: number }[];
  drawdown: { date: string; drawdown: number }[];
  trades: { date: string; type: "buy" | "sell"; price: number; shares: number; pnl: number }[];
}
```
- [ ] Write `frontend/src/api/client.ts`:
```typescript
import axios from "axios";

const client = axios.create({ baseURL: "http://localhost:8000" });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
```
- [ ] Write `frontend/src/api/auth.ts`:
```typescript
import client from "./client";
import { User, AuthTokens } from "../types";

export const register = (email: string, password: string) =>
  client.post<User>("/auth/register", { email, password });

export const login = (email: string, password: string) => {
  const form = new FormData();
  form.append("username", email);
  form.append("password", password);
  return client.post<AuthTokens>("/auth/login", form);
};
```
- [ ] Write `frontend/src/context/AuthContext.tsx`:
```typescript
import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "../types";
import * as authApi from "../api/auth";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    const { data: tokens } = await authApi.login(email, password);
    localStorage.setItem("access_token", tokens.access_token);
    const mockUser: User = { id: "", email };
    localStorage.setItem("user", JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const register = async (email: string, password: string) => {
    const { data: newUser } = await authApi.register(email, password);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout, register }}>{children}</AuthContext.Provider>;
}
```
- [ ] Write `frontend/src/components/layout/ProtectedRoute.tsx`:
```typescript
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
```
- [ ] Write login + register forms with Tailwind dark theme (full code with email/password inputs, error display, submit)
- [ ] Wire `App.tsx` with `BrowserRouter`, `AuthProvider`, routes for `/login`, `/register`, `/` (protected)
- [ ] Start frontend `npm run dev`, manually verify login flow works end-to-end with running backend
- [ ] Commit: `feat: auth frontend — login, register, JWT context`

---

## Task 5: Data Service + Cache

**Files:**
- Create: `backend/cache/market_data_cache.py`
- Create: `backend/services/data_service.py`
- Create: `backend/routers/data.py`
- Create: `backend/tests/test_data_service.py`

- [ ] Write failing test `backend/tests/test_data_service.py`:
```python
import pytest
import pandas as pd
from services.data_service import fetch_ohlcv

def test_fetch_ohlcv_returns_dataframe():
    df = fetch_ohlcv("SPY", "2023-01-01", "2023-03-31")
    assert isinstance(df, pd.DataFrame)
    assert set(["open", "high", "low", "close", "volume"]).issubset(df.columns)
    assert len(df) > 0

def test_fetch_ohlcv_dates_in_range():
    df = fetch_ohlcv("SPY", "2023-01-01", "2023-01-31")
    assert df.index[0].date().isoformat() >= "2023-01-01"
    assert df.index[-1].date().isoformat() <= "2023-01-31"

def test_cache_returns_same_data_second_call():
    df1 = fetch_ohlcv("AAPL", "2023-01-01", "2023-06-30")
    df2 = fetch_ohlcv("AAPL", "2023-01-01", "2023-06-30")
    assert len(df1) == len(df2)
```
- [ ] Run: `pytest tests/test_data_service.py -v` — expect FAIL
- [ ] Write `backend/cache/market_data_cache.py`:
```python
import sqlite3
import json
import pandas as pd
from datetime import datetime
from config import settings

def _get_conn():
    conn = sqlite3.connect(settings.cache_db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ohlcv_cache (
            ticker TEXT, start_date TEXT, end_date TEXT,
            data TEXT, cached_at TEXT,
            PRIMARY KEY (ticker, start_date, end_date)
        )
    """)
    conn.commit()
    return conn

def get_cached(ticker: str, start: str, end: str) -> pd.DataFrame | None:
    conn = _get_conn()
    row = conn.execute(
        "SELECT data FROM ohlcv_cache WHERE ticker=? AND start_date=? AND end_date=?",
        (ticker, start, end)
    ).fetchone()
    conn.close()
    if not row:
        return None
    records = json.loads(row[0])
    df = pd.DataFrame(records)
    df.index = pd.to_datetime(df["date"])
    return df.drop(columns=["date"])

def set_cached(ticker: str, start: str, end: str, df: pd.DataFrame):
    records = df.copy()
    records["date"] = records.index.strftime("%Y-%m-%d")
    data = records.reset_index(drop=True).to_json(orient="records")
    conn = _get_conn()
    conn.execute(
        "INSERT OR REPLACE INTO ohlcv_cache VALUES (?,?,?,?,?)",
        (ticker, start, end, data, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()
```
- [ ] Write `backend/services/data_service.py`:
```python
import pandas as pd
import yfinance as yf
from cache.market_data_cache import get_cached, set_cached

def fetch_ohlcv(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    cached = get_cached(ticker, start_date, end_date)
    if cached is not None:
        return cached
    df = _fetch_from_yfinance(ticker, start_date, end_date)
    set_cached(ticker, start_date, end_date, df)
    return df

def _fetch_from_yfinance(ticker: str, start: str, end: str) -> pd.DataFrame:
    raw = yf.download(ticker, start=start, end=end, auto_adjust=True, progress=False)
    if raw.empty:
        raise ValueError(f"No data found for {ticker}")
    df = raw[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.columns = ["open", "high", "low", "close", "volume"]
    return df

def search_tickers(query: str) -> list[dict]:
    ticker = yf.Ticker(query.upper())
    info = ticker.info
    return [{"symbol": query.upper(), "name": info.get("longName", query.upper())}]
```
- [ ] Write `backend/routers/data.py`:
```python
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
```
- [ ] Run tests: `pytest tests/test_data_service.py -v` — expect PASS
- [ ] Commit: `feat: data service with yfinance and SQLite cache`

---

## Task 6: Indicators

**Files:**
- Create: `backend/services/indicators.py`
- Create: `backend/tests/test_indicators.py`

- [ ] Write failing test `backend/tests/test_indicators.py`:
```python
import pytest
import pandas as pd
import numpy as np
from services.indicators import calculate_sma, calculate_ema, calculate_rsi, calculate_macd, calculate_bollinger

@pytest.fixture
def price_series():
    np.random.seed(42)
    prices = 100 + np.random.randn(300).cumsum()
    return pd.Series(prices, name="close")

def test_sma_length(price_series):
    sma = calculate_sma(price_series, 20)
    assert len(sma) == len(price_series)
    assert pd.isna(sma.iloc[18])
    assert not pd.isna(sma.iloc[19])

def test_ema_length(price_series):
    ema = calculate_ema(price_series, 20)
    assert len(ema) == len(price_series)

def test_rsi_range(price_series):
    rsi = calculate_rsi(price_series, 14)
    valid = rsi.dropna()
    assert (valid >= 0).all() and (valid <= 100).all()

def test_macd_returns_three_series(price_series):
    macd, signal, hist = calculate_macd(price_series)
    assert len(macd) == len(price_series)
    assert len(signal) == len(price_series)

def test_bollinger_bands(price_series):
    upper, mid, lower = calculate_bollinger(price_series, 20, 2)
    valid = ~(upper.isna() | mid.isna() | lower.isna())
    assert (upper[valid] >= mid[valid]).all()
    assert (mid[valid] >= lower[valid]).all()
```
- [ ] Run: `pytest tests/test_indicators.py -v` — expect FAIL
- [ ] Write `backend/services/indicators.py`:
```python
import pandas as pd
import numpy as np

def calculate_sma(close: pd.Series, period: int) -> pd.Series:
    return close.rolling(window=period).mean()

def calculate_ema(close: pd.Series, period: int) -> pd.Series:
    return close.ewm(span=period, adjust=False).mean()

def calculate_rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))

def calculate_macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = calculate_ema(close, fast)
    ema_slow = calculate_ema(close, slow)
    macd_line = ema_fast - ema_slow
    signal_line = calculate_ema(macd_line, signal)
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

def calculate_bollinger(close: pd.Series, period: int = 20, std_dev: float = 2):
    mid = calculate_sma(close, period)
    std = close.rolling(period).std()
    return mid + std_dev * std, mid, mid - std_dev * std

def add_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    c = df["close"]
    df["sma_20"] = calculate_sma(c, 20)
    df["sma_50"] = calculate_sma(c, 50)
    df["sma_200"] = calculate_sma(c, 200)
    df["ema_12"] = calculate_ema(c, 12)
    df["ema_26"] = calculate_ema(c, 26)
    df["rsi_14"] = calculate_rsi(c, 14)
    df["macd"], df["macd_signal"], df["macd_hist"] = calculate_macd(c)
    df["bb_upper"], df["bb_mid"], df["bb_lower"] = calculate_bollinger(c)
    return df
```
- [ ] Run: `pytest tests/test_indicators.py -v` — expect PASS
- [ ] Commit: `feat: indicator calculations — SMA, EMA, RSI, MACD, Bollinger`

---

## Task 7: Signal Generator

**Files:**
- Create: `backend/services/signal_generator.py`
- Create: `backend/tests/test_signal_generator.py`

- [ ] Write failing test `backend/tests/test_signal_generator.py`:
```python
import pytest
import pandas as pd
import numpy as np
from services.signal_generator import generate_signals_from_rules, generate_signals_from_code

@pytest.fixture
def sample_df():
    np.random.seed(42)
    n = 300
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5)
    df = pd.DataFrame({"open": prices, "high": prices * 1.01, "low": prices * 0.99,
                       "close": prices, "volume": np.random.randint(1000000, 5000000, n)},
                      index=pd.date_range("2020-01-01", periods=n, freq="B"))
    return df

def test_sma_crossover_signal(sample_df):
    rules = {
        "entry": [{"indicator": "SMA", "params": {"period": 20}, "operator": "crosses_above",
                   "target": {"indicator": "SMA", "params": {"period": 50}}}],
        "exit": [{"indicator": "SMA", "params": {"period": 20}, "operator": "crosses_below",
                  "target": {"indicator": "SMA", "params": {"period": 50}}}],
        "logic": "AND"
    }
    signals = generate_signals_from_rules(sample_df, rules)
    assert isinstance(signals, pd.Series)
    assert set(signals.unique()).issubset({0, 1, -1})

def test_rsi_threshold_signal(sample_df):
    rules = {
        "entry": [{"indicator": "RSI", "params": {"period": 14}, "operator": "<", "target": {"value": 30}}],
        "exit": [{"indicator": "RSI", "params": {"period": 14}, "operator": ">", "target": {"value": 70}}],
        "logic": "AND"
    }
    signals = generate_signals_from_rules(sample_df, rules)
    assert isinstance(signals, pd.Series)

def test_code_mode_signal(sample_df):
    code = """
def generate_signals(df):
    import pandas as pd
    signals = pd.Series(0, index=df.index)
    signals.iloc[10] = 1
    signals.iloc[20] = -1
    return signals
"""
    signals = generate_signals_from_code(sample_df, code)
    assert signals.iloc[10] == 1
    assert signals.iloc[20] == -1
```
- [ ] Run: `pytest tests/test_signal_generator.py -v` — expect FAIL
- [ ] Write `backend/services/signal_generator.py`:
```python
import pandas as pd
import numpy as np
from services.indicators import calculate_sma, calculate_ema, calculate_rsi, calculate_macd, calculate_bollinger

def _get_indicator_series(df: pd.DataFrame, indicator: str, params: dict) -> pd.Series:
    c = df["close"]
    if indicator == "SMA":
        return calculate_sma(c, params["period"])
    elif indicator == "EMA":
        return calculate_ema(c, params["period"])
    elif indicator == "RSI":
        return calculate_rsi(c, params.get("period", 14))
    elif indicator == "MACD":
        macd, _, _ = calculate_macd(c)
        return macd
    elif indicator == "MACD_SIGNAL":
        _, signal, _ = calculate_macd(c)
        return signal
    elif indicator == "BB_UPPER":
        upper, _, _ = calculate_bollinger(c)
        return upper
    elif indicator == "BB_LOWER":
        _, _, lower = calculate_bollinger(c)
        return lower
    elif indicator == "VOLUME":
        return df["volume"].astype(float)
    elif indicator == "CLOSE":
        return c
    raise ValueError(f"Unknown indicator: {indicator}")

def _apply_operator(series_a: pd.Series, op: str, target) -> pd.Series:
    if isinstance(target, pd.Series):
        b = target
    else:
        b = target

    if op == ">":
        return series_a > b
    elif op == "<":
        return series_a < b
    elif op == ">=":
        return series_a >= b
    elif op == "<=":
        return series_a <= b
    elif op == "crosses_above":
        return (series_a > b) & (series_a.shift(1) <= b.shift(1) if isinstance(b, pd.Series) else series_a.shift(1) <= b)
    elif op == "crosses_below":
        return (series_a < b) & (series_a.shift(1) >= b.shift(1) if isinstance(b, pd.Series) else series_a.shift(1) >= b)
    raise ValueError(f"Unknown operator: {op}")

def _evaluate_rule(df: pd.DataFrame, rule: dict) -> pd.Series:
    series_a = _get_indicator_series(df, rule["indicator"], rule["params"])
    t = rule["target"]
    if "value" in t:
        target = t["value"]
    else:
        target = _get_indicator_series(df, t["indicator"], t["params"])
    return _apply_operator(series_a, rule["operator"], target)

def generate_signals_from_rules(df: pd.DataFrame, rules: dict) -> pd.Series:
    signals = pd.Series(0, index=df.index, dtype=int)
    logic = rules.get("logic", "AND")

    entry_masks = [_evaluate_rule(df, r) for r in rules["entry"]]
    exit_masks = [_evaluate_rule(df, r) for r in rules["exit"]]

    if logic == "AND":
        entry = pd.concat(entry_masks, axis=1).all(axis=1)
        exit_ = pd.concat(exit_masks, axis=1).all(axis=1)
    else:
        entry = pd.concat(entry_masks, axis=1).any(axis=1)
        exit_ = pd.concat(exit_masks, axis=1).any(axis=1)

    signals[entry] = 1
    signals[exit_] = -1
    return signals

def generate_signals_from_code(df: pd.DataFrame, code: str) -> pd.Series:
    namespace = {}
    exec(compile(code, "<string>", "exec"), namespace)
    if "generate_signals" not in namespace:
        raise ValueError("Code must define generate_signals(df) function")
    return namespace["generate_signals"](df)
```
- [ ] Run: `pytest tests/test_signal_generator.py -v` — expect PASS
- [ ] Commit: `feat: signal generator — visual rules and code mode`

---

## Task 8: Portfolio Simulator + Metrics

**Files:**
- Create: `backend/services/portfolio_simulator.py`
- Create: `backend/services/metrics.py`
- Create: `backend/tests/test_portfolio_simulator.py`
- Create: `backend/tests/test_metrics.py`

- [ ] Write failing tests `backend/tests/test_portfolio_simulator.py`:
```python
import pytest
import pandas as pd
import numpy as np
from services.portfolio_simulator import simulate_portfolio

@pytest.fixture
def ohlcv():
    n = 252
    prices = 100 + np.cumsum(np.random.randn(n) * 0.5)
    return pd.DataFrame({"open": prices, "high": prices*1.01, "low": prices*0.99,
                         "close": prices, "volume": np.ones(n)*1e6},
                        index=pd.date_range("2022-01-01", periods=n, freq="B"))

@pytest.fixture
def simple_signals(ohlcv):
    s = pd.Series(0, index=ohlcv.index)
    s.iloc[10] = 1
    s.iloc[100] = -1
    return s

def test_portfolio_starts_at_capital(ohlcv, simple_signals):
    result = simulate_portfolio(ohlcv, simple_signals, 10000)
    assert result["equity_curve"].iloc[0] == pytest.approx(10000, rel=0.01)

def test_portfolio_has_required_keys(ohlcv, simple_signals):
    result = simulate_portfolio(ohlcv, simple_signals, 10000)
    assert "equity_curve" in result
    assert "trades" in result
    assert "drawdown" in result

def test_no_trades_means_flat_equity(ohlcv):
    signals = pd.Series(0, index=ohlcv.index)
    result = simulate_portfolio(ohlcv, signals, 10000)
    assert result["equity_curve"].iloc[-1] == pytest.approx(10000, rel=0.001)
```
- [ ] Write failing test `backend/tests/test_metrics.py`:
```python
import pytest
import pandas as pd
import numpy as np
from services.metrics import calculate_metrics

@pytest.fixture
def equity_curve():
    n = 252
    returns = np.random.randn(n) * 0.01 + 0.0003
    equity = 10000 * (1 + returns).cumprod()
    return pd.Series(equity, index=pd.date_range("2022-01-01", periods=n, freq="B"))

@pytest.fixture
def benchmark_curve(equity_curve):
    returns = np.random.randn(len(equity_curve)) * 0.008 + 0.0002
    bench = 10000 * (1 + returns).cumprod()
    return pd.Series(bench, index=equity_curve.index)

def test_metrics_returns_all_required_keys(equity_curve, benchmark_curve):
    trades = [{"type": "buy", "pnl": 100}, {"type": "sell", "pnl": -50}]
    m = calculate_metrics(equity_curve, benchmark_curve, trades, 10000)
    required = ["total_return","annualized_return","sharpe","sortino","max_drawdown",
                "max_drawdown_duration","win_rate","avg_win","avg_loss","num_trades",
                "alpha","beta","calmar"]
    for k in required:
        assert k in m, f"Missing key: {k}"

def test_total_return_positive_on_growth(equity_curve, benchmark_curve):
    trades = []
    m = calculate_metrics(equity_curve, benchmark_curve, trades, 10000)
    if equity_curve.iloc[-1] > 10000:
        assert m["total_return"] > 0
```
- [ ] Run both: `pytest tests/test_portfolio_simulator.py tests/test_metrics.py -v` — expect FAIL
- [ ] Write `backend/services/portfolio_simulator.py`:
```python
import pandas as pd
import numpy as np
from typing import Any

def simulate_portfolio(df: pd.DataFrame, signals: pd.Series, initial_capital: float,
                       commission_pct: float = 0.0) -> dict[str, Any]:
    equity = initial_capital
    position = 0
    entry_price = 0.0
    trades = []
    equity_curve = []

    for date, row in df.iterrows():
        sig = signals.get(date, 0)
        price = row["close"]

        if sig == 1 and position == 0:
            shares = equity / price
            cost = shares * price * commission_pct
            position = shares
            entry_price = price
            equity -= cost
            trades.append({"date": str(date.date()), "type": "buy", "price": price,
                           "shares": shares, "pnl": 0.0})

        elif sig == -1 and position > 0:
            proceeds = position * price
            cost = proceeds * commission_pct
            pnl = position * (price - entry_price) - cost
            equity = position * price - cost
            trades.append({"date": str(date.date()), "type": "sell", "price": price,
                           "shares": position, "pnl": round(pnl, 2)})
            position = 0
            entry_price = 0.0

        current_value = equity + position * price
        equity_curve.append({"date": str(date.date()), "equity": round(current_value, 2)})

    equity_series = pd.Series([e["equity"] for e in equity_curve],
                               index=df.index)
    running_max = equity_series.cummax()
    drawdown = (equity_series - running_max) / running_max

    return {
        "equity_curve": equity_series,
        "equity_curve_records": equity_curve,
        "drawdown": drawdown,
        "trades": trades,
    }
```
- [ ] Write `backend/services/metrics.py`:
```python
import pandas as pd
import numpy as np
from scipy import stats

TRADING_DAYS = 252

def calculate_metrics(equity: pd.Series, benchmark: pd.Series,
                      trades: list, initial_capital: float) -> dict:
    returns = equity.pct_change().dropna()
    bench_returns = benchmark.pct_change().dropna()

    total_return = (equity.iloc[-1] - initial_capital) / initial_capital
    n_years = len(equity) / TRADING_DAYS
    annualized_return = (1 + total_return) ** (1 / n_years) - 1 if n_years > 0 else 0

    sharpe = (returns.mean() / returns.std()) * np.sqrt(TRADING_DAYS) if returns.std() > 0 else 0
    downside = returns[returns < 0].std()
    sortino = (returns.mean() / downside) * np.sqrt(TRADING_DAYS) if downside > 0 else 0

    running_max = equity.cummax()
    drawdown_series = (equity - running_max) / running_max
    max_drawdown = drawdown_series.min()

    in_drawdown = drawdown_series < 0
    drawdown_duration = 0
    current_dd = 0
    for val in in_drawdown:
        if val:
            current_dd += 1
            drawdown_duration = max(drawdown_duration, current_dd)
        else:
            current_dd = 0

    calmar = annualized_return / abs(max_drawdown) if max_drawdown != 0 else 0

    winning = [t for t in trades if t.get("pnl", 0) > 0]
    losing = [t for t in trades if t.get("pnl", 0) < 0]
    win_rate = len(winning) / len(trades) if trades else 0
    avg_win = np.mean([t["pnl"] for t in winning]) if winning else 0
    avg_loss = np.mean([t["pnl"] for t in losing]) if losing else 0

    aligned = pd.concat([returns, bench_returns], axis=1).dropna()
    if len(aligned) > 2:
        slope, intercept, _, _, _ = stats.linregress(aligned.iloc[:, 1], aligned.iloc[:, 0])
        beta = slope
        alpha = (annualized_return - beta * ((1 + bench_returns.mean()) ** TRADING_DAYS - 1))
    else:
        beta, alpha = 0.0, 0.0

    return {
        "total_return": round(total_return, 4),
        "annualized_return": round(annualized_return, 4),
        "sharpe": round(sharpe, 4),
        "sortino": round(sortino, 4),
        "max_drawdown": round(max_drawdown, 4),
        "max_drawdown_duration": drawdown_duration,
        "win_rate": round(win_rate, 4),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "num_trades": len(trades),
        "alpha": round(alpha, 4),
        "beta": round(beta, 4),
        "calmar": round(calmar, 4),
    }
```
- [ ] Run: `pytest tests/test_portfolio_simulator.py tests/test_metrics.py -v` — expect PASS
- [ ] Commit: `feat: portfolio simulator and metrics calculator`

---

## Task 9: Backtest API Router

**Files:**
- Create: `backend/schemas/backtest.py`
- Create: `backend/routers/backtest.py`
- Create: `backend/schemas/strategy.py`

- [ ] Write `backend/schemas/backtest.py`:
```python
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
```
- [ ] Write `backend/routers/backtest.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.backtest import BacktestRequest, BacktestResponse
from services.data_service import fetch_ohlcv
from services.signal_generator import generate_signals_from_rules, generate_signals_from_code
from services.portfolio_simulator import simulate_portfolio
from services.metrics import calculate_metrics
from routers.auth import get_current_user
from models.backtest_run import BacktestRun

router = APIRouter()

@router.post("/run", response_model=BacktestResponse)
def run_backtest(req: BacktestRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        df = fetch_ohlcv(req.ticker, req.start_date, req.end_date)
        benchmark_df = fetch_ohlcv(req.benchmark, req.start_date, req.end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if req.strategy.mode == "visual":
        if not req.strategy.rules:
            raise HTTPException(status_code=400, detail="Visual mode requires rules")
        rules_dict = {
            "entry": [r.model_dump() for r in req.strategy.rules.entry],
            "exit": [r.model_dump() for r in req.strategy.rules.exit],
            "logic": req.strategy.rules.logic,
        }
        signals = generate_signals_from_rules(df, rules_dict)
    else:
        if not req.strategy.code:
            raise HTTPException(status_code=400, detail="Code mode requires code")
        try:
            signals = generate_signals_from_code(df, req.strategy.code)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Code error: {str(e)}")

    result = simulate_portfolio(df, signals, req.initial_capital)
    bench_result = simulate_portfolio(benchmark_df, signals * 0, req.initial_capital)
    metrics = calculate_metrics(result["equity_curve"], bench_result["equity_curve"],
                                result["trades"], req.initial_capital)

    equity_records = result["equity_curve_records"]
    bench_records = bench_result["equity_curve_records"]
    bench_map = {r["date"]: r["equity"] for r in bench_records}
    for rec in equity_records:
        rec["benchmark_equity"] = bench_map.get(rec["date"], req.initial_capital)

    drawdown_records = [{"date": str(d.date()), "drawdown": round(v, 4)}
                        for d, v in result["drawdown"].items()]

    run = BacktestRun(user_id=user.id, ticker=req.ticker,
                      start_date=req.start_date, end_date=req.end_date,
                      initial_capital=req.initial_capital, benchmark=req.benchmark,
                      metrics=metrics)
    db.add(run)
    db.commit()

    return BacktestResponse(metrics=metrics, equity_curve=equity_records,
                            drawdown=drawdown_records, trades=result["trades"])
```
- [ ] Start backend, test with `curl -X POST http://localhost:8000/backtest/run` using a test payload
- [ ] Verify response includes all required fields
- [ ] Commit: `feat: backtest API router — POST /backtest/run`

---

## Task 10: Visual Strategy Builder UI

**Files:**
- Create: `frontend/src/components/strategy/VisualBuilder.tsx`
- Create: `frontend/src/components/strategy/RuleCard.tsx`
- Create: `frontend/src/pages/StrategyPage.tsx`
- Create: `frontend/src/api/backtest.ts`

- [ ] Write `frontend/src/api/backtest.ts`:
```typescript
import client from "./client";
import { BacktestResult, BacktestRequest } from "../types";

export const runBacktest = (req: BacktestRequest) =>
  client.post<BacktestResult>("/backtest/run", req);
```
- [ ] Write `VisualBuilder.tsx` — component renders:
  - Indicator selector dropdown (SMA, EMA, RSI, MACD, Bollinger Bands, Volume, Close)
  - Operator dropdown (>, <, >=, <=, crosses_above, crosses_below)
  - Target: value input OR indicator selector + params
  - "Add Entry Rule" / "Add Exit Rule" buttons
  - AND/OR logic toggle
  - List of current rules as RuleCards with delete buttons
  - State: `{ entry: StrategyRule[], exit: StrategyRule[], logic: "AND" | "OR" }`
- [ ] Write `RuleCard.tsx` — shows rule in human-readable form with delete button
- [ ] Write `StrategyPage.tsx` with:
  - Mode toggle: "Visual" | "Code" | "AI"
  - Ticker input, date range pickers, initial capital input, benchmark input
  - VisualBuilder (when mode === "visual")
  - "Run Backtest" button
  - On submit: call `runBacktest()`, navigate to ResultsPage with result in state
- [ ] Wire route `/strategy` in `App.tsx` (protected)
- [ ] Test in browser: add rules, submit form, verify API call succeeds
- [ ] Commit: `feat: visual strategy builder UI`

---

## Task 11: Results Dashboard

**Files:**
- Create: `frontend/src/components/dashboard/EquityCurve.tsx`
- Create: `frontend/src/components/dashboard/DrawdownChart.tsx`
- Create: `frontend/src/components/dashboard/MonthlyHeatmap.tsx`
- Create: `frontend/src/components/dashboard/TradeLog.tsx`
- Create: `frontend/src/components/dashboard/MetricsPanel.tsx`
- Create: `frontend/src/pages/ResultsPage.tsx`

- [ ] Write `MetricsPanel.tsx` — grid of metric cards showing all 13 metrics from `BacktestMetrics` type with labels and tooltips (e.g., "Sharpe Ratio: ratio of excess return to std dev")
- [ ] Write `EquityCurve.tsx` using Recharts `LineChart`:
  - X-axis: date, Y-axis: equity
  - Two lines: strategy equity (blue) and benchmark equity (gray)
  - Toggle button to show/hide benchmark
  - Trade markers: green dots for buys, red dots for sells using `ReferenceLine` or custom dots
- [ ] Write `DrawdownChart.tsx` using Recharts `AreaChart`:
  - X-axis: date, Y-axis: drawdown (0 to -1 formatted as %)
  - Red filled area below zero
- [ ] Write `MonthlyHeatmap.tsx`:
  - Aggregate `equity_curve` into monthly returns
  - Render as table: rows = years, columns = months (Jan-Dec)
  - Cell color: green for positive, red for negative (intensity proportional to magnitude)
- [ ] Write `TradeLog.tsx` — sortable table: Date, Type, Price, Shares, P&L columns
- [ ] Write `ResultsPage.tsx`:
  - Receives `BacktestResult` via `useLocation` state
  - Shows MetricsPanel at top
  - EquityCurve below
  - DrawdownChart below
  - MonthlyHeatmap + TradeLog side by side
  - "Export PDF" button (wired in Task 13)
  - "Back to Builder" link
- [ ] Test in browser with a real backtest result
- [ ] Commit: `feat: results dashboard — equity curve, drawdown, heatmap, trade log`

---

## Task 12: AI Strategy Generator

**Files:**
- Create: `backend/services/ai_service.py`
- Create: `backend/routers/ai.py`
- Create: `frontend/src/api/ai.ts`
- Create: `frontend/src/components/strategy/AIGenerator.tsx`

- [ ] Write `backend/services/ai_service.py`:
```python
import anthropic
import json
from config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT = """You are a quantitative trading strategy assistant. Convert natural language strategy descriptions into a structured JSON config for a backtesting platform.

Output ONLY valid JSON in this exact format:
{
  "mode": "visual",
  "rules": {
    "entry": [
      {
        "indicator": "SMA",
        "params": {"period": 50},
        "operator": "crosses_above",
        "target": {"indicator": "SMA", "params": {"period": 200}}
      }
    ],
    "exit": [
      {
        "indicator": "RSI",
        "params": {"period": 14},
        "operator": ">",
        "target": {"value": 70}
      }
    ],
    "logic": "AND"
  },
  "position_sizing": {"type": "percent", "value": 100}
}

Valid indicators: SMA, EMA, RSI, MACD, MACD_SIGNAL, BB_UPPER, BB_LOWER, CLOSE, VOLUME
Valid operators: >, <, >=, <=, crosses_above, crosses_below
For target: use {"value": N} for numeric threshold, or {"indicator": "...", "params": {...}} for indicator comparison."""

def generate_strategy(description: str) -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": description}]
    )
    text = message.content[0].text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError("Could not parse strategy from AI response")
```
- [ ] Write `backend/routers/ai.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.ai_service import generate_strategy
from routers.auth import get_current_user

router = APIRouter()

class AIRequest(BaseModel):
    description: str

@router.post("/generate-strategy")
def generate(req: AIRequest, _=Depends(get_current_user)):
    try:
        strategy = generate_strategy(req.description)
        return {"strategy": strategy}
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not generate strategy: {str(e)}")
```
- [ ] Write `frontend/src/api/ai.ts`:
```typescript
import client from "./client";
import { StrategyConfig } from "../types";

export const generateStrategy = (description: string) =>
  client.post<{ strategy: StrategyConfig }>("/ai/generate-strategy", { description });
```
- [ ] Write `frontend/src/components/strategy/AIGenerator.tsx`:
  - Textarea for natural language description
  - "Generate Strategy" button with loading state
  - On success: calls `onStrategyGenerated(config)` prop to populate VisualBuilder
  - On error: shows error toast
  - Example placeholder text: "Buy when 50-day MA crosses above 200-day MA, sell when RSI exceeds 70"
- [ ] Wire AIGenerator into `StrategyPage.tsx` when mode === "ai"
- [ ] Test: enter "Buy when RSI drops below 30, sell when RSI exceeds 70", verify rules populate
- [ ] Commit: `feat: AI strategy generator — Claude API → visual rules`

---

## Task 13: Code Editor Mode

**Files:**
- Create: `frontend/src/components/strategy/CodeEditor.tsx`

- [ ] Write `frontend/src/components/strategy/CodeEditor.tsx`:
```typescript
import Editor from "@monaco-editor/react";

const DEFAULT_CODE = `def generate_signals(df):
    """
    df: pandas DataFrame with columns: open, high, low, close, volume
    Returns: pandas Series with values 1 (buy), -1 (sell), 0 (hold)
    """
    import pandas as pd
    signals = pd.Series(0, index=df.index)
    
    # Example: Simple 50/200 SMA crossover
    sma50 = df['close'].rolling(50).mean()
    sma200 = df['close'].rolling(200).mean()
    
    signals[sma50 > sma200] = 1
    signals[sma50 < sma200] = -1
    
    return signals
`;

interface Props { value: string; onChange: (v: string) => void; }

export default function CodeEditor({ value, onChange }: Props) {
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height="400px"
        defaultLanguage="python"
        theme="vs-dark"
        value={value || DEFAULT_CODE}
        onChange={(v) => onChange(v || "")}
        options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: "on" }}
      />
    </div>
  );
}
```
- [ ] Wire `CodeEditor` into `StrategyPage.tsx` when mode === "code"
- [ ] When switching Visual → Code: convert current visual rules to Python scaffold via template:
```typescript
function rulesToCode(rules: StrategyRuleSet): string {
  return `def generate_signals(df):
    import pandas as pd
    signals = pd.Series(0, index=df.index)
    # TODO: implement strategy based on visual rules
    # ${JSON.stringify(rules)}
    return signals`;
}
```
- [ ] Test in browser: switch to code mode, verify Monaco editor loads, edit code, run backtest
- [ ] Commit: `feat: Monaco code editor mode with visual-to-code scaffold`

---

## Task 14: Strategy CRUD + Saved Strategies

**Files:**
- Create: `backend/schemas/strategy.py`
- Create: `backend/routers/strategies.py`
- Create: `frontend/src/api/strategies.ts`
- Create: `frontend/src/pages/SavedStrategiesPage.tsx`

- [ ] Write `backend/schemas/strategy.py`:
```python
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
```
- [ ] Write `backend/routers/strategies.py`:
```python
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
def save_strategy(req: StrategySaveRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    count = db.query(Strategy).filter(Strategy.user_id == user.id).count()
    if count >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 strategies reached")
    s = Strategy(user_id=user.id, name=req.name, mode=req.mode, config=req.config)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.get("/{strategy_id}", response_model=StrategyResponse)
def get_strategy(strategy_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(Strategy).filter(Strategy.id == strategy_id, Strategy.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return s

@router.delete("/{strategy_id}", status_code=204)
def delete_strategy(strategy_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.query(Strategy).filter(Strategy.id == strategy_id, Strategy.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    db.delete(s)
    db.commit()
```
- [ ] Write `frontend/src/api/strategies.ts` — CRUD calls wrapping `/strategies` endpoints
- [ ] Write `SavedStrategiesPage.tsx` — lists saved strategies in cards showing name, mode, created date. "Load" button populates StrategyPage. "Delete" with confirmation. Shows count "X / 10 strategies used"
- [ ] Add "Save Strategy" button to `StrategyPage.tsx` — shows name input modal, calls save API
- [ ] Wire `/saved` route in App.tsx (protected)
- [ ] Test end-to-end: save strategy, navigate to saved page, load it back
- [ ] Commit: `feat: strategy CRUD and saved strategies page`

---

## Task 15: PDF Tearsheet Export

**Files:**
- Create: `backend/services/export_service.py`
- Create: `backend/routers/export.py`
- Modify: `frontend/src/pages/ResultsPage.tsx`

- [ ] Write `backend/services/export_service.py`:
```python
import io
from weasyprint import HTML

def generate_tearsheet(metrics: dict, equity_curve: list, trades: list,
                       ticker: str, start_date: str, end_date: str) -> bytes:
    metrics_rows = "".join(
        f"<tr><td>{k.replace('_', ' ').title()}</td><td>{v}</td></tr>"
        for k, v in metrics.items()
    )
    trades_rows = "".join(
        f"<tr><td>{t['date']}</td><td>{t['type'].upper()}</td>"
        f"<td>${t['price']:.2f}</td><td>{t['shares']:.2f}</td>"
        f"<td class='{'pos' if t['pnl'] >= 0 else 'neg'}'>${t['pnl']:.2f}</td></tr>"
        for t in trades[:50]
    )
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body {{ font-family: Arial, sans-serif; color: #1a1a2e; margin: 40px; }}
  h1 {{ color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }}
  h2 {{ color: #374151; margin-top: 24px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
  th {{ background: #4f46e5; color: white; padding: 8px; text-align: left; }}
  td {{ padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }}
  tr:nth-child(even) {{ background: #f9fafb; }}
  .pos {{ color: #059669; }} .neg {{ color: #dc2626; }}
  .header {{ display: flex; justify-content: space-between; margin-bottom: 24px; }}
  .badge {{ background: #ede9fe; color: #4f46e5; padding: 4px 12px; border-radius: 9999px; font-size: 12px; }}
</style></head>
<body>
  <div class="header">
    <div><h1>BacktestIQ Tearsheet</h1>
    <p><strong>{ticker}</strong> &nbsp; {start_date} – {end_date}</p></div>
    <span class="badge">MVP</span>
  </div>
  <h2>Performance Metrics</h2>
  <table><thead><tr><th>Metric</th><th>Value</th></tr></thead>
  <tbody>{metrics_rows}</tbody></table>
  <h2>Trade Log (first 50)</h2>
  <table><thead><tr><th>Date</th><th>Type</th><th>Price</th><th>Shares</th><th>P&L</th></tr></thead>
  <tbody>{trades_rows}</tbody></table>
</body></html>"""
    pdf_bytes = HTML(string=html).write_pdf()
    return pdf_bytes
```
- [ ] Write `backend/routers/export.py`:
```python
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from services.export_service import generate_tearsheet
from routers.auth import get_current_user
from typing import Any

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
    pdf = generate_tearsheet(req.metrics, req.equity_curve, req.trades,
                              req.ticker, req.start_date, req.end_date)
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename=tearsheet_{req.ticker}.pdf"})
```
- [ ] Add export function to `frontend/src/api/backtest.ts`:
```typescript
export const exportTearsheet = async (data: BacktestResult & { ticker: string; start_date: string; end_date: string }) => {
  const resp = await client.post("/export/tearsheet", data, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `tearsheet_${data.ticker}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
```
- [ ] Wire "Export PDF" button in `ResultsPage.tsx` to call `exportTearsheet`
- [ ] Test: run a backtest, click Export PDF, verify PDF downloads with correct content
- [ ] Commit: `feat: PDF tearsheet export via WeasyPrint`

---

## Task 16: Layout, Navigation, Home Page

**Files:**
- Create: `frontend/src/components/layout/Navbar.tsx`
- Create: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] Write `Navbar.tsx` — dark navbar with BacktestIQ logo, nav links (Home, New Strategy, Saved Strategies), user email + Logout button. Uses `useAuth()`.
- [ ] Write `HomePage.tsx` — landing page with hero section: title "BacktestIQ", subtitle "Test your trading strategies against real market data", CTA buttons "New Strategy" / "View Saved Strategies", brief feature list
- [ ] Wrap all protected pages in `<Layout>` (Navbar + `<main>{children}</main>`)
- [ ] Add `react-hot-toast` `<Toaster />` to App.tsx for notifications
- [ ] Test full app flow: register → home → new strategy → run → results → save → saved page
- [ ] Commit: `feat: navbar, home page, layout wrapper`

---

## Task 17: Polish + Error Handling

**Files:** Modify existing components across frontend and backend

- [ ] Add global error handler to FastAPI `main.py`:
```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})
```
- [ ] Add loading spinners to StrategyPage during backtest run (disable button, show spinner)
- [ ] Add metric tooltips to MetricsPanel (title attribute with explanation for each metric)
- [ ] Add empty state to SavedStrategiesPage when no strategies saved
- [ ] Add 404 page to App.tsx
- [ ] Add input validation: ticker non-empty, start < end date, capital > 0
- [ ] Test all error paths: bad ticker, Anthropic key missing, no rules defined
- [ ] Commit: `feat: error handling, loading states, input validation`
