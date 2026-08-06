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
    <div className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-2.5 text-sm font-mono">
      <span className="text-ink">
        <span className="text-brand">{rule.indicator}({params})</span>
        {" "}<span className="text-ink-muted font-sans">{rule.operator}</span>{" "}
        <span className="text-positive">{formatTarget(rule.target)}</span>
      </span>
      <button
        onClick={onDelete}
        aria-label="Delete rule"
        className="text-ink-faint hover:text-negative ml-4 text-xs transition-colors font-sans"
      >
        ✕
      </button>
    </div>
  );
}
