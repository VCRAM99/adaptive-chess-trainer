import { describe, expect, it, vi } from "vitest";

import { devLog } from "./devLogger";

describe("devLog", () => {
  it("writes diagnostics during development", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      devLog("test", { value: 42 });

      expect(logSpy).toHaveBeenCalledWith("[Chess Trainer] test", { value: 42 });
    } finally {
      logSpy.mockRestore();
    }
  });
});
