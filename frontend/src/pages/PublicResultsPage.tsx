import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import EquityCurve from "../components/dashboard/EquityCurve";
import DrawdownChart from "../components/dashboard/DrawdownChart";
import MonthlyHeatmap from "../components/dashboard/MonthlyHeatmap";
import TradeLog from "../components/dashboard/TradeLog";
import ThemeToggle from "../components/layout/ThemeToggle";
import { getPublicResult } from "../api/backtest";
import type { PublicResult } from "../types";

export default function PublicResultsPage() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<PublicResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPublicResult(token)
      .then(({ data }) => setResult(data))
      .catch(() => setNotFound(true));
  }, [token]);

  return (
    <div className="min-h-screen bg-canvas text-ink transition-colors duration-300">
      <nav className="border-b px-6 py-3 flex items-center justify-between backdrop-blur-lg"
        style={{ background: "color-mix(in srgb, var(--surface) 85%, transparent)", borderColor: "var(--line)" }}>
        <Link to="/" className="flex items-center gap-2 text-ink font-bold text-lg tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-brand to-brand-strong">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
              <path d="M3 17l5-6 4 3 5-8 4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          BacktestIQ
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/strategy" className="text-brand hover:text-brand-strong text-sm font-medium">Build your own strategy →</Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {notFound ? (
          <div className="text-center py-20">
            <p className="text-ink-muted mb-4">This shared result doesn't exist or is no longer available.</p>
            <Link to="/" className="text-brand hover:text-brand-strong font-medium">Go home</Link>
          </div>
        ) : !result ? (
          <div className="text-center py-20 text-ink-muted">Loading…</div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <span className="text-xs bg-brand-soft text-brand px-2 py-1 rounded-full font-medium">Shared result — read only</span>
              <h2 className="text-2xl font-bold text-ink mt-2 font-mono">{result.ticker} — Backtest Results</h2>
              <p className="text-ink-muted text-sm mt-1">{result.start_date} to {result.end_date}</p>
            </div>

            <MetricsPanel metrics={result.metrics} />
            <EquityCurve data={result.equity_curve} trades={result.trades} />
            <DrawdownChart data={result.drawdown} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyHeatmap data={result.equity_curve} />
              <TradeLog trades={result.trades} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
