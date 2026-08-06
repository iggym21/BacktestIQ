import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MonthlyHeatmap from "./MonthlyHeatmap";
import type { EquityPoint } from "../../types";

function point(date: string, equity: number): EquityPoint {
  return { date, equity, benchmark_equity: equity };
}

describe("MonthlyHeatmap", () => {
  it("colors a positive month green and a negative month red", () => {
    // Jan: 10000 -> 11000 (+10%). Feb: 11000 -> 9900 (-10%).
    const data = [
      point("2023-01-01", 10000),
      point("2023-01-31", 11000),
      point("2023-02-28", 9900),
    ];
    render(<MonthlyHeatmap data={data} />);

    const jan = screen.getByTitle("10.00%");
    const feb = screen.getByTitle("-10.00%");

    // Regression test: cell classes used to be built via template-literal
    // interpolation (`bg-emerald-${n}00`), which Tailwind's compiler can't
    // statically detect, so no color classes were ever generated and every
    // cell rendered with the same flat background regardless of sign.
    expect(jan.className).toMatch(/bg-emerald-\d00/);
    expect(feb.className).toMatch(/bg-red-\d00/);
  });

  it("renders an empty cell for months with no data", () => {
    render(<MonthlyHeatmap data={[point("2023-01-01", 10000), point("2023-01-31", 11000)]} />);
    const noData = screen.getAllByTitle("No data");
    expect(noData.length).toBeGreaterThan(0);
    for (const cell of noData) {
      expect(cell.className).toContain("bg-surface-2");
    }
  });
});
