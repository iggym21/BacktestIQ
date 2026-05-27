import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { listStrategies, deleteStrategy } from "../api/strategies";
import type { SavedStrategy } from "../types";
import toast from "react-hot-toast";

export default function SavedStrategiesPage() {
  const [strategies, setStrategies] = useState<SavedStrategy[]>([]);
  const [loading, setLoading] = useState(true);
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
    </Layout>
  );
}
