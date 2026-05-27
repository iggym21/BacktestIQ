# BacktestIQ — Product Requirements Document

**Version:** 1.0  
**Author:** Ignatius  
**Date:** May 2026  
**Status:** Draft

---

## 1. Overview

BacktestIQ is a publicly hosted, full-stack backtesting platform that lets users define trading strategies through a visual builder or a Python code editor, run simulations against real historical market data, and analyze results through a professional-grade analytics dashboard. A Claude API integration allows users to describe strategies in plain English and have logic generated automatically. Users can save strategies, revisit past runs, and export results as a PDF tearsheet.

The project serves two purposes: a personal tool for trading research, and a polished portfolio piece demonstrating full-stack, ML, and cloud skills.

---

## 2. Goals

- Build a working MVP within 1–2 weeks, publicly accessible
- Demonstrate full-stack + quant competency for recruiting (Citi, DE Shaw, etc.)
- Be genuinely useful for personal strategy research
- Leverage AWS infrastructure for credibility as an SBCL

---

## 3. Non-Goals (MVP)

- Live / paper trading execution
- Options or futures support (equities only for MVP)
- Mobile-native app
- Social features (sharing strategies publicly)
- Paid tiers or billing

---

## 4. Target Users

**Primary:** Ignatius — personal strategy research  
**Secondary:** Recruiters and technical interviewers reviewing the portfolio  
**Tertiary:** Finance/CS students who find the tool and create accounts

---

## 5. Core Features

### 5.1 Strategy Builder

Two modes, switchable per strategy:

**Visual Mode**
- Preset indicators: SMA, EMA, RSI, MACD, Bollinger Bands, Volume
- Entry/exit rule builder: IF [indicator] [operator] [value/indicator] THEN [buy/sell]
- Supports combining multiple conditions with AND/OR logic
- Position sizing: fixed dollar amount, fixed share count, or % of portfolio

**Code Mode**
- Python editor (Monaco or CodeMirror) with a predefined strategy class interface
- Users implement `generate_signals(df)` returning a signals Series
- Syntax highlighting, basic linting
- Can switch from Visual → Code (visual rules exported as Python scaffold)

### 5.2 AI Strategy Generator (Claude API)

- Text input: "Buy when 50-day MA crosses above 200-day MA, sell when RSI exceeds 70"
- Claude API call generates the visual builder config (or Python code) from the description
- User can review and edit before running
- Fallback error message if parsing fails

### 5.3 Data Layer

- **Primary source:** Alpaca Markets API (free tier) for US equities historical OHLCV
- **Fallback:** yfinance for symbols not covered by Alpaca
- Supported: any US equity ticker, date range selectable by user
- Data cached server-side (SQLite or Redis) to avoid redundant API calls

### 5.4 Backtest Engine

- Vectorized execution using pandas/numpy (not event-driven for MVP)
- Supports long-only and long/short strategies
- Commissions: configurable flat fee or % per trade (default: $0 for simplicity)
- Benchmark comparison: S&P 500 (SPY) by default, user-selectable

**Output metrics:**
- Total return, annualized return
- Sharpe ratio, Sortino ratio
- Max drawdown, max drawdown duration
- Win rate, average win/loss
- Number of trades
- Alpha and Beta vs benchmark
- Calmar ratio

### 5.5 Results Dashboard

- Equity curve chart (Recharts) with trade entry/exit markers
- Drawdown chart
- Monthly returns heatmap
- Trade log table (date, type, price, P&L)
- Benchmark overlay toggle
- Side-by-side strategy comparison (run two strategies, compare metrics)

### 5.6 PDF Tearsheet Export

- One-click export of results as a professional PDF
- Includes: strategy summary, key metrics table, equity curve chart, trade log
- Styled like a mini hedge fund report (logo, clean layout)
- Generated server-side using WeasyPrint or ReportLab

### 5.7 User Auth & Saved Strategies

