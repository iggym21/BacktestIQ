import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/layout/Layout";
import VisualBuilder from "../components/strategy/VisualBuilder";
import PositionSizingInput from "../components/strategy/PositionSizingInput";
import { compareBacktest } from "../api/backtest";
import type { PositionSizing, StrategyRuleSet, TickerCompareResult } from "../types";

const DEFAULT_RULES: StrategyRuleSet = { entry: [], exit: [], logic: "AND" };
const DEFAULT_POSITION_SIZING: PositionSizing = { type: "percent", value: 100 };
const LINE_COLORS = ["#7c3aed", "#22c55e", "#f59e0b", "#ec4899", "#38bdf8"];

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export default function ComparePage() {
  const [tickersInput, setTickersInput] = useState("AAPL, MSFT, GOOGL");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2023-12-31");
  const [capital, setCapital] = useState(10000);
  const [benchmark, setBenchmark] = useState("SPY");
  const [rules, setRules] = useState<StrategyRuleSet>(DEFAULT_RULES);
  const [positionSizing, setPositionSizing] = useState<PositionSizing>(DEFAULT_POSITION_SIZING);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TickerCompareResult[] | null>(null);

  const handleRun = async () => {
    const tickers = tickersInput.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
    if (tickers.length === 0) return toast.error("Enter at least one ticker");
    if (tickers.length > 5) return toast.error("Maximum 5 tickers per comparison");
    if (rules.entry.length === 0) return toast.error("Add at least one entry rule");
    if (new Date(startDate) >= new Date(endDate)) return toast.error("Start date must be before end date");

    setLoading(true);
    setResults(null);
    try {
      const { data } = await compareBacktest({
        tickers, start_date: startDate, end_date: endDate,
        strategy: { mode: "visual", rules, position_sizing: positionSizing },
        initial_capital: capital, benchmark,
      });
      setResults(data.results);
      if (data.results.every((r) => r.error)) toast.error("All tickers failed — check symbols and date range");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message ?? "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  const successful = (results ?? []).filter((r) => r.metrics && r.equity_curve);

  // Normalize each ticker's equity curve to % return so tickers with very
  // different price levels can be compared on the same chart.
  const chartData = (() => {
    if (successful.length === 0) return [];
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of successful) {
      for (const point of r.equity_curve!) {
        const row = byDate.get(point.date) ?? { date: point.date };
        row[r.ticker] = ((point.equity - capital) / capital) * 100;
        byDate.set(point.date, row);
      }
    }
    return Array.from(byDate.values()).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  })();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Compare Tickers</h2>
        <p className="text-slate-400 text-sm mb-6">Run one strategy across up to 5 tickers and compare results side by side.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-3">
            <label htmlFor="compare-tickers" className="block text-xs text-slate-400 mb-1">Tickers (comma-separated, up to 5)</label>
            <input id="compare-tickers" value={tickersInput} onChange={(e) => setTickersInput(e.target.value)}
              placeholder="AAPL, MSFT, GOOGL"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label htmlFor="compare-start-date" className="block text-xs text-slate-400 mb-1">Start Date</label>
            <input id="compare-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="compare-end-date" className="block text-xs text-slate-400 mb-1">End Date</label>
            <input id="compare-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="compare-capital" className="block text-xs text-slate-400 mb-1">Capital ($)</label>
            <input id="compare-capital" type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <PositionSizingInput value={positionSizing} onChange={setPositionSizing} />
          <div>
            <label htmlFor="compare-benchmark" className="block text-xs text-slate-400 mb-1">Benchmark</label>
            <input id="compare-benchmark" value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <VisualBuilder value={rules} onChange={setRules} />
        </div>

        <button onClick={handleRun} disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mb-8">
          {loading ? <><span className="animate-spin">&#x27F3;</span> Comparing…</> : "Run Comparison"}
        </button>

        {results && (
          <div className="space-y-6">
            {chartData.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Return Comparison (%)</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false}
                      tickFormatter={(d: string) => d.slice(0, 7)} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false}
                      tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#fff" }}
                      formatter={(v) => [`${Number(v).toFixed(2)}%`, ""]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {successful.map((r, i) => (
                      <Line key={r.ticker} type="monotone" dataKey={r.ticker} name={r.ticker}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
              <h3 className="text-white font-semibold mb-4">Metrics</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left border-b border-slate-800">
                    <th className="py-2 pr-4">Ticker</th>
                    <th className="py-2 pr-4">Total Return</th>
                    <th className="py-2 pr-4">Ann. Return</th>
                    <th className="py-2 pr-4">Sharpe</th>
                    <th className="py-2 pr-4">Max Drawdown</th>
                    <th className="py-2 pr-4">Win Rate</th>
                    <th className="py-2 pr-4">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.ticker} className="border-b border-slate-800/50">
                      <td className="py-2 pr-4 text-white font-medium">{r.ticker}</td>
                      {r.error ? (
                        <td colSpan={6} className="py-2 pr-4 text-red-400">{r.error}</td>
                      ) : (
                        <>
                          <td className={`py-2 pr-4 ${r.metrics!.total_return >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct(r.metrics!.total_return)}</td>
                          <td className="py-2 pr-4 text-slate-200">{pct(r.metrics!.annualized_return)}</td>
                          <td className="py-2 pr-4 text-slate-200">{r.metrics!.sharpe.toFixed(3)}</td>
                          <td className="py-2 pr-4 text-red-400">{pct(r.metrics!.max_drawdown)}</td>
                          <td className="py-2 pr-4 text-slate-200">{pct(r.metrics!.win_rate)}</td>
                          <td className="py-2 pr-4 text-slate-200">{r.metrics!.num_trades}</td>
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
