import type { EquityPoint } from "../../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthlyHeatmap({ data }: { data: EquityPoint[] }) {
  const monthly: Record<string, Record<number, number>> = {};
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (!prev || !curr) continue;
    const parts = curr.date.split("-").map(Number);
    const year = String(parts[0]);
    const month = parts[1];
    if (!monthly[year]) monthly[year] = {};
    const ret = ((curr.equity - prev.equity) / prev.equity) * 100;
    monthly[year][month] = (monthly[year][month] ?? 0) + ret;
  }

  const years = Object.keys(monthly).sort();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto">
      <h3 className="text-white font-semibold mb-4">Monthly Returns</h3>
      <table className="text-xs w-full border-separate border-spacing-0.5">
        <thead>
          <tr>
            <th className="text-slate-400 text-left pr-3 pb-2">Year</th>
            {MONTHS.map((m) => <th key={m} className="text-slate-400 pb-2 w-10">{m}</th>)}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td className="text-slate-400 pr-3 py-0.5 font-medium">{year}</td>
              {Array.from({ length: 12 }, (_, i) => {
                const v = monthly[year][i + 1];
                const intensity = v !== undefined
                  ? Math.min(9, Math.max(1, Math.round(Math.abs(v) / 15 * 9)))
                  : 0;
                const bg = v === undefined
                  ? "bg-slate-800 text-slate-600"
                  : v >= 0
                  ? `bg-emerald-${intensity}00 text-emerald-100`
                  : `bg-red-${intensity}00 text-red-100`;
                return (
                  <td key={i} className={`${bg} text-center rounded py-1 cursor-default`}
                    title={v !== undefined ? `${v.toFixed(2)}%` : "No data"}>
                    {v !== undefined ? `${v.toFixed(1)}` : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
