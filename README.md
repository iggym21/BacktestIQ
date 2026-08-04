# BacktestIQ

**Full-stack backtesting platform for equity trading strategies — build with a visual rule editor or Python, generate strategies from plain English via Claude, and get institutional-grade analytics.**

[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/build-Vite_6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Claude API](https://img.shields.io/badge/AI-Claude_API-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com/api)
[![License](https://img.shields.io/badge/license-Unlicensed-lightgrey)](#)

---

## What it does

BacktestIQ lets you define a trading strategy two ways — a **visual rule builder** (IF indicator crosses value THEN buy/sell) or a **Python code editor** — run it against real historical equity data, and inspect the results on a full analytics dashboard: equity curve, drawdown, monthly returns heatmap, trade log, and 13 performance metrics (Sharpe, Sortino, Calmar, alpha/beta, and more). Strategies can also be generated from a plain-English description via the Claude API, saved for later, and exported as a PDF tearsheet.

Built as both a personal research tool and a full-stack/quant portfolio piece.

## Features

- **Visual strategy builder** — SMA, EMA, RSI, MACD, Bollinger Bands, volume; combine conditions with AND/OR; fixed $, fixed shares, or % position sizing
- **Code mode** — write a `generate_signals(df)` strategy in Python with a Monaco editor
- **AI strategy generator** — describe a strategy in English, Claude turns it into a runnable config
- **Vectorized backtest engine** — pandas/numpy-based simulation with long-only and long/short support
- **Analytics dashboard** — equity curve, drawdown chart, monthly returns heatmap, trade log, 13 performance metrics
- **PDF tearsheet export** — one-click export of results via WeasyPrint
- **Auth + saved strategies** — JWT-based accounts, save/revisit past strategies and runs
- **Historical data** — free OHLCV via yfinance, cached server-side

## Tech stack

| Layer | Stack |
|---|---|
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic v2 |
| Auth | JWT (`python-jose`) + bcrypt (`passlib`) |
| Data & compute | pandas, numpy, scipy, yfinance |
| AI | Claude API (`anthropic`) |
| PDF export | WeasyPrint |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Frontend libs | React Router 7, Recharts, Monaco Editor, Axios |
| Database | SQLite (dev) / PostgreSQL (prod, via docker-compose) |

## Architecture

```
BacktestIQ/
├── backend/                 FastAPI app
│   ├── routers/              auth, strategies, backtest, data, ai, export
│   ├── services/              auth, data fetch/cache, indicators,
│   │                          signal generation, portfolio simulation,
│   │                          metrics, AI generation, PDF export
│   ├── models/                User, Strategy, BacktestRun (SQLAlchemy)
│   └── alembic/                DB migrations
└── frontend/                 React + TypeScript SPA
    └── src/
        ├── pages/              Home, Strategy, Results, Saved Strategies
        ├── components/         auth, strategy builder, dashboard, layout
        ├── api/                 typed API client (Axios + JWT interceptor)
        └── context/             auth state
```

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 20.15+ (Vite is pinned to v6 for compatibility — see [note](#notes))
- macOS users running the PDF export: `brew install pango cairo libffi`

### 1. Clone and configure
```bash
git clone https://github.com/iggym21/BacktestIQ.git
cd BacktestIQ
cp .env.example backend/.env
# edit backend/.env — set SECRET_KEY and ANTHROPIC_API_KEY at minimum
```

### 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# macOS: WeasyPrint needs pango/gobject on the dyld path
DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib uvicorn main:app --reload
```
API docs at `http://localhost:8000/docs`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
App at `http://localhost:5173`.

### 4. (Optional) PostgreSQL for prod-like setup
```bash
docker compose up -d
# then set DATABASE_URL=postgresql://backtestiq:secret@localhost:5432/backtestiq in backend/.env
```
SQLite is used by default in dev — no Docker required.

## Notes

- Dev machine pinned to **Vite 6** (Node 20.15 doesn't meet Vite 8's 20.19+ requirement) — bump `vite` back to `^8` after upgrading Node.
- `ANTHROPIC_API_KEY` is required for the AI strategy generator; the rest of the app works without it.
- Alpaca keys are wired into config for a future paper-trading feature but aren't required — historical data currently comes from yfinance.

## Roadmap

- [ ] Multi-ticker comparison
- [ ] Parameter optimization sweeps
- [ ] Walk-forward validation
- [ ] Alpaca paper trading integration
- [ ] Shareable public result URLs
- [ ] Strategy versioning
