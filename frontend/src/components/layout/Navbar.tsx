import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-white font-bold text-lg tracking-tight">
          BacktestIQ
        </Link>
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/strategy" className="text-slate-400 hover:text-white transition-colors">
            New Strategy
          </Link>
          <Link to="/saved" className="text-slate-400 hover:text-white transition-colors">
            Saved Strategies
          </Link>
          <Link to="/compare" className="text-slate-400 hover:text-white transition-colors">
            Compare
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-400 text-sm hidden sm:block">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
