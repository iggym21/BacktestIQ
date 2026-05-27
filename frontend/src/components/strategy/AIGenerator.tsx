import { useState } from "react";
import toast from "react-hot-toast";
import { generateStrategy } from "../../api/ai";
import type { StrategyConfig } from "../../types";

interface Props {
  onStrategyGenerated: (config: StrategyConfig) => void;
}

export default function AIGenerator({ onStrategyGenerated }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const { data } = await generateStrategy(description);
      onStrategyGenerated(data.strategy);
      toast.success("Strategy generated!");
    } catch {
      toast.error("Failed to generate strategy. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Describe your strategy
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="e.g. Buy when 50-day MA crosses above 200-day MA, sell when RSI exceeds 70"
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading || !description.trim()}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">&#x27F3;</span> Generating…
          </>
        ) : (
          "✨ Generate Strategy with AI"
        )}
      </button>
      <p className="text-xs text-slate-500">
        Powered by Claude. Requires ANTHROPIC_API_KEY to be set in backend .env.
      </p>
    </div>
  );
}
