import { describe, expect, it } from "vitest";

import { classifyMove } from "./classifyMove";

describe("classifyMove", () => {
  it.each([
    [0, "diamond"],
    [10, "diamond"],
    [11, "platinum"],
    [25, "platinum"],
    [26, "gold"],
    [50, "gold"],
    [51, "silver"],
    [90, "silver"],
    [91, "bronze"],
    [150, "bronze"],
    [151, "steel"],
    [250, "steel"],
    [251, "wood"],
    [500, "wood"],
  ] as const)("classifies %i CPL as %s", (loss, expected) => {
    expect(classifyMove(loss)).toBe(expected);
  });

  it("clamps negative loss to zero", () => {
    expect(classifyMove(-5)).toBe("diamond");
  });

  it("rejects non-finite input", () => {
    expect(() => classifyMove(NaN)).toThrow();
    expect(() => classifyMove(Infinity)).toThrow();
  });

  it("classifies exact tier boundaries correctly", () => {
    expect(classifyMove(0)).toBe("diamond");
    expect(classifyMove(10)).toBe("diamond");

    expect(classifyMove(10.01)).toBe("platinum");
    expect(classifyMove(25)).toBe("platinum");

    expect(classifyMove(25.01)).toBe("gold");
    expect(classifyMove(50)).toBe("gold");

    expect(classifyMove(50.01)).toBe("silver");
    expect(classifyMove(90)).toBe("silver");

    expect(classifyMove(90.01)).toBe("bronze");
    expect(classifyMove(150)).toBe("bronze");

    expect(classifyMove(150.01)).toBe("steel");
    expect(classifyMove(250)).toBe("steel");

    expect(classifyMove(250.01)).toBe("wood");
    expect(classifyMove(1000)).toBe("wood");
  });
});
