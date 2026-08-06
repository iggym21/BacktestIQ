import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import EquityCurve from "../components/dashboard/EquityCurve";
import DrawdownChart from "../components/dashboard/DrawdownChart";
import MonthlyHeatmap from "../components/dashboard/MonthlyHeatmap";
import TradeLog from "../components/dashboard/TradeLog";
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
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-lg tracking-tight">BacktestIQ</Link>
        <Link to="/strategy" className="text-violet-400 hover:text-violet-300 text-sm">Build your own strategy →</Link>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {notFound ? (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-4">This shared result doesn't exist or is no longer available.</p>
            <Link to="/" className="text-violet-400 hover:text-violet-300">Go home</Link>
          </div>
        ) : !result ? (
          <div className="text-center py-20 text-slate-400">Loading…</div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <span className="text-xs bg-violet-900/40 text-violet-300 px-2 py-1 rounded-full">Shared result — read only</span>
              <h2 className="text-2xl font-bold text-white mt-2">{result.ticker} — Backtest Results</h2>
              <p className="text-slate-400 text-sm mt-1">{result.start_date} to {result.end_date}</p>
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
