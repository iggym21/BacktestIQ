import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import Layout from "../components/layout/Layout";
import VisualBuilder from "../components/strategy/VisualBuilder";
import { sweepBacktest } from "../api/backtest";
import { useChartTheme } from "../lib/chartTheme";
import type { BacktestMetrics, StrategyRuleSet, SweepPoint } from "../types";

const DEFAULT_RULES: StrategyRuleSet = {
  entry: [{ indicator: "SMA", params: { period: 20 }, operator: "crosses_above", target: { indicator: "SMA", params: { period: 50 } } }],
  exit: [{ indicator: "SMA", params: { period: 20 }, operator: "crosses_below", target: { indicator: "SMA", params: { period: 50 } } }],
  logic: "AND",
};

const MAX_SWEEP_POINTS = 20; // must match backend's MAX_SWEEP_POINTS in services/backtest_service.py

const METRIC_OPTIONS: { key: keyof BacktestMetrics; label: string; pct?: boolean }[] = [
  { key: "sharpe", label: "Sharpe Ratio" },
  { key: "total_return", label: "Total Return", pct: true },
  { key: "annualized_return", label: "Ann. Return", pct: true },
  { key: "max_drawdown", label: "Max Drawdown", pct: true },
  { key: "calmar", label: "Calmar Ratio" },
];

interface SweepTarget {
  group: "entry" | "exit";
  index: number;
  param: string;
  label: string;
}

function sweepTargets(rules: StrategyRuleSet): SweepTarget[] {
  const targets: SweepTarget[] = [];
  for (const group of ["entry", "exit"] as const) {
    rules[group].forEach((rule, index) => {
      Object.keys(rule.params).forEach((param) => {
        targets.push({
          group, index, param,
          label: `${group === "entry" ? "Entry" : "Exit"} #${index + 1}: ${rule.indicator}.${param}`,
        });
      });
    });
  }
  return targets;
}

