import { describe, expect, it } from "vitest";
import { isSessionExpiredError } from "./client";

describe("isSessionExpiredError", () => {
  it("treats a 401 on a normal API call as an expired session", () => {
    expect(isSessionExpiredError(401, "/backtest/run")).toBe(true);
    expect(isSessionExpiredError(401, "/strategies/")).toBe(true);
  });

  it("does not treat a 401 on the login endpoint as an expired session", () => {
    // Regression guard: a 401 from POST /auth/login means "wrong password",
    // not "your session expired" — redirecting on it would wipe the login
    // form's error state before the user ever sees "Invalid credentials".
    expect(isSessionExpiredError(401, "/auth/login")).toBe(false);
  });

  it("ignores non-401 statuses", () => {
    expect(isSessionExpiredError(404, "/backtest/run")).toBe(false);
    expect(isSessionExpiredError(500, "/backtest/run")).toBe(false);
    expect(isSessionExpiredError(undefined, "/backtest/run")).toBe(false);
  });
});
