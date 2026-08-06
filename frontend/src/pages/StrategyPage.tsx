import { lazy, Suspense, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/layout/Layout";
import VisualBuilder from "../components/strategy/VisualBuilder";
import { DEFAULT_CODE } from "../components/strategy/codeDefaults";
import AIGenerator from "../components/strategy/AIGenerator";
import PositionSizingInput from "../components/strategy/PositionSizingInput";
import { runBacktest } from "../api/backtest";
import { saveStrategy, updateStrategy } from "../api/strategies";
import type { PositionSizing, SavedStrategy, StrategyConfig, StrategyRuleSet } from "../types";

// Monaco is a large dependency (~1MB) — only load it when Code mode is actually used.
const CodeEditor = lazy(() => import("../components/strategy/CodeEditor"));

type Mode = "visual" | "code" | "ai";

const DEFAULT_RULES: StrategyRuleSet = { entry: [], exit: [], logic: "AND" };
const DEFAULT_POSITION_SIZING: PositionSizing = { type: "percent", value: 100 };

export default function StrategyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loaded = (location.state as { loaded?: SavedStrategy } | null)?.loaded;
  const [loadedId, setLoadedId] = useState<string | null>(loaded?.id ?? null);

  const [mode, setMode] = useState<Mode>(loaded?.mode === "code" ? "code" : "visual");
  const [ticker, setTicker] = useState("SPY");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2023-12-31");
  const [capital, setCapital] = useState(10000);
  const [benchmark, setBenchmark] = useState("SPY");
  const [rules, setRules] = useState<StrategyRuleSet>(loaded?.config.rules ?? DEFAULT_RULES);
  const [code, setCode] = useState(loaded?.config.code ?? DEFAULT_CODE);
  const [positionSizing, setPositionSizing] = useState<PositionSizing>(
    loaded?.config.position_sizing ?? DEFAULT_POSITION_SIZING
  );
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState(loaded?.name ?? "");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const getConfig = (): StrategyConfig => ({
    mode: mode === "ai" ? "visual" : mode,
    rules: mode !== "code" ? rules : undefined,
    code: mode === "code" ? code : undefined,
    position_sizing: positionSizing,
  });

  const handleRun = async () => {
    if (!ticker.trim()) return toast.error("Enter a ticker symbol");
    if (new Date(startDate) >= new Date(endDate)) return toast.error("Start date must be before end date");
    if (capital <= 0) return toast.error("Capital must be positive");

    const cfg = getConfig();
    if (cfg.mode === "visual" && cfg.rules && cfg.rules.entry.length === 0) {
      return toast.error("Add at least one entry rule");
    }

    setLoading(true);
    try {
      const { data: result } = await runBacktest({
        ticker, start_date: startDate, end_date: endDate,
        strategy: cfg, initial_capital: capital, benchmark,
      });
      navigate("/results", { state: { result, ticker, startDate, endDate } });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message ?? "Backtest failed");
    } finally {
      setLoading(false);
    }
  };

  const errorMessage = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback;

  const handleSaveAsNew = async () => {
    if (!saveName.trim()) return toast.error("Enter a strategy name");
    try {
      const cfg = getConfig();
      const { data } = await saveStrategy(saveName, cfg.mode, cfg);
      toast.success("Strategy saved!");
      setLoadedId(data.id);
      setShowSaveModal(false);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Save failed"));
    }
  };

  const handleUpdate = async () => {
    if (!loadedId) return;
    if (!saveName.trim()) return toast.error("Enter a strategy name");
    try {
      const cfg = getConfig();
      await updateStrategy(loadedId, saveName, cfg.mode, cfg);
      toast.success("Strategy updated — previous version saved to history");
      setShowSaveModal(false);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Update failed"));
    }
  };

  const handleAIGenerated = (cfg: StrategyConfig) => {
    if (cfg.rules) setRules(cfg.rules);
    setMode("visual");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-ink mb-6">Strategy Builder</h2>

        {/* Config row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label htmlFor="strategy-ticker" className="block text-xs text-ink-muted mb-1">Ticker</label>
            <input id="strategy-ticker" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="surface-input w-full px-3 py-2 text-sm uppercase font-mono" />
          </div>
          <div>
            <label htmlFor="strategy-start-date" className="block text-xs text-ink-muted mb-1">Start Date</label>
            <input id="strategy-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="surface-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="strategy-end-date" className="block text-xs text-ink-muted mb-1">End Date</label>
            <input id="strategy-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="surface-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="strategy-capital" className="block text-xs text-ink-muted mb-1">Capital ($)</label>
            <input id="strategy-capital" type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
              className="surface-input w-full px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label htmlFor="strategy-benchmark" className="block text-xs text-ink-muted mb-1">Benchmark</label>
            <input id="strategy-benchmark" value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
              className="surface-input w-full px-3 py-2 text-sm uppercase font-mono" />
          </div>
          <PositionSizingInput value={positionSizing} onChange={setPositionSizing} />
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6">
          {(["visual", "code", "ai"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${mode === m ? "bg-brand text-white" : "bg-surface-2 text-ink-muted hover:text-ink"}`}>
              {m === "ai" ? "✨ AI Generate" : m === "code" ? "{ } Code" : "Visual"}
            </button>
          ))}
        </div>

        {/* Builder area */}
        <div className="card p-6 mb-6">
          {mode === "visual" && <VisualBuilder value={rules} onChange={setRules} />}
          {mode === "code" && (
            <Suspense fallback={<div className="text-ink-muted text-sm py-10 text-center">Loading editor…</div>}>
              <CodeEditor value={code} onChange={setCode} />
            </Suspense>
          )}
          {mode === "ai" && <AIGenerator onStrategyGenerated={handleAIGenerated} />}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleRun} disabled={loading}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin">&#x27F3;</span> Running…</> : "Run Backtest"}
          </button>
          <button onClick={() => setShowSaveModal(true)}
            className="btn-secondary px-6 py-3">
            {loadedId ? "Save…" : "Save"}
          </button>
        </div>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <h3 className="text-ink font-semibold mb-4">{loadedId ? "Update Strategy" : "Save Strategy"}</h3>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
              placeholder="Strategy name"
              className="surface-input w-full px-4 py-2 mb-4" />
            {loadedId ? (
              <div className="flex flex-col gap-2">
                <button onClick={handleUpdate} className="btn-primary py-2">
                  Update (keeps version history)
                </button>
                <button onClick={handleSaveAsNew} className="btn-secondary py-2">
                  Save as New Strategy
                </button>
                <button onClick={() => setShowSaveModal(false)} className="text-ink-muted hover:text-ink text-sm py-1">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={handleSaveAsNew} className="btn-primary flex-1 py-2">Save</button>
                <button onClick={() => setShowSaveModal(false)} className="btn-secondary flex-1 py-2">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
