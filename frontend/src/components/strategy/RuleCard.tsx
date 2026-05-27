import type { StrategyRule } from "../../types";

interface Props {
  rule: StrategyRule;
  onDelete: () => void;
}

function formatTarget(target: StrategyRule["target"]): string {
  if (target.value !== undefined) return String(target.value);
  const params = Object.entries(target.params ?? {}).map(([k, v]) => `${k}=${v}`).join(", ");
  return `${target.indicator}(${params})`;
}

export default function RuleCard({ rule, onDelete }: Props) {
  const params = Object.entries(rule.params).map(([k, v]) => `${k}=${v}`).join(", ");
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-2.5 text-sm">
      <span className="text-slate-200">
        <span className="text-violet-400">{rule.indicator}({params})</span>
        {" "}<span className="text-slate-400">{rule.operator}</span>{" "}
        <span className="text-emerald-400">{formatTarget(rule.target)}</span>
      </span>
      <button
        onClick={onDelete}
        className="text-slate-500 hover:text-red-400 ml-4 text-xs transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
