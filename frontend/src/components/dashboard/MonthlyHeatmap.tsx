import type { EquityPoint } from "../../types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Tailwind's compiler statically scans source for class names — it can't resolve
// interpolated strings like `bg-emerald-${n}00`, so the shades must be spelled out.
const POSITIVE_SHADES = [
  "bg-emerald-100 text-emerald-950", "bg-emerald-200 text-emerald-950", "bg-emerald-300 text-emerald-950",
  "bg-emerald-400 text-emerald-950", "bg-emerald-500 text-emerald-950", "bg-emerald-600 text-emerald-50",
  "bg-emerald-700 text-emerald-50", "bg-emerald-800 text-emerald-50", "bg-emerald-900 text-emerald-50",
];
const NEGATIVE_SHADES = [
  "bg-red-100 text-red-950", "bg-red-200 text-red-950", "bg-red-300 text-red-950",
  "bg-red-400 text-red-950", "bg-red-500 text-red-950", "bg-red-600 text-red-50",
  "bg-red-700 text-red-50", "bg-red-800 text-red-50", "bg-red-900 text-red-50",
];

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
    <div className="card p-5 overflow-x-auto">
      <h3 className="text-ink font-semibold mb-4">Monthly Returns</h3>
      <table className="text-xs w-full border-separate border-spacing-0.5 font-mono">
        <thead>
          <tr>
            <th className="text-ink-muted text-left pr-3 pb-2 font-sans font-medium">Year</th>
            {MONTHS.map((m) => <th key={m} className="text-ink-muted pb-2 w-10 font-sans font-medium">{m}</th>)}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td className="text-ink-muted pr-3 py-0.5 font-medium font-sans">{year}</td>
              {Array.from({ length: 12 }, (_, i) => {
                const v = monthly[year][i + 1];
                const intensity = v !== undefined
                  ? Math.min(9, Math.max(1, Math.round(Math.abs(v) / 15 * 9)))
                  : 0;
                const bg = v === undefined
                  ? "bg-surface-2 text-ink-faint"
                  : v >= 0
                  ? POSITIVE_SHADES[intensity - 1]
                  : NEGATIVE_SHADES[intensity - 1];
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
