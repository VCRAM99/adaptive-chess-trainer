import { describe, expect, it } from "vitest";
import { parseUciMove } from "./uci";

describe("UCI move parser", () => {
  it("parses a normal move", () => {
    expect(parseUciMove("e2e4")).toEqual({
      source: "e2",
      target: "e4",
    });
  });

  it("parses a queen promotion", () => {
    expect(parseUciMove("e7e8q")).toEqual({
      source: "e7",
      target: "e8",
      promotion: "q",
    });
  });

  it("parses a knight promotion", () => {
    expect(parseUciMove("a7a8n")).toEqual({
      source: "a7",
      target: "a8",
      promotion: "n",
    });
  });

  it("rejects an empty move", () => {
    expect(parseUciMove("")).toBeNull();
  });

  it("rejects an invalid square", () => {
    expect(parseUciMove("e2e9")).toBeNull();
  });

  it("rejects an invalid promotion piece", () => {
    expect(parseUciMove("e7e8k")).toBeNull();
  });

  it("rejects the same source and target", () => {
    expect(parseUciMove("e2e2")).toBeNull();
  });

  it("rejects Stockfish's no-move response", () => {
    expect(parseUciMove("(none)")).toBeNull();
  });
});
