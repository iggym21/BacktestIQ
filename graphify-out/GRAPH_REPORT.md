# Graph Report - .  (2026-05-27)

## Corpus Check
- Corpus is ~19,766 words - fits in a single context window. You may not need a graph.

## Summary
- 309 nodes · 333 edges · 66 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)
1. `StrategyPage` - 11 edges
2. `App()` - 10 edges
3. `ResultsPage` - 10 edges
4. `Auth Router (/auth)` - 9 edges
5. `Backtest Router (/backtest)` - 9 edges
6. `StrategyConfig Interface` - 9 edges
7. `BacktestIQ Platform` - 8 edges
8. `AuthContext Provider` - 7 edges
9. `add_all_indicators()` - 6 edges
10. `FastAPI Application Entry Point` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Auth Service (bcrypt + JWT)` --implements--> `JWT Authentication`  [EXTRACTED]
  backend/services/auth_service.py → BacktestIQ_PRD.md
- `Data Service (yfinance + SQLite cache)` --implements--> `OHLCV Market Data`  [EXTRACTED]
  backend/services/data_service.py → BacktestIQ_PRD.md
- `Backtest Router (/backtest)` --implements--> `Vectorized Backtest Execution`  [INFERRED]
  backend/routers/backtest.py → BacktestIQ_PRD.md
- `Axios API Client` --conceptually_related_to--> `Environment Variables Example`  [INFERRED]
  frontend/src/api/client.ts → .env.example
- `Decision: SQLite for Dev, PostgreSQL for Prod` --rationale_for--> `Database Engine and Session Factory`  [EXTRACTED]
  SESSION_NOTES.md → backend/database.py

## Hyperedges (group relationships)
- **End-to-End Backtest Execution Pipeline** — router_backtest, service_data, service_signal_generator, service_portfolio_simulator, service_metrics [EXTRACTED 1.00]
- **Indicator Computation to Signal Generation Pipeline** — service_indicators, service_signal_generator, concept_signal_series [EXTRACTED 1.00]
- **Authentication Stack** — service_auth, router_auth, schema_auth, model_user, concept_jwt [EXTRACTED 1.00]
- **Market Data Fetch and Cache Layer** — service_data, concept_market_data_cache, concept_ohlcv [EXTRACTED 1.00]
- **SQLAlchemy ORM Data Models** — model_user, model_strategy, model_backtest_run, backend_database [EXTRACTED 1.00]
- **Strategy Definition Modes** — prd_visual_mode, prd_code_mode, prd_ai_generator, service_signal_generator, service_ai [INFERRED 0.85]
- **Full Performance Metrics Set** — concept_sharpe, concept_drawdown, concept_equity_curve, service_metrics, service_portfolio_simulator [EXTRACTED 1.00]
- **Frontend Components Sharing Core Types** — types_strategyconfig, types_strategyruleset, types_strategyrule, comp_visualbuilder, comp_rulecard, comp_aigenerator, page_strategy [INFERRED 0.85]
- **ResultsPage Dashboard Component Assembly** — page_results, comp_metricspanel, comp_equitycurve, comp_drawdownchart, comp_monthlyheatmap, comp_tradelog [EXTRACTED 1.00]
- **Authentication Flow** — comp_loginform, comp_registerform, context_authcontext, api_auth, comp_protectedroute, api_client [EXTRACTED 1.00]
- **Strategy Builder Three Modes** — comp_visualbuilder, comp_codeeditor, comp_aigenerator, page_strategy [EXTRACTED 1.00]
- **Backend Test Suite** — test_conftest, test_auth, test_indicators, test_signal_generator, test_portfolio_simulator, test_metrics, test_data_service [EXTRACTED 1.00]
- **BacktestResult Composed Type Chain** — types_backtestresult, types_backtestmetrics, types_equitypoint, types_drawdownpoint, types_trade [EXTRACTED 1.00]
- **Page Layout Shell Components** — comp_layout, comp_navbar, comp_protectedroute [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (30): AI API Module, Auth API Module, Axios API Client, Strategies API Module, App(), AIGenerator Component, CodeEditor Component, Layout Component (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (27): Settings Configuration, Database Engine and Session Factory, FastAPI Application Entry Point, Claude API Integration, Market Data Cache (SQLite), Vectorized Backtest Execution, BacktestRun ORM Model, Strategy ORM Model (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (16): AIRequest, Config, RegisterRequest, TokenResponse, UserResponse, BacktestRequest, BacktestResponse, PositionSizing (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (23): Drawdown Calculation, Equity Curve, JWT Authentication, OHLCV Market Data, Sharpe Ratio, Signal Series (buy=1, sell=-1, hold=0), BacktestIQ MVP Implementation Plan, Backtest Engine (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (12): Backtest API Module, DrawdownChart Component, EquityCurve Component, MetricsPanel Component, MonthlyHeatmap Component, TradeLog Component, ResultsPage, BacktestMetrics Interface (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (6): BacktestRun, Base, Base, DeclarativeBase, Strategy, User

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.36
Nodes (5): authenticate_user(), create_user(), get_user_by_email(), hash_password(), verify_password()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.62
Nodes (6): add_all_indicators(), calculate_bollinger(), calculate_ema(), calculate_macd(), calculate_rsi(), calculate_sma()

### Community 10 - "Community 10"
Cohesion: 0.29
Nodes (7): Auth Tests, Test Conftest (Fixtures), Data Service Tests, Indicators Tests, Metrics Tests, Portfolio Simulator Tests, Signal Generator Tests

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.53
Nodes (4): _apply_operator(), _evaluate_rule(), generate_signals_from_rules(), _get_indicator_series()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (2): login(), register()

### Community 15 - "Community 15"
Cohesion: 0.6
Nodes (3): getConfig(), handleRun(), handleSave()

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.4
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (3): BaseSettings, Config, Settings

### Community 22 - "Community 22"
Cohesion: 0.83
Nodes (3): get_cached(), _get_conn(), set_cached()

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (1): initial  Revision ID: bfd47771c54b Revises:  Create Date: 2026-05-26 23:56:02.48

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (2): _fetch_from_yfinance(), fetch_ohlcv()

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): Tech Stack

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): System Architecture

## Knowledge Gaps
- **29 isolated node(s):** `Config`, `Config`, `Config`, `initial  Revision ID: bfd47771c54b Revises:  Create Date: 2026-05-26 23:56:02.48`, `Visual Mode` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 34`** (2 nodes): `LoginForm.tsx`, `LoginForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `RegisterForm.tsx`, `RegisterForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `Navbar.tsx`, `Navbar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `ProtectedRoute.tsx`, `ProtectedRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `Layout.tsx`, `Layout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `TradeLog.tsx`, `TradeLog()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `CodeEditor()`, `CodeEditor.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `handleGenerate()`, `AIGenerator.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `generateStrategy()`, `ai.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `ResultsPage.tsx`, `ResultsPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `HomePage.tsx`, `HomePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (2 nodes): `backtest.py`, `run_backtest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (2 nodes): `generate_strategy()`, `ai_service.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (2 nodes): `metrics.py`, `calculate_metrics()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (2 nodes): `portfolio_simulator.py`, `simulate_portfolio()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `export_service.py`, `generate_tearsheet()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `EquityCurve.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `DrawdownChart.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `MonthlyHeatmap.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `Tech Stack`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `System Architecture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Backtest Router (/backtest)` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `BacktestIQ Platform` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `Config`, `Config`, `Config` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._