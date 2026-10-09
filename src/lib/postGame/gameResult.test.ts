import { describe, expect, it } from "vitest";

import { getCheckmateWinner } from "./gameResult";

describe("getCheckmateWinner", () => {
  it("returns black when white is the checkmated side", () => {
    expect(getCheckmateWinner("w")).toBe("black");
  });

  it("returns white when black is the checkmated side", () => {
    expect(getCheckmateWinner("b")).toBe("white");
  });
});
