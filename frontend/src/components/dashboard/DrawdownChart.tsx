import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DrawdownPoint } from "../../types";
import { useChartTheme } from "../../lib/chartTheme";

export default function DrawdownChart({ data }: { data: DrawdownPoint[] }) {
  const ct = useChartTheme();
  const formatted = data.map((d) => ({
    date: d.date.slice(0, 7),
    drawdown: d.drawdown * 100,
  }));

  return (
    <div className="card p-5">
      <h3 className="text-ink font-semibold mb-4">Drawdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} />
          <XAxis dataKey="date" tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: ct.tick, fontSize: 11 }} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            label={{ value: "Drawdown (%)", angle: -90, position: "insideLeft", fill: ct.axisLabel, fontSize: 11, style: { textAnchor: "middle" } }} />
          <Tooltip contentStyle={{ background: ct.tooltipBg, border: `1px solid ${ct.tooltipBorder}`, color: ct.tooltipText, borderRadius: 10 }}
            formatter={(v) => [`${typeof v === "number" ? v.toFixed(2) : v}%`, "Drawdown"]} />
          <Area type="monotone" dataKey="drawdown" stroke={ct.negative} fill={ct.negative} fillOpacity={0.2} name="Drawdown" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
