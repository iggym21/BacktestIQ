import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { listStrategies, deleteStrategy, listStrategyVersions } from "../api/strategies";
import type { SavedStrategy, StrategyVersion } from "../types";
import toast from "react-hot-toast";

export default function SavedStrategiesPage() {
  const [strategies, setStrategies] = useState<SavedStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyStrategy, setHistoryStrategy] = useState<SavedStrategy | null>(null);
  const [versions, setVersions] = useState<StrategyVersion[] | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await listStrategies();
      setStrategies(data);
    } catch {
      toast.error("Failed to load strategies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this strategy?")) return;
    try {
      await deleteStrategy(id);
      setStrategies((s) => s.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleLoad = (s: SavedStrategy) => {
    navigate("/strategy", { state: { loaded: s } });
  };

  const handleShowHistory = async (s: SavedStrategy) => {
    setHistoryStrategy(s);
    setVersions(null);
    try {
      const { data } = await listStrategyVersions(s.id);
      setVersions(data);
    } catch {
      toast.error("Failed to load version history");
      setHistoryStrategy(null);
    }
  };

  const handleRestoreVersion = (strategyId: string, version: StrategyVersion) => {
    navigate("/strategy", {
      state: { loaded: { id: strategyId, name: version.name, mode: version.mode, config: version.config, created_at: version.created_at } },
    });
  };

  if (loading) return <Layout><div className="text-center py-20 text-slate-400">Loading…</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Saved Strategies</h2>
          <span className="text-sm text-slate-400">{strategies.length} / 10 used</span>
        </div>

        {strategies.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-4">No saved strategies yet.</p>
            <a href="/strategy" className="text-violet-400 hover:text-violet-300 text-sm">
              Build your first strategy →
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {strategies.map((s) => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{s.name}</h3>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded capitalize">{s.mode}</span>
                    <span className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleLoad(s)}
                    className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
                    Load
                  </button>
                  <button onClick={() => handleShowHistory(s)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
                    History
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-sm px-4 py-1.5 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {historyStrategy && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Version History — {historyStrategy.name}</h3>
              <button onClick={() => setHistoryStrategy(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            {versions === null ? (
              <p className="text-slate-400 text-sm py-6 text-center">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="text-slate-400 text-sm py-6 text-center">No edits yet — this strategy hasn't been updated since it was created.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">{v.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded capitalize">{v.mode}</span>
                        <span className="text-xs text-slate-500">{new Date(v.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRestoreVersion(historyStrategy.id, v)}
                      className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0">
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
