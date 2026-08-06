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

  if (loading) return <Layout><div className="text-center py-20 text-ink-muted">Loading…</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink">Saved Strategies</h2>
          <span className="text-sm text-ink-muted font-mono">{strategies.length} / 10 used</span>
        </div>

        {strategies.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-ink-muted mb-4">No saved strategies yet.</p>
            <a href="/strategy" className="text-brand hover:text-brand-strong text-sm font-medium">
              Build your first strategy →
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {strategies.map((s) => (
              <div key={s.id} className="card p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-ink font-semibold">{s.name}</h3>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs bg-surface-2 text-ink-muted px-2 py-0.5 rounded capitalize">{s.mode}</span>
                    <span className="text-xs text-ink-faint font-mono">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleLoad(s)}
                    className="btn-primary text-sm px-4 py-1.5">
                    Load
                  </button>
                  <button onClick={() => handleShowHistory(s)}
                    className="btn-secondary text-sm px-4 py-1.5">
                    History
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="bg-surface-2 hover:bg-negative-soft text-ink-muted hover:text-negative text-sm px-4 py-1.5 rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {historyStrategy && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-ink font-semibold">Version History — {historyStrategy.name}</h3>
              <button onClick={() => setHistoryStrategy(null)} className="text-ink-muted hover:text-ink text-sm">✕</button>
            </div>

            {versions === null ? (
              <p className="text-ink-muted text-sm py-6 text-center">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="text-ink-muted text-sm py-6 text-center">No edits yet — this strategy hasn't been updated since it was created.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="bg-surface-2 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-ink text-sm font-medium">{v.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-surface text-ink-muted px-2 py-0.5 rounded capitalize">{v.mode}</span>
                        <span className="text-xs text-ink-faint font-mono">{new Date(v.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRestoreVersion(historyStrategy.id, v)}
                      className="btn-primary text-xs px-3 py-1.5 shrink-0">
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
