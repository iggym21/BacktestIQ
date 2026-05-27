# BacktestIQ Session Notes — 2026-05-27

## Status: ALL 16 TASKS COMPLETE ✅

The MVP is fully built. Both backend and frontend are complete. Tests pass. Frontend builds clean.

---

## What Was Built

### Backend (`backend/`)
All services implemented and tested (17/17 tests pass):

| File | Purpose |
|------|---------|
| `database.py` | SQLAlchemy engine + session factory (SQLite for dev) |
| `models/user.py` | User model (id, email, hashed_password) |
| `models/strategy.py` | Strategy model (id, user_id, name, mode, config JSON) |
| `models/backtest_run.py` | BacktestRun model with metrics JSON |
| `alembic/` | Migrations (initial: creates all 3 tables) |
| `services/auth_service.py` | bcrypt password hash + JWT (python-jose) |
| `services/data_service.py` | yfinance fetch + SQLite OHLCV cache |
| `services/indicators.py` | SMA, EMA, RSI, MACD, Bollinger Bands |
| `services/signal_generator.py` | Visual rules engine + code exec mode |
| `services/portfolio_simulator.py` | Vectorized trade sim, drawdown, equity curve |
| `services/metrics.py` | 13 metrics: Sharpe, Sortino, alpha, beta, Calmar, etc. |
| `services/ai_service.py` | Claude claude-sonnet-4-6 → structured strategy JSON |
| `services/export_service.py` | HTML → PDF via WeasyPrint (lazy-loaded) |
| `routers/auth.py` | POST /auth/register, POST /auth/login |
| `routers/backtest.py` | POST /backtest/run |
| `routers/strategies.py` | GET/POST/DELETE /strategies |
| `routers/data.py` | GET /data/ohlcv/{ticker}, GET /data/search |
| `routers/ai.py` | POST /ai/generate-strategy |
| `routers/export.py` | POST /export/tearsheet |

### Frontend (`frontend/src/`)
All components built, TypeScript clean, Vite 6 build passes (782 modules):

| File | Purpose |
|------|---------|
| `types/index.ts` | Full TypeScript interfaces for all domain objects |
| `api/client.ts` | Axios instance with JWT interceptor |
| `api/auth.ts` | register, login API calls |
| `api/backtest.ts` | runBacktest, exportTearsheet |
| `api/strategies.ts` | CRUD for saved strategies |
| `api/ai.ts` | generateStrategy |
| `context/AuthContext.tsx` | Auth state + localStorage persistence |
| `components/layout/` | Navbar, Layout, ProtectedRoute |
| `components/auth/` | LoginForm, RegisterForm |
| `components/strategy/` | VisualBuilder, RuleCard, CodeEditor, AIGenerator |
| `components/dashboard/` | MetricsPanel, EquityCurve, DrawdownChart, MonthlyHeatmap, TradeLog |
| `pages/` | HomePage, StrategyPage, ResultsPage, SavedStrategiesPage |
| `App.tsx` | BrowserRouter + all routes wired |

---

## Known Issues / Next Steps

### To Start Development
```bash
# Terminal 1 — Backend
cd backend
DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### PDF Export (WeasyPrint)
WeasyPrint needs `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib` set before starting the server, or it fails at runtime with a clean 500 error (lazy-loaded — does not crash server on startup).

To fix permanently:
```bash
brew install pango cairo libffi
export DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib
```

### Node.js Version
Current: v20.15.0. Vite 8 requires 20.19+. Pinned to Vite 6 (`^6.3.5`). If you upgrade Node to 22.x, you can bump Vite back to v8.

### Database
Using SQLite (`backend/backtestiq.db`) for dev. For production, set `DATABASE_URL=postgresql://...` in `.env` and `docker compose up -d`.

### Missing API Keys
Set in `backend/.env`:
- `ANTHROPIC_API_KEY=sk-ant-...` — required for AI strategy generator
- `ALPACA_API_KEY` / `ALPACA_SECRET_KEY` — optional (data service uses yfinance, not Alpaca)

### Pydantic Deprecation Warnings
`class Config:` inside Pydantic models is deprecated in Pydantic v2 — should migrate to `model_config = ConfigDict(...)`. Harmless for MVP but worth fixing before production.

### Suggested Next Features (Post-MVP)
1. Multi-ticker comparison — run same strategy on multiple tickers
2. Parameter optimization — sweep indicator parameters (e.g. SMA periods 10–100)
3. Walk-forward validation — out-of-sample testing
4. Paper trading integration — connect Alpaca for live paper trades
5. Shareable results — public URLs for backtest results
6. Strategy versioning — track changes to a saved strategy over time

---

## Git History
```
5672e0b fix: downgrade Vite 8 → 6 for Node 20.15 compatibility
7d1d804 feat: full backend + auth/strategy frontend (Tasks 2-15)
df39f81 feat: project scaffold — FastAPI + React + docker-compose
```

---

## Architecture Decisions Made
- **SQLite for dev, PostgreSQL for prod** — Docker not available locally; docker-compose.yml kept for production deployment
- **WeasyPrint lazy-loaded** — avoids server crash when gobject/pango dylibs not on dyld path; raises clean RuntimeError at export time
- **bcrypt==4.0.1 pinned** — bcrypt 5.x breaks passlib 1.7.4 backend detection
- **Vite 6 not 8** — Node 20.15 on this machine; Vite 8 requires 20.19+
- **No Alpaca for data** — yfinance used instead; Alpaca keys saved for future paper trading
