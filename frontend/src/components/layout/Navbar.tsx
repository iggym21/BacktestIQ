import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/strategy", label: "New Strategy" },
  { to: "/saved", label: "Saved Strategies" },
  { to: "/compare", label: "Compare" },
  { to: "/optimize", label: "Optimize" },
  { to: "/walkforward", label: "Walk-Forward" },
];

function Logo() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-brand to-brand-strong shadow-sm">
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
        <path d="M3 17l5-6 4 3 5-8 4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b px-6 py-3 backdrop-blur-lg transition-colors duration-300"
      style={{ background: "color-mix(in srgb, var(--surface) 85%, transparent)", borderColor: "var(--line)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-7">
          <NavLink to="/" className="flex items-center gap-2 text-ink font-bold text-lg tracking-tight">
            <Logo />
            BacktestIQ
          </NavLink>
          <div className="hidden sm:flex items-center gap-1 text-sm">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 font-medium transition-colors ${
                    isActive ? "bg-brand-soft text-brand" : "text-ink-muted hover:text-ink hover:bg-surface-2"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-ink-faint text-sm font-mono">{user?.email}</span>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-ink-muted hover:text-negative transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
