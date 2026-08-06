import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Layout from "../components/layout/Layout";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import EquityCurve from "../components/dashboard/EquityCurve";
import DrawdownChart from "../components/dashboard/DrawdownChart";
import MonthlyHeatmap from "../components/dashboard/MonthlyHeatmap";
import TradeLog from "../components/dashboard/TradeLog";
import { exportTearsheet, shareBacktestRun } from "../api/backtest";
import type { BacktestResult } from "../types";
import toast from "react-hot-toast";

interface LocationState {
  result: BacktestResult;
  ticker: string;
  startDate: string;
  endDate: string;
}

export default function ResultsPage() {
  const { state } = useLocation() as { state: LocationState | null };
  const [sharing, setSharing] = useState(false);

  if (!state) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-slate-400 mb-4">No results to display.</p>
          <Link to="/strategy" className="text-violet-400 hover:text-violet-300">
            Back to Strategy Builder
          </Link>
        </div>
      </Layout>
    );
  }

  const { result, ticker, startDate, endDate } = state;

  const handleExport = async () => {
    try {
      await exportTearsheet({ ...result, ticker, start_date: startDate, end_date: endDate });
    } catch {
      toast.error("Export failed");
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const { data } = await shareBacktestRun(result.run_id);
      const url = `${window.location.origin}/public/${data.share_token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied to clipboard");
    } catch {
      toast.error("Failed to create share link");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {ticker} — Backtest Results
            </h2>
            <p className="text-slate-400 text-sm mt-1">{startDate} to {endDate}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleShare} disabled={sharing}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {sharing ? "Sharing…" : "Share"}
            </button>
            <button onClick={handleExport}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Export PDF
            </button>
            <Link to="/strategy"
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              New Backtest
            </Link>
          </div>
        </div>

        <MetricsPanel metrics={result.metrics} />
        <EquityCurve data={result.equity_curve} trades={result.trades} />
        <DrawdownChart data={result.drawdown} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyHeatmap data={result.equity_curve} />
          <TradeLog trades={result.trades} />
        </div>
      </div>
    </Layout>
  );
}
