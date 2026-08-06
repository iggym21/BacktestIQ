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

  const ctas = [
    { to: "/strategy", label: "New Strategy", primary: true },
    { to: "/saved", label: "Saved Strategies" },
    { to: "/compare", label: "Compare Tickers" },
    { to: "/optimize", label: "Optimize Parameters" },
    { to: "/walkforward", label: "Walk-Forward Validation" },
  ];

  return (
    <Layout>
      <div className="relative text-center py-20 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-hidden">
        {/* Ambient background: soft radial glow + faint grid, financial-terminal texture */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div
            className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--brand), transparent)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "linear-gradient(to bottom, black, transparent 80%)",
            }}
          />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-ink-muted mb-6"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          Live market data · Institutional-grade analytics
        </span>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-5 bg-clip-text text-transparent bg-linear-to-r from-ink to-brand">
          Test Your Trading Strategies
        </h1>
        <p className="text-lg sm:text-xl text-ink-muted mb-10 max-w-2xl mx-auto">
          Backtest against real market data, powered by AI strategy generation and professional analytics.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {ctas.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`px-6 py-3 text-sm sm:text-base ${c.primary ? "btn-primary" : "btn-secondary"}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {features.map((f) => (
          <div key={f.title} className="card p-6 hover:-translate-y-0.5 hover:shadow-lg transition-transform duration-200">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl mb-4"
              style={{ background: "var(--brand-soft)" }}
              aria-hidden="true"
            >
              {f.icon}
            </div>
            <h3 className="text-ink font-semibold mb-1.5">{f.title}</h3>
            <p className="text-ink-muted text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