- Auth: email/password with JWT (or OAuth via Google for simplicity)
- Users can save named strategies
- Saved run history with timestamps and summary metrics
- Max 10 saved strategies per user (MVP limit)

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Recharts + Tailwind CSS |
| Code Editor | Monaco Editor (embedded) |
| Backend | FastAPI (Python) |
| Backtest Engine | pandas, numpy |
| Database | PostgreSQL (user data, strategy storage) |
| Cache | Redis or SQLite (market data cache) |
| Auth | JWT + bcrypt (or Supabase Auth) |
| AI Integration | Anthropic Claude API (claude-sonnet-4-20250514) |
| Market Data | Alpaca API + yfinance fallback |
| PDF Export | WeasyPrint |
| Hosting | AWS (EC2 or ECS) + S3 for static assets + CloudFront CDN |
| CI/CD | GitHub Actions → AWS deploy |

---

## 7. Architecture

```
[React Frontend]
    ↓ REST API
[FastAPI Backend]
    ├── /auth          — register, login, JWT
    ├── /strategies    — CRUD for saved strategies
    ├── /backtest      — run engine, return results
    ├── /data          — fetch/cache OHLCV data
    ├── /ai            — Claude API strategy generation
    └── /export        — PDF tearsheet generation
    ↓
[PostgreSQL]   [Redis cache]   [Alpaca API / yfinance]   [Claude API]
```

---

## 8. MVP Scope & Milestones

### Week 1

| Day | Task |
|---|---|
| 1–2 | Project scaffold: FastAPI + React boilerplate, DB schema, auth endpoints |
| 3 | Data layer: Alpaca integration, caching, ticker search |
| 4–5 | Backtest engine: vectorized core, metrics calculation |
| 6–7 | Visual strategy builder UI + wiring to engine |

### Week 2

| Day | Task |
|---|---|
| 8 | Results dashboard: equity curve, drawdown chart, metrics panel |
| 9 | Claude API integration: natural language → strategy config |
| 10 | Code editor mode (Monaco) + visual↔code toggle |
| 11 | PDF tearsheet export |
| 12 | User auth + saved strategies |
| 13 | AWS deployment, domain, HTTPS |
| 14 | Polish, bug fixes, README, demo video |

---

## 9. API Contracts (Key Endpoints)

### `POST /backtest/run`
```json
Request:
{
  "ticker": "AAPL",
  "start_date": "2020-01-01",
  "end_date": "2024-01-01",
  "strategy": {
    "mode": "visual",  // or "code"
    "rules": [...],    // visual mode
    "code": "..."      // code mode
  },
  "initial_capital": 10000,
  "benchmark": "SPY"
}

Response:
{
  "metrics": { "total_return": 0.42, "sharpe": 1.3, ... },
  "equity_curve": [...],
  "trades": [...],
  "drawdown": [...]
}
```

### `POST /ai/generate-strategy`
```json
Request:
{ "description": "Buy when 50-day MA crosses above 200-day MA" }

Response:
{ "strategy": { "mode": "visual", "rules": [...] } }
```

---

## 10. Design Principles

- **Speed first:** results should render within 3 seconds for a 5-year backtest
- **Clarity over complexity:** metrics explained with tooltips; no jargon without context
- **Professional aesthetic:** dark-mode dashboard, clean charts — looks like a real trading tool
- **Fail gracefully:** if Alpaca is down, fall back to yfinance silently; if Claude API fails, show manual builder

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| End-to-end backtest runs without errors | ✅ for 20+ tickers |
| Strategy generated from natural language | ✅ for common strategies (MA, RSI, MACD) |
| PDF export works | ✅ |
| Publicly accessible with auth | ✅ |
| Load time for results | < 3s |
| Deployed on AWS | ✅ |

---

## 12. Future Roadmap (Post-MVP)

- Event-driven backtesting engine (more accurate fills, slippage)
- Options strategy support
- Walk-forward optimization / parameter sweeps
- Strategy marketplace (share/browse community strategies)
- Real-time paper trading mode via Alpaca
- Mobile-responsive UI
- Subscription tier with unlimited saves and faster compute
