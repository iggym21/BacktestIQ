import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DrawdownPoint } from "../../types";

export default function DrawdownChart({ data }: { data: DrawdownPoint[] }) {
  const formatted = data.map((d) => ({
    date: d.date.slice(0, 7),
    drawdown: d.drawdown * 100,
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Drawdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "#fff" }}
            formatter={(v) => [`${typeof v === "number" ? v.toFixed(2) : v}%`, "Drawdown"]} />
          <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
