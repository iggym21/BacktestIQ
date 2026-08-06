import { useState } from "react";
import type { Trade } from "../../types";

type SortKey = "date" | "type" | "price" | "shares" | "pnl";

export default function TradeLog({ trades }: { trades: Trade[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc((v) => !v);
    else { setSortKey(k); setSortAsc(true); }
  };

  const sorted = [...trades].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    return (av < bv ? -1 : av > bv ? 1 : 0) * (sortAsc ? 1 : -1);
  });

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => handleSort(k)}
      className="text-left px-4 py-3 text-xs text-ink-muted cursor-pointer hover:text-ink select-none font-medium">
      {label} {sortKey === k ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
        <h3 className="text-ink font-semibold">Trade Log ({trades.length} trades)</h3>
      </div>
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm font-mono">
          <thead className="sticky top-0" style={{ background: "var(--surface-2)" }}>
            <tr>
              <Th k="date" label="Date" />
              <Th k="type" label="Type" />
              <Th k="price" label="Price" />
              <Th k="shares" label="Shares" />
              <Th k="pnl" label="P&L" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={i} className="border-t hover:bg-surface-2 transition-colors" style={{ borderColor: "var(--line)" }}>
                <td className="px-4 py-2.5 text-ink-muted">{t.date}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.type === "buy" ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"}`}>
                    {t.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-ink-muted">${t.price.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-ink-muted">{t.shares.toFixed(2)}</td>
                <td className={`px-4 py-2.5 font-semibold ${t.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
