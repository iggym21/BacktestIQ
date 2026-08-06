import type { PositionSizing } from "../../types";

const LABELS: Record<PositionSizing["type"], string> = {
  percent: "% of Portfolio",
  dollar: "Fixed $ Amount",
  shares: "Fixed Share Count",
};

interface Props {
  value: PositionSizing;
  onChange: (v: PositionSizing) => void;
}

export default function PositionSizingInput({ value, onChange }: Props) {
  return (
    <>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Position Sizing</label>
        <select value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value as PositionSizing["type"] })}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm">
          {(Object.keys(LABELS) as PositionSizing["type"][]).map((t) => (
            <option key={t} value={t}>{LABELS[t]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          {value.type === "percent" ? "Percent" : value.type === "dollar" ? "Dollars" : "Shares"}
        </label>
        <input type="number" min={0} value={value.value}
          onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
      </div>
    </>
  );
}
