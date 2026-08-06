import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";

export default function HomePage() {
  const features = [
    { icon: "📈", title: "Visual Strategy Builder", desc: "Build trading rules with drag-and-drop indicators — no code required." },
    { icon: "🤖", title: "AI Strategy Generator", desc: "Describe your strategy in plain English and let Claude generate the rules." },
    { icon: "⚡", title: "Fast Backtest Engine", desc: "Vectorized pandas engine runs multi-year backtests in milliseconds." },
    { icon: "📊", title: "Rich Analytics", desc: "Equity curves, drawdown charts, monthly heatmaps, and 13 performance metrics." },
    { icon: "💾", title: "Save & Compare", desc: "Save up to 10 strategies and revisit or compare results any time." },
    { icon: "📄", title: "PDF Tearsheets", desc: "Export professional-grade tearsheets for sharing or documentation." },
  ];

  return (
    <Layout>
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Test Your Trading Strategies
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Backtest against real market data, powered by AI strategy generation and professional analytics.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/strategy"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            New Strategy
          </Link>
          <Link
            to="/saved"
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors border border-slate-700"
          >
            Saved Strategies
          </Link>
          <Link
            to="/compare"
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors border border-slate-700"
          >
            Compare Tickers
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {features.map((f) => (
          <div key={f.title} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-white font-semibold mb-1">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
