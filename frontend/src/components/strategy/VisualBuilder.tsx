import { useState } from "react";
import type { StrategyRule, StrategyRuleSet } from "../../types";
import RuleCard from "./RuleCard";

const INDICATORS = ["SMA", "EMA", "RSI", "MACD", "MACD_SIGNAL", "BB_UPPER", "BB_LOWER", "CLOSE", "VOLUME"];
const OPERATORS = [">", "<", ">=", "<=", "crosses_above", "crosses_below"];

interface Props {
  value: StrategyRuleSet;
  onChange: (v: StrategyRuleSet) => void;
}

interface RuleForm {
  indicator: string;
  period: string;
  operator: string;
  targetType: "value" | "indicator";
  targetValue: string;
  targetIndicator: string;
  targetPeriod: string;
}

const defaultForm = (): RuleForm => ({
  indicator: "SMA",
  period: "20",
  operator: "crosses_above",
  targetType: "indicator",
  targetValue: "50",
  targetIndicator: "SMA",
  targetPeriod: "50",
});

function formToRule(f: RuleForm): StrategyRule {
  const params: Record<string, number> = f.period ? { period: Number(f.period) } : {};
  const targetParams: Record<string, number> = f.targetPeriod ? { period: Number(f.targetPeriod) } : {};
  const target: StrategyRule["target"] =
    f.targetType === "value"
      ? { value: Number(f.targetValue) }
      : { indicator: f.targetIndicator, params: targetParams };
  return { indicator: f.indicator, params, operator: f.operator, target };
}

function RuleFormRow({ onAdd }: { onAdd: (r: StrategyRule) => void }) {
  const [form, setForm] = useState<RuleForm>(defaultForm());
  const set = (k: keyof RuleForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const needsPeriod = (ind: string) => ["SMA", "EMA", "RSI"].includes(ind);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Indicator</label>
        <select value={form.indicator} onChange={(e) => set("indicator", e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm">
          {INDICATORS.map((i) => <option key={i}>{i}</option>)}
        </select>
        {needsPeriod(form.indicator) && (
          <input type="number" value={form.period} onChange={(e) => set("period", e.target.value)}
            placeholder="Period" className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm" />
        )}
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Operator</label>
        <select value={form.operator} onChange={(e) => set("operator", e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm">
          {OPERATORS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Target type</label>
        <select value={form.targetType} onChange={(e) => set("targetType", e.target.value as "value" | "indicator")}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm">
          <option value="value">Fixed value</option>
          <option value="indicator">Indicator</option>
        </select>
      </div>
      <div>
        {form.targetType === "value" ? (
          <>
            <label className="block text-xs text-slate-400 mb-1">Value</label>
            <input type="number" value={form.targetValue} onChange={(e) => set("targetValue", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm" />
          </>
        ) : (
          <>
            <label className="block text-xs text-slate-400 mb-1">Indicator</label>
            <select value={form.targetIndicator} onChange={(e) => set("targetIndicator", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm">
              {INDICATORS.map((i) => <option key={i}>{i}</option>)}
            </select>
            {needsPeriod(form.targetIndicator) && (
              <input type="number" value={form.targetPeriod} onChange={(e) => set("targetPeriod", e.target.value)}
                placeholder="Period" className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1.5 text-sm" />
            )}
          </>
        )}
      </div>
      <button onClick={() => { onAdd(formToRule(form)); setForm(defaultForm()); }}
        className="col-span-2 md:col-span-4 bg-violet-700 hover:bg-violet-600 text-white text-sm rounded px-3 py-1.5 transition-colors">
        + Add Rule
      </button>
    </div>
  );
}

export default function VisualBuilder({ value, onChange }: Props) {
  const addEntry = (r: StrategyRule) => onChange({ ...value, entry: [...value.entry, r] });
  const addExit = (r: StrategyRule) => onChange({ ...value, exit: [...value.exit, r] });
  const delEntry = (i: number) => onChange({ ...value, entry: value.entry.filter((_, idx) => idx !== i) });
  const delExit = (i: number) => onChange({ ...value, exit: value.exit.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">Logic:</span>
        {(["AND", "OR"] as const).map((l) => (
          <button key={l} onClick={() => onChange({ ...value, logic: l })}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${value.logic === l ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-emerald-400 mb-3">Entry Rules</h4>
        <div className="space-y-2 mb-3">
          {value.entry.map((r, i) => <RuleCard key={i} rule={r} onDelete={() => delEntry(i)} />)}
        </div>
        <RuleFormRow onAdd={addEntry} />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-red-400 mb-3">Exit Rules</h4>
        <div className="space-y-2 mb-3">
          {value.exit.map((r, i) => <RuleCard key={i} rule={r} onDelete={() => delExit(i)} />)}
        </div>
        <RuleFormRow onAdd={addExit} />
      </div>
    </div>
  );
}