export default function OptimizePage() {
  const ct = useChartTheme();
  const [ticker, setTicker] = useState("SPY");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2023-12-31");
  const [capital, setCapital] = useState(10000);
  const [benchmark, setBenchmark] = useState("SPY");
  const [rules, setRules] = useState<StrategyRuleSet>(DEFAULT_RULES);
  const [targetKey, setTargetKey] = useState(0);
  const [rangeStart, setRangeStart] = useState(10);
  const [rangeStop, setRangeStop] = useState(50);
  const [rangeStep, setRangeStep] = useState(5);
  const [metricKey, setMetricKey] = useState<keyof BacktestMetrics>("sharpe");
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<SweepPoint[] | null>(null);

  const targets = useMemo(() => sweepTargets(rules), [rules]);
  const target = targets[targetKey];

  const handleRun = async () => {
    if (!target) return toast.error("Add a rule with a numeric parameter (e.g. an SMA period) to sweep");
    if (rangeStop < rangeStart) return toast.error("Range stop must be >= start");
    if (rangeStep <= 0) return toast.error("Step must be positive");
    if (new Date(startDate) >= new Date(endDate)) return toast.error("Start date must be before end date");
    if (capital <= 0) return toast.error("Capital must be positive");
    const pointCount = Math.floor((rangeStop - rangeStart) / rangeStep) + 1;
    if (pointCount > MAX_SWEEP_POINTS) {
      return toast.error(`That range would run ${pointCount} backtests — maximum is ${MAX_SWEEP_POINTS}. Widen the step or narrow the range.`);
    }

    setLoading(true);
    setPoints(null);
    try {
      const { data } = await sweepBacktest({
        ticker, start_date: startDate, end_date: endDate, benchmark, initial_capital: capital,
        strategy: { mode: "visual", rules, position_sizing: { type: "percent", value: 100 } },
        rule_group: target.group, rule_index: target.index, param: target.param,
        start: rangeStart, stop: rangeStop, step: rangeStep,
      });
      setPoints(data.points);
      if (data.points.every((p) => p.error)) toast.error("Every point in the sweep failed — check the range");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message ?? "Sweep failed");
    } finally {
      setLoading(false);
    }
  };

  const metric = METRIC_OPTIONS.find((m) => m.key === metricKey)!;
  const chartData = (points ?? [])
    .filter((p) => p.metrics)
    .map((p) => ({ value: p.value, metric: metric.pct ? p.metrics![metric.key] * 100 : p.metrics![metric.key] }));
  const best = chartData.length > 0
    ? chartData.reduce((a, b) => (b.metric > a.metric ? b : a))
    : null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-ink mb-1">Optimize Parameters</h2>
        <p className="text-ink-muted text-sm mb-6">
          Sweep one rule parameter across a range and see which value maximizes a metric — the rest of the strategy stays fixed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="optimize-ticker" className="block text-xs text-ink-muted mb-1">Ticker</label>
            <input id="optimize-ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="surface-input w-full px-3 py-2 text-sm uppercase font-mono" />
          </div>
          <div>
            <label htmlFor="optimize-start-date" className="block text-xs text-ink-muted mb-1">Start Date</label>
            <input id="optimize-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="surface-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="optimize-end-date" className="block text-xs text-ink-muted mb-1">End Date</label>
            <input id="optimize-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="surface-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="optimize-capital" className="block text-xs text-ink-muted mb-1">Capital ($)</label>
            <input id="optimize-capital" type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
              className="surface-input w-full px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label htmlFor="optimize-benchmark" className="block text-xs text-ink-muted mb-1">Benchmark</label>
            <input id="optimize-benchmark" value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
              className="surface-input w-full px-3 py-2 text-sm uppercase font-mono" />
          </div>
        </div>

        <div className="card p-6 mb-6">
          <VisualBuilder value={rules} onChange={setRules} />
        </div>

        <div className="card p-5 mb-6">
          <h3 className="text-ink font-semibold mb-4">Sweep Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2">
              <label htmlFor="optimize-target" className="block text-xs text-ink-muted mb-1">Parameter to sweep</label>
              <select id="optimize-target" value={targetKey} onChange={(e) => setTargetKey(Number(e.target.value))}
                disabled={targets.length === 0}
                className="surface-input w-full px-3 py-2 text-sm disabled:opacity-50">
                {targets.length === 0
                  ? <option>No numeric parameters — add a rule above</option>
                  : targets.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="optimize-range-from" className="block text-xs text-ink-muted mb-1">From</label>
              <input id="optimize-range-from" type="number" value={rangeStart} onChange={(e) => setRangeStart(Number(e.target.value))}
                className="surface-input w-full px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label htmlFor="optimize-range-to" className="block text-xs text-ink-muted mb-1">To</label>
              <input id="optimize-range-to" type="number" value={rangeStop} onChange={(e) => setRangeStop(Number(e.target.value))}
                className="surface-input w-full px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label htmlFor="optimize-range-step" className="block text-xs text-ink-muted mb-1">Step</label>
              <input id="optimize-range-step" type="number" value={rangeStep} onChange={(e) => setRangeStep(Number(e.target.value))}
                className="surface-input w-full px-3 py-2 text-sm font-mono" />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="optimize-metric" className="block text-xs text-ink-muted mb-1">Optimize for</label>
            <select id="optimize-metric" value={metricKey} onChange={(e) => setMetricKey(e.target.value as keyof BacktestMetrics)}
              className="surface-input w-full md:w-64 px-3 py-2 text-sm">
              {METRIC_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleRun} disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-8">
          {loading ? <><span className="animate-spin">&#x27F3;</span> Sweeping…</> : "Run Sweep"}
        </button>

        {points && (
          <div className="space-y-6">
            {best && (
              <div className="rounded-xl p-4 text-sm border" style={{ background: "var(--positive-soft)", borderColor: "var(--positive)", color: "var(--positive)" }}>
                Best {metric.label.toLowerCase()}: <span className="font-semibold font-mono">{metric.pct ? `${best.metric.toFixed(2)}%` : best.metric.toFixed(3)}</span> at {target?.param} = <span className="font-semibold font-mono">{best.value}</span>
              </div>
            )}

            {chartData.length > 0 && (
              <div className="card p-5">
                <h3 className="text-ink font-semibold mb-4">{metric.label} by {target?.param}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
                    <XAxis dataKey="value" tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false}
                      label={{ value: target?.param ?? "Value", position: "insideBottom", offset: -6, fill: ct.axisLabel, fontSize: 11 }} />
                    <YAxis tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false}
                      tickFormatter={(v: number) => metric.pct ? `${v.toFixed(0)}%` : v.toFixed(2)}
                      label={{ value: metric.label, angle: -90, position: "insideLeft", fill: ct.axisLabel, fontSize: 11, style: { textAnchor: "middle" } }} />
                    <Tooltip contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, color: ct.tooltipText, borderRadius: 10 }}
                      formatter={(v) => [metric.pct ? `${Number(v).toFixed(2)}%` : Number(v).toFixed(3), metric.label]} />
                    <Bar dataKey="metric" fill={ct.brand} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="card p-5 overflow-x-auto">
              <h3 className="text-ink font-semibold mb-4">All Points</h3>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="text-ink-muted text-left border-b" style={{ borderColor: "var(--line)" }}>
                    <th className="py-2 pr-4 font-sans font-medium">{target?.param ?? "value"}</th>
                    <th className="py-2 pr-4 font-sans font-medium">Total Return</th>
                    <th className="py-2 pr-4 font-sans font-medium">Sharpe</th>
                    <th className="py-2 pr-4 font-sans font-medium">Max Drawdown</th>
                    <th className="py-2 pr-4 font-sans font-medium">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.value} className="border-b" style={{ borderColor: "var(--line)" }}>
                      <td className="py-2 pr-4 text-ink font-medium">{p.value}</td>
                      {p.error ? (
                        <td colSpan={4} className="py-2 pr-4 text-negative font-sans">{p.error}</td>
                      ) : (
                        <>
                          <td className={`py-2 pr-4 ${p.metrics!.total_return >= 0 ? "text-positive" : "text-negative"}`}>
                            {(p.metrics!.total_return * 100).toFixed(2)}%
                          </td>
                          <td className="py-2 pr-4 text-ink-muted">{p.metrics!.sharpe.toFixed(3)}</td>
                          <td className="py-2 pr-4 text-negative">{(p.metrics!.max_drawdown * 100).toFixed(2)}%</td>
                          <td className="py-2 pr-4 text-ink-muted">{p.metrics!.num_trades}</td>
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
