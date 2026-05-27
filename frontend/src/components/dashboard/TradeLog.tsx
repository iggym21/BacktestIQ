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
      className="text-left px-4 py-3 text-xs text-slate-400 cursor-pointer hover:text-white select-none">
      {label} {sortKey === k ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h3 className="text-white font-semibold">Trade Log ({trades.length} trades)</h3>
      </div>
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 sticky top-0">
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
              <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-300">{t.date}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === "buy" ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
                    {t.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-300">${t.price.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-slate-300">{t.shares.toFixed(2)}</td>
                <td className={`px-4 py-2.5 font-medium ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
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
