import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface"
      style={{
        background: isDark ? "var(--surface-2)" : "var(--brand-soft)",
        borderColor: "var(--line)",
      }}
    >
      {/* Track icons: fade in/out under the sliding knob */}
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
        className={`absolute left-1.5 h-3.5 w-3.5 transition-opacity duration-300 ${isDark ? "opacity-40 text-ink-faint" : "opacity-0"}`}>
        <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a5 5 0 100-10 5 5 0 000 10zm9-6a1 1 0 010 2h-1a1 1 0 110-2h1zM4 12a1 1 0 010 2H3a1 1 0 110-2h1zm14.657-6.657a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM7.464 17.536a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zm0-11.072L6.757 5.757A1 1 0 105.343 7.17l.707.708a1 1 0 001.414-1.415zM18.657 18.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 10-1.414 1.414l.707.707zM12 20a1 1 0 011 1v-1a1 1 0 10-2 0v1a1 1 0 011-1z" />
      </svg>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
        className={`absolute right-1.5 h-3.5 w-3.5 transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-40 text-ink-faint"}`}>
        <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.35-2.44A1 1 0 008 2a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.69z" />
      </svg>

      {/* Sliding knob */}
      <span
        aria-hidden="true"
        className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-transform duration-300 ease-out"
        style={{
          background: "linear-gradient(135deg, var(--brand), var(--brand-strong))",
          transform: isDark ? "translateX(28px)" : "translateX(2px)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"
          className={`h-3.5 w-3.5 text-white transition-all duration-300 ${isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0 absolute"}`}>
          <path fill="currentColor" d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a5 5 0 100-10 5 5 0 000 10zm9-6a1 1 0 010 2h-1a1 1 0 110-2h1zM4 12a1 1 0 010 2H3a1 1 0 110-2h1zm14.657-6.657a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM7.464 17.536a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.757 5.757A1 1 0 105.343 7.17l.707.708a1 1 0 001.414-1.415l-.707-.707zM18.657 18.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 10-1.414 1.414l.707.707z" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"
          className={`h-3.5 w-3.5 text-white transition-all duration-300 ${!isDark ? "rotate-0 scale-100" : "rotate-90 scale-0 absolute"}`}>
          <path fill="currentColor" d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.35-2.44A1 1 0 008 2a10.14 10.14 0 1014 11.69 1 1 0 00-.36-.69z" />
        </svg>
      </span>
    </button>
  );
}
