export interface User {
  id: string;
  email: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface StrategyRule {
  indicator: string;
  params: Record<string, number>;
  operator: string;
  target: { indicator?: string; params?: Record<string, number>; value?: number };
}

export interface StrategyRuleSet {
  entry: StrategyRule[];
  exit: StrategyRule[];
  logic: "AND" | "OR";
}

export interface PositionSizing {
  type: "dollar" | "shares" | "percent";
  value: number;
}

export interface StrategyConfig {
  mode: "visual" | "code";
  rules?: StrategyRuleSet;
  code?: string;
  position_sizing: PositionSizing;
}

export interface BacktestRequest {
  ticker: string;
  start_date: string;
  end_date: string;
  strategy: StrategyConfig;
  initial_capital: number;
  benchmark: string;
}

export interface BacktestMetrics {
  total_return: number;
  annualized_return: number;
  sharpe: number;
  sortino: number;
  max_drawdown: number;
  max_drawdown_duration: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  num_trades: number;
  alpha: number;
  beta: number;
  calmar: number;
}

export interface Trade {
  date: string;
  type: "buy" | "sell";
  price: number;
  shares: number;
  pnl: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  benchmark_equity: number;
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;
}

export interface BacktestResult {
  metrics: BacktestMetrics;
  equity_curve: EquityPoint[];
  drawdown: DrawdownPoint[];
  trades: Trade[];
}

export interface CompareRequest {
  tickers: string[];
  start_date: string;
  end_date: string;
  strategy: StrategyConfig;
  initial_capital: number;
  benchmark: string;
}

export interface TickerCompareResult {
  ticker: string;
  metrics: BacktestMetrics | null;
  equity_curve: EquityPoint[] | null;
  error: string | null;
}

export interface CompareResult {
  results: TickerCompareResult[];
}

export interface SweepRequest {
  ticker: string;
  start_date: string;
  end_date: string;
  strategy: StrategyConfig;
  initial_capital: number;
  benchmark: string;
  rule_group: "entry" | "exit";
  rule_index: number;
  param: string;
  start: number;
  stop: number;
  step: number;
}

export interface SweepPoint {
  value: number;
  metrics: BacktestMetrics | null;
  error: string | null;
}

export interface SweepResult {
  points: SweepPoint[];
}

export interface SavedStrategy {
  id: string;
  name: string;
  mode: string;
  config: StrategyConfig;
  created_at: string;
}
