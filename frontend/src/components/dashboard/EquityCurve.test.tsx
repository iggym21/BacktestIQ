import { describe, expect, it } from "vitest";
import { formatTooltipValue } from "./EquityCurve";

describe("formatTooltipValue", () => {
  it("labels the strategy series distinctly from the benchmark series", () => {
    // Regression test: the tooltip formatter used to hardcode a single label
    // via a `name === "equity"` check that never matched the Line
    // components' actual `name` props ("Strategy"/"Benchmark"), so both
    // rows in the tooltip displayed as "Benchmark".
    const [, strategyLabel] = formatTooltipValue(15561.96, "Strategy");
    const [, benchmarkLabel] = formatTooltipValue(14259.71, "Benchmark");

    expect(strategyLabel).toBe("Strategy");
    expect(benchmarkLabel).toBe("Benchmark");
    expect(strategyLabel).not.toBe(benchmarkLabel);
  });

  it("formats numeric values as comma-separated dollar amounts", () => {
    const [formatted] = formatTooltipValue(15561.96, "Strategy");
    expect(formatted).toBe("$15,561.96");
  });

  it("passes non-numeric values through unformatted", () => {
    const [formatted] = formatTooltipValue("N/A", "Strategy");
    expect(formatted).toBe("$N/A");
  });
});
