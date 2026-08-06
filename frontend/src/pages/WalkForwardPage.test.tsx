import { describe, expect, it } from "vitest";
import { anyFoldLostMoney } from "./WalkForwardPage";
import type { BacktestMetrics, WalkForwardFold } from "../types";

const metrics = (overrides: Partial<BacktestMetrics>): BacktestMetrics => ({
  total_return: 0, annualized_return: 0, sharpe: 0, sortino: 0,
  max_drawdown: 0, max_drawdown_duration: 0, win_rate: 0, avg_win: 0,
  avg_loss: 0, num_trades: 0, alpha: 0, beta: 0, calmar: 0,
  ...overrides,
});

const fold = (n: number, m: Partial<BacktestMetrics> | null): WalkForwardFold => ({
  fold: n, start_date: "2020-01-01", end_date: "2020-06-01",
  metrics: m === null ? null : metrics(m), error: m === null ? "some error" : null,
});

describe("anyFoldLostMoney", () => {
  it("is false when every fold's total_return is non-negative, even if max_drawdown is very negative", () => {
    // Regression guard: the summary banner used to be driven by whichever
    // metric was selected for the chart. max_drawdown is <= 0 by
    // definition — any equity curve dips from its peak at some point —
    // so using it here would flag every run as a loss regardless of
    // actual profitability.
    const folds = [
      fold(1, { total_return: 0.12, max_drawdown: -0.18 }),
      fold(2, { total_return: 0.05, max_drawdown: -0.09 }),
    ];
    expect(anyFoldLostMoney(folds)).toBe(false);
  });

  it("is true when a fold's win_rate is 0 and total_return is negative", () => {
    // Regression guard: win_rate is always >= 0, so using it here would
    // never flag a loss even when every fold lost money outright.
    const folds = [
      fold(1, { total_return: -0.2, win_rate: 0 }),
      fold(2, { total_return: 0.1, win_rate: 0.6 }),
    ];
    expect(anyFoldLostMoney(folds)).toBe(true);
  });

  it("ignores folds that errored out", () => {
    const folds = [fold(1, { total_return: 0.1 }), fold(2, null)];
    expect(anyFoldLostMoney(folds)).toBe(false);
  });

  it("is false with no folds", () => {
    expect(anyFoldLostMoney([])).toBe(false);
  });
});
