import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/layout/Layout";
import VisualBuilder from "../components/strategy/VisualBuilder";
import CodeEditor, { DEFAULT_CODE } from "../components/strategy/CodeEditor";
import AIGenerator from "../components/strategy/AIGenerator";
import PositionSizingInput from "../components/strategy/PositionSizingInput";
import { runBacktest } from "../api/backtest";
import { saveStrategy } from "../api/strategies";
import type { PositionSizing, SavedStrategy, StrategyConfig, StrategyRuleSet } from "../types";

type Mode = "visual" | "code" | "ai";

const DEFAULT_RULES: StrategyRuleSet = { entry: [], exit: [], logic: "AND" };
const DEFAULT_POSITION_SIZING: PositionSizing = { type: "percent", value: 100 };

export default function StrategyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loaded = (location.state as { loaded?: SavedStrategy } | null)?.loaded;

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

  const handleSave = async () => {
    if (!saveName.trim()) return toast.error("Enter a strategy name");
    try {
      const cfg = getConfig();
      await saveStrategy(saveName, cfg.mode, cfg);
      toast.success("Strategy saved!");
      setShowSaveModal(false);
      setSaveName("");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(message ?? "Save failed");
    }
  };

  const handleAIGenerated = (cfg: StrategyConfig) => {
    if (cfg.rules) setRules(cfg.rules);
    setMode("visual");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Strategy Builder</h2>

        {/* Config row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Ticker</label>
            <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Capital ($)</label>
            <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Benchmark</label>
            <input value={benchmark} onChange={(e) => setBenchmark(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase" />
          </div>
          <PositionSizingInput value={positionSizing} onChange={setPositionSizing} />
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-6">
          {(["visual", "code", "ai"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${mode === m ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {m === "ai" ? "✨ AI Generate" : m === "code" ? "{ } Code" : "Visual"}
            </button>
          ))}
        </div>

        {/* Builder area */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          {mode === "visual" && <VisualBuilder value={rules} onChange={setRules} />}
          {mode === "code" && <CodeEditor value={code} onChange={setCode} />}
          {mode === "ai" && <AIGenerator onStrategyGenerated={handleAIGenerated} />}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleRun} disabled={loading}
            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <><span className="animate-spin">&#x27F3;</span> Running…</> : "Run Backtest"}
          </button>
          <button onClick={() => setShowSaveModal(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Save
          </button>
        </div>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-4">Save Strategy</h3>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
              placeholder="Strategy name"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleSave} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg">Save</button>
              <button onClick={() => setShowSaveModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
