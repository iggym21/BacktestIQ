import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { EquityPoint, Trade } from "../../types";
import { useChartTheme } from "../../lib/chartTheme";

interface Props {
  data: EquityPoint[];
  trades: Trade[];
}

/** Exported for direct unit testing — Recharts only invokes this on hover,
 * which jsdom can't reliably simulate for SVG chart internals. Regression
 * guard for a bug where both series' tooltip rows showed the same label. */
export function formatTooltipValue(value: unknown, name: string): [string, string] {
  return [`$${typeof value === "number" ? value.toLocaleString() : value}`, name];
}

export default function EquityCurve({ data, trades }: Props) {
  const [showBenchmark, setShowBenchmark] = useState(true);
  const ct = useChartTheme();

  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(0, 7),
  }));

  // trades is used for potential future trade markers; suppress unused warning
  void trades;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-ink font-semibold">Equity Curve</h3>
        <button onClick={() => setShowBenchmark((v) => !v)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${showBenchmark ? "border-line-strong text-ink-muted" : "border-line text-ink-faint"}`}>
          Benchmark
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formatted} margin={{ left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="date" tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false}
            label={{ value: "Date", position: "insideBottom", offset: -6, fill: ct.axisLabel, fontSize: 11 }} />
          <YAxis tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            label={{ value: "Portfolio Value ($)", angle: -90, position: "insideLeft", fill: ct.axisLabel, fontSize: 11, style: { textAnchor: "middle" } }} />
          <Tooltip contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, color: ct.tooltipText, borderRadius: 10 }}
            formatter={(value, name) => formatTooltipValue(value, String(name))} />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 12, color: ct.axisLabel }} />
          <Line type="monotone" dataKey="equity" stroke={ct.brand} strokeWidth={2} dot={false} name="Strategy" />
          {showBenchmark && (
            <Line type="monotone" dataKey="benchmark_equity" stroke={ct.tick} strokeWidth={1.5} dot={false} name="Benchmark" strokeDasharray="4 2" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
