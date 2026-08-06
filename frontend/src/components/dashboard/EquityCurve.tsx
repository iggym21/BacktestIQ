import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { EquityPoint, Trade } from "../../types";

interface Props {
  data: EquityPoint[];
  trades: Trade[];
}

export default function EquityCurve({ data, trades }: Props) {
  const [showBenchmark, setShowBenchmark] = useState(true);

  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(0, 7),
  }));

  // trades is used for potential future trade markers; suppress unused warning
  void trades;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Equity Curve</h3>
        <button onClick={() => setShowBenchmark((v) => !v)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${showBenchmark ? "border-slate-500 text-slate-300" : "border-slate-700 text-slate-500"}`}>
          Benchmark
        </button>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#fff" }}
            formatter={(v, name) => [`$${typeof v === "number" ? v.toLocaleString() : v}`, name === "equity" ? "Strategy" : "Benchmark"]} />
          <Line type="monotone" dataKey="equity" stroke="#7c3aed" strokeWidth={2} dot={false} name="Strategy" />
          {showBenchmark && (
            <Line type="monotone" dataKey="benchmark_equity" stroke="#475569" strokeWidth={1.5} dot={false} name="Benchmark" strokeDasharray="4 2" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
