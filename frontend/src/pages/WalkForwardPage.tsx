import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/layout/Layout";
import VisualBuilder from "../components/strategy/VisualBuilder";
import PositionSizingInput from "../components/strategy/PositionSizingInput";
import { walkForwardBacktest } from "../api/backtest";
import type { BacktestMetrics, PositionSizing, StrategyRuleSet, WalkForwardFold } from "../types";

const DEFAULT_RULES: StrategyRuleSet = {
  entry: [{ indicator: "SMA", params: { period: 20 }, operator: "crosses_above", target: { indicator: "SMA", params: { period: 50 } } }],
  exit: [{ indicator: "SMA", params: { period: 20 }, operator: "crosses_below", target: { indicator: "SMA", params: { period: 50 } } }],
  logic: "AND",
};
const DEFAULT_POSITION_SIZING: PositionSizing = { type: "percent", value: 100 };

const METRIC_OPTIONS: { key: keyof BacktestMetrics; label: string; pct?: boolean }[] = [
  { key: "sharpe", label: "Sharpe Ratio" },
  { key: "total_return", label: "Total Return", pct: true },
  { key: "max_drawdown", label: "Max Drawdown", pct: true },
  { key: "win_rate", label: "Win Rate", pct: true },
];

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export default function WalkForwardPage() {
  const [ticker, setTicker] = useState("SPY");
  const [startDate, setStartDate] = useState("2018-01-01");
  const [endDate, setEndDate] = useState("2023-12-31");
  const [capital, setCapital] = useState(10000);
  const [benchmark, setBenchmark] = useState("SPY");
  const [rules, setRules] = useState<StrategyRuleSet>(DEFAULT_RULES);
  const [positionSizing, setPositionSizing] = useState<PositionSizing>(DEFAULT_POSITION_SIZING);
  const [folds, setFolds] = useState(4);
  const [metricKey, setMetricKey] = useState<keyof BacktestMetrics>("sharpe");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WalkForwardFold[] | null>(null);

  const handleRun = async () => {
    if (rules.entry.length === 0) return toast.error("Add at least one entry rule");
    if (new Date(startDate) >= new Date(endDate)) return toast.error("Start date must be before end date");
    if (capital <= 0) return toast.error("Capital must be positive");
    if (folds < 2 || folds > 12) return toast.error("Folds must be between 2 and 12");

    setLoading(true);
    setResult(null);
    try {
      const { data } = await walkForwardBacktest({
        ticker, start_date: startDate, end_date: endDate, benchmark, initial_capital: capital, folds,
        strategy: { mode: "visual", rules, position_sizing: positionSizing },
      });
      setResult(data.folds);
      if (data.folds.every((f) => f.error)) toast.error("Every fold failed — check the date range");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message ?? "Walk-forward run failed");
    } finally {
      setLoading(false);
    }
  };

  const metric = METRIC_OPTIONS.find((m) => m.key === metricKey)!;
  const chartData = (result ?? [])
    .filter((f) => f.metrics)
    .map((f) => ({
      fold: `#${f.fold}`,
      range: `${f.start_date} – ${f.end_date}`,
      metric: metric.pct ? f.metrics![metric.key] * 100 : f.metrics![metric.key],
    }));
  const values = chartData.map((d) => d.metric);
  const consistency = stdev(values);
  const worst = values.length > 0 ? Math.min(...values) : null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Walk-Forward Validation</h2>
        <p className="text-slate-400 text-sm mb-6">
          Split the date range into equal, consecutive folds and run the same fixed strategy on each — a strategy whose performance swings wildly fold to fold is regime-dependent, even if its full-period metrics look great.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="wf-ticker" className="block text-xs text-slate-400 mb-1">Ticker</label>
            <input id="wf-ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label htmlFor="wf-start-date" className="block text-xs text-slate-400 mb-1">Start Date</label>
            <input id="wf-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="wf-end-date" className="block text-xs text-slate-400 mb-1">End Date</label>
            <input id="wf-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="wf-capital" className="block text-xs text-slate-400 mb-1">Capital ($)</label>
            <input id="wf-capital" type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="wf-benchmark" className="block text-xs text-slate-400 mb-1">Benchmark</label>
            <input id="wf-benchmark" value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
          <PositionSizingInput value={positionSizing} onChange={setPositionSizing} />
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <VisualBuilder value={rules} onChange={setRules} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4">Fold Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wf-folds" className="block text-xs text-slate-400 mb-1">Number of folds</label>
              <input id="wf-folds" type="number" min={2} max={12} value={folds}
                onChange={(e) => setFolds(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="wf-metric" className="block text-xs text-slate-400 mb-1">Metric to chart</label>
              <select id="wf-metric" value={metricKey} onChange={(e) => setMetricKey(e.target.value as keyof BacktestMetrics)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm">
                {METRIC_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button onClick={handleRun} disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mb-8">
          {loading ? <><span className="animate-spin">&#x27F3;</span> Running folds…</> : "Run Walk-Forward"}
        </button>

        {result && (
          <div className="space-y-6">
            {worst !== null && (
              <div className={`border rounded-xl p-4 text-sm ${worst < 0 ? "bg-red-950/40 border-red-800 text-red-300" : "bg-emerald-950/40 border-emerald-800 text-emerald-300"}`}>
                {metric.label} ranged from <span className="font-semibold">{metric.pct ? `${Math.min(...values).toFixed(2)}%` : Math.min(...values).toFixed(3)}</span> to{" "}
                <span className="font-semibold">{metric.pct ? `${Math.max(...values).toFixed(2)}%` : Math.max(...values).toFixed(3)}</span> across folds
                (std dev {metric.pct ? `${consistency.toFixed(2)}%` : consistency.toFixed(3)}) — {worst < 0 ? "at least one fold lost money" : "consistently positive across folds"}.
              </div>
            )}

            {chartData.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">{metric.label} by Fold</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="fold" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false}
                      tickFormatter={(v: number) => metric.pct ? `${v.toFixed(0)}%` : v.toFixed(2)} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#fff" }}
                      formatter={(v) => [metric.pct ? `${Number(v).toFixed(2)}%` : Number(v).toFixed(3), metric.label]}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.range ?? label} />
                    <Bar dataKey="metric" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.metric >= 0 ? "#7c3aed" : "#dc2626"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
              <h3 className="text-white font-semibold mb-4">All Folds</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left border-b border-slate-800">
                    <th className="py-2 pr-4">Fold</th>
                    <th className="py-2 pr-4">Period</th>
                    <th className="py-2 pr-4">Total Return</th>
                    <th className="py-2 pr-4">Sharpe</th>
                    <th className="py-2 pr-4">Max Drawdown</th>
                    <th className="py-2 pr-4">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((f) => (
                    <tr key={f.fold} className="border-b border-slate-800/50">
                      <td className="py-2 pr-4 text-white font-medium">#{f.fold}</td>
                      <td className="py-2 pr-4 text-slate-400 text-xs">{f.start_date} – {f.end_date}</td>
                      {f.error ? (
                        <td colSpan={4} className="py-2 pr-4 text-red-400">{f.error}</td>
                      ) : (
                        <>
                          <td className={`py-2 pr-4 ${f.metrics!.total_return >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {(f.metrics!.total_return * 100).toFixed(2)}%
                          </td>
                          <td className="py-2 pr-4 text-slate-200">{f.metrics!.sharpe.toFixed(3)}</td>
                          <td className="py-2 pr-4 text-red-400">{(f.metrics!.max_drawdown * 100).toFixed(2)}%</td>
                          <td className="py-2 pr-4 text-slate-200">{f.metrics!.num_trades}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
