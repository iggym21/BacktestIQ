import { useTheme } from "../context/ThemeContext";

/** Recharts takes plain color strings via props, not CSS classes, so it
 * can't pick up the `.dark`-scoped CSS vars automatically — these mirror
 * the index.css palette for each mode and are selected by the same
 * ThemeContext state that toggles the `.dark` class. */
const PALETTES = {
  light: {
    grid: "#e1e3ef",
    tick: "#6b6e85",
    axisLabel: "#3d4055",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e1e3ef",
    tooltipText: "#12131c",
    brand: "#7c3aed",
    positive: "#059669",
    negative: "#dc2626",
  },
  dark: {
    grid: "#232739",
    tick: "#8d90a8",
    axisLabel: "#c5c8db",
    tooltipBg: "#181b29",
    tooltipBorder: "#323750",
    tooltipText: "#f4f5f9",
    brand: "#8b5cf6",
    positive: "#34d399",
    negative: "#f87171",
  },
};

export function useChartTheme() {
  const { theme } = useTheme();
  return PALETTES[theme];
}
