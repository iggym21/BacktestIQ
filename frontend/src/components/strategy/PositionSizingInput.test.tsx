import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PositionSizingInput from "./PositionSizingInput";
import type { PositionSizing } from "../../types";

/** Mirrors how the real pages use this component: state lives in the parent. */
function ControlledHarness({ onChange, initial }: { onChange: (v: PositionSizing) => void; initial: PositionSizing }) {
  const [value, setValue] = useState(initial);
  return (
    <PositionSizingInput value={value} onChange={(v) => { setValue(v); onChange(v); }} />
  );
}

describe("PositionSizingInput", () => {
  it("switches type and reports it via onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PositionSizingInput value={{ type: "percent", value: 100 }} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Position Sizing"), "dollar");

    expect(onChange).toHaveBeenCalledWith({ type: "dollar", value: 100 });
  });

  it("relabels the value field based on the selected type", () => {
    const { rerender } = render(
      <PositionSizingInput value={{ type: "percent", value: 100 }} onChange={vi.fn()} />
    );
    expect(screen.getByText("Percent")).toBeInTheDocument();

    rerender(<PositionSizingInput value={{ type: "dollar", value: 500 }} onChange={vi.fn()} />);
    expect(screen.getByText("Dollars")).toBeInTheDocument();

    rerender(<PositionSizingInput value={{ type: "shares", value: 10 }} onChange={vi.fn()} />);
    expect(screen.getByText("Shares")).toBeInTheDocument();
  });

  it("reports numeric value changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledHarness onChange={onChange} initial={{ type: "dollar", value: 100 }} />);

    const input = screen.getByLabelText("Dollars");
    await user.clear(input);
    await user.type(input, "2000");

    expect(onChange).toHaveBeenLastCalledWith({ type: "dollar", value: 2000 });
  });
});
