import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import HomePage from "./pages/HomePage";

// Split out of the initial bundle: these pages pull in Recharts/Monaco and
// aren't needed for the first paint of the auth/home screens.
const StrategyPage = lazy(() => import("./pages/StrategyPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const SavedStrategiesPage = lazy(() => import("./pages/SavedStrategiesPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const OptimizePage = lazy(() => import("./pages/OptimizePage"));
const WalkForwardPage = lazy(() => import("./pages/WalkForwardPage"));

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <span className="text-slate-400 text-sm animate-pulse">Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
          }}
        />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/strategy" element={<ProtectedRoute><StrategyPage /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedStrategiesPage /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
            <Route path="/optimize" element={<ProtectedRoute><OptimizePage /></ProtectedRoute>} />
            <Route path="/walkforward" element={<ProtectedRoute><WalkForwardPage /></ProtectedRoute>} />
            <Route path="*" element={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                  <p className="text-slate-400 mb-6">Page not found</p>
                  <a href="/" className="text-violet-400 hover:text-violet-300">Go home</a>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
