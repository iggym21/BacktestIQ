import type { BacktestMetrics } from "../../types";

const METRIC_LABELS: Record<keyof BacktestMetrics, { label: string; format: (v: number) => string; tooltip: string }> = {
  total_return:          { label: "Total Return",          format: (v) => `${(v * 100).toFixed(2)}%`,  tooltip: "Net profit/loss as % of initial capital" },
  annualized_return:     { label: "Ann. Return",           format: (v) => `${(v * 100).toFixed(2)}%`,  tooltip: "Return normalized to one year" },
  sharpe:                { label: "Sharpe Ratio",          format: (v) => v.toFixed(3),                 tooltip: "Excess return per unit of risk (>1 good, >2 great)" },
  sortino:               { label: "Sortino Ratio",         format: (v) => v.toFixed(3),                 tooltip: "Like Sharpe but only counts downside volatility" },
  max_drawdown:          { label: "Max Drawdown",          format: (v) => `${(v * 100).toFixed(2)}%`,  tooltip: "Largest peak-to-trough decline" },
  max_drawdown_duration: { label: "Max DD Duration",       format: (v) => `${v}d`,                     tooltip: "Longest number of days spent in drawdown" },
  win_rate:              { label: "Win Rate",              format: (v) => `${(v * 100).toFixed(1)}%`,  tooltip: "% of closed trades that were profitable" },
  avg_win:               { label: "Avg Win",              format: (v) => `$${v.toFixed(2)}`,           tooltip: "Average profit per winning trade" },
  avg_loss:              { label: "Avg Loss",              format: (v) => `$${v.toFixed(2)}`,           tooltip: "Average loss per losing trade" },
  num_trades:            { label: "# Trades",             format: (v) => String(v),                    tooltip: "Total number of closed trades" },
  alpha:                 { label: "Alpha",                 format: (v) => v.toFixed(4),                 tooltip: "Excess return vs benchmark (annualized)" },
  beta:                  { label: "Beta",                  format: (v) => v.toFixed(3),                 tooltip: "Sensitivity to benchmark movements" },
  calmar:                { label: "Calmar Ratio",          format: (v) => v.toFixed(3),                 tooltip: "Ann. return divided by max drawdown" },
};

function color(key: keyof BacktestMetrics, v: number): string {
  if (["total_return", "annualized_return", "sharpe", "sortino", "win_rate", "avg_win", "alpha", "calmar"].includes(key)) {
    return v >= 0 ? "text-emerald-400" : "text-red-400";
  }
  if (key === "max_drawdown") return v >= -0.1 ? "text-emerald-400" : v >= -0.2 ? "text-yellow-400" : "text-red-400";
  return "text-white";
}

export default function MetricsPanel({ metrics }: { metrics: BacktestMetrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {(Object.keys(METRIC_LABELS) as (keyof BacktestMetrics)[]).map((key) => {
        const { label, format, tooltip } = METRIC_LABELS[key];
        const v = metrics[key];
        return (
          <div key={key} title={tooltip} className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-help">
            <div className="text-xs text-slate-400 mb-1">{label}</div>
            <div className={`text-xl font-bold ${color(key, v)}`}>{format(v)}</div>
          </div>
        );
      })}
    </div>
  );
}
