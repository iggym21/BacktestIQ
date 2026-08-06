# BacktestIQ

**Full-stack backtesting platform for equity trading strategies — build with a visual rule editor or Python, generate strategies from plain English via Claude, and get institutional-grade analytics.**

[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/build-Vite_6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Claude API](https://img.shields.io/badge/AI-Claude_API-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com/api)
[![Tests](https://img.shields.io/badge/tests-108_passing-brightgreen)](#testing)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

---

## What it does

BacktestIQ lets you define a trading strategy two ways — a **visual rule builder** (IF indicator crosses value THEN buy/sell) or a **Python code editor** — run it against real historical equity data, and inspect the results on a full analytics dashboard: equity curve, drawdown, monthly returns heatmap, trade log, and 13 performance metrics (Sharpe, Sortino, Calmar, alpha/beta, and more). Strategies can also be generated from a plain-English description via the Claude API, saved for later, and exported as a PDF tearsheet.

Built as both a personal research tool and a full-stack/quant portfolio piece.

## Screenshots

<table>
<tr>
<td width="50%"><img src="docs/screenshots/02-home.jpg" alt="Home page"><br><sub>Home</sub></td>
<td width="50%"><img src="docs/screenshots/01-login.jpg" alt="Login page"><br><sub>Auth</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/03-strategy-builder-visual.jpg" alt="Visual strategy builder"><br><sub>Visual rule builder — indicator, operator, target, entry/exit</sub></td>
<td width="50%"><img src="docs/screenshots/06-code-editor.jpg" alt="Python code editor"><br><sub>Code mode — Monaco editor with a working <code>generate_signals(df)</code> template</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/04-results-dashboard.jpg" alt="Results dashboard"><br><sub>Results — 13 metrics + equity curve vs. buy-and-hold benchmark</sub></td>
<td width="50%"><img src="docs/screenshots/05-drawdown-heatmap-tradelog.jpg" alt="Drawdown, monthly heatmap, and trade log"><br><sub>Drawdown chart, monthly returns heatmap, full trade log</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/07-ai-generator.jpg" alt="AI strategy generator"><br><sub>AI generator — plain English → strategy config via Claude</sub></td>
<td width="50%"><img src="docs/screenshots/08-saved-strategies.jpg" alt="Saved strategies list"><br><sub>Saved strategies — load, rerun, or delete past strategies</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/09-compare-tickers.jpg" alt="Multi-ticker comparison"><br><sub>Compare — run one strategy across up to 5 tickers, normalized return overlay + side-by-side metrics</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/10-optimize-parameters.jpg" alt="Parameter optimization sweep"><br><sub>Optimize — sweep a rule parameter (e.g. SMA period) across a range, ranked by any metric</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/11-walk-forward.jpg" alt="Walk-forward validation"><br><sub>Walk-Forward — split the range into folds, catch strategies that only work in one market regime (fold #3 here spans the COVID crash and goes negative)</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/12-strategy-versioning.jpg" alt="Strategy version history"><br><sub>Strategy versioning — every update archives the previous rules/config, one click to restore</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/13-shareable-results.jpg" alt="Shareable public result link"><br><sub>Shareable results — one click generates a public, unauthenticated read-only link to a backtest's dashboard</sub></td>
</tr>
</table>

## Features

- **Visual strategy builder** — SMA, EMA, RSI, MACD, Bollinger Bands, volume; combine conditions with AND/OR; fixed $, fixed shares, or % position sizing
- **Code mode** — write a `generate_signals(df)` strategy in Python with a Monaco editor
- **AI strategy generator** — describe a strategy in English, Claude turns it into a runnable config
- **Vectorized backtest engine** — pandas/numpy-based simulation with long-only and long/short support
- **Analytics dashboard** — equity curve vs. buy-and-hold benchmark, drawdown chart, monthly returns heatmap, trade log, 13 performance metrics
- **Multi-ticker comparison** — run one strategy across up to 5 tickers, overlaid normalized-return chart + side-by-side metrics table
- **Parameter optimization** — sweep one rule parameter (e.g. a moving-average period) across a range, ranked by Sharpe/return/drawdown/Calmar
- **Walk-forward validation** — split the date range into consecutive folds and run the same fixed strategy on each, surfacing regime-dependence that a single full-period backtest hides
- **PDF tearsheet export** — one-click export of results via WeasyPrint
- **Auth + saved strategies with version history** — JWT-based accounts, save/revisit past strategies; every update archives the previous config and can be restored with one click
- **Shareable public results** — generate an unauthenticated read-only link to a backtest's full dashboard, no account needed to view
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
| CI | GitHub Actions — backend pytest + frontend typecheck/build on every push |

## Architecture

```
BacktestIQ/
├── backend/                 FastAPI app
│   ├── routers/              auth, strategies, backtest, data, ai, export, public
│   ├── services/              auth, data fetch/cache, indicators,
│   │                          signal generation, portfolio simulation,
│   │                          metrics, AI generation, PDF export
│   ├── models/                User, Strategy, StrategyVersion, BacktestRun (SQLAlchemy)
│   ├── tests/                  90 pytest tests: unit + end-to-end integration
│   └── alembic/                DB migrations
└── frontend/                 React + TypeScript SPA
    └── src/
        ├── pages/              Home, Strategy, Results, Saved Strategies
        ├── components/         auth, strategy builder, dashboard, layout
        ├── api/                 typed API client (Axios + JWT interceptor)
        └── context/             auth state
```

**Request flow for a backtest run:** the frontend posts ticker/date-range/strategy config to `POST /backtest/run` → the backend fetches (and caches) OHLCV data → generates buy/sell signals from either the visual rule tree or the submitted Python code → simulates the portfolio bar-by-bar → simulates a buy-and-hold benchmark over the same period → computes 13 performance metrics (including alpha/beta via linear regression against the benchmark) → persists the run and returns the full result set for the dashboard.

## Testing

Backend: 97 pytest tests — every service module has direct or integration coverage, including the AI generator's JSON-parsing/fallback logic against both clean and adversarial responses (mocked Claude client) and the PDF tearsheet export (real WeasyPrint invocation, asserts on the `%PDF` magic bytes). Covers indicators, signal generation, portfolio simulation (all three position-sizing modes), metrics, auth, data caching, config parsing, strategy CRUD + versioning (ownership isolation, version snapshots, cascade deletes), public result sharing (token generation, ownership checks, 404s for unshared/unknown runs), and end-to-end integration tests of the backtest, compare, parameter-sweep, and walk-forward endpoints — all with a stubbed data source so nothing touches the network.

```bash
cd backend && pytest -q
```

Frontend: 11 Vitest tests covering component behavior (regression guards for the tooltip-label and heatmap-color bugs fixed this session, position-sizing form logic) and the axios 401 → redirect-to-login decision logic, plus TypeScript strict mode. Both run in CI on every push.

```bash
cd frontend && npm test
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
uvicorn main:app --reload
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
- `ANTHROPIC_API_KEY` is required for the AI strategy generator; the rest of the app works without it, and a missing key fails gracefully with an in-app error rather than crashing.
- PDF export needs pango/cairo/gobject on the system (`brew install pango cairo libffi` on macOS, `apt install libpango-1.0-0 libpangoft2-1.0-0 libcairo2` on Debian/Ubuntu). No manual environment variable setup is required — the backend locates the libraries itself at runtime.
- Alpaca keys are wired into config for a future paper-trading feature but aren't required — historical data currently comes from yfinance.

## Roadmap

- [x] Multi-ticker comparison
- [x] Parameter optimization sweeps
- [x] Walk-forward validation
- [ ] Alpaca paper trading integration
- [x] Shareable public result URLs
- [x] Strategy versioning
