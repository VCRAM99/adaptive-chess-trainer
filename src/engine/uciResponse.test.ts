import { describe, expect, it } from "vitest";
import { parseUciResponse } from "./uciResponse";

describe("UCI response parser", () => {
  it("recognizes the ready response", () => {
    expect(parseUciResponse("readyok")).toEqual({
      type: "ready",
    });
  });

  it("recognizes a best move", () => {
    expect(parseUciResponse("bestmove e7e5")).toEqual({
      type: "bestmove",
      move: "e7e5",
    });
  });

  it("recognizes a best move with ponder information", () => {
    expect(
      parseUciResponse("bestmove e7e5 ponder g1f3")
    ).toEqual({
      type: "bestmove",
      move: "e7e5",
    });
  });

  it("recognizes Stockfish's no-move response", () => {
    expect(parseUciResponse("bestmove (none)")).toEqual({
      type: "bestmove",
      move: "(none)",
    });
  });

  it("ignores search information", () => {
    expect(
      parseUciResponse("info depth 8 score cp 20")
    ).toEqual({
      type: "other",
    });
  });

  it("does not mistake a partial response for readyok", () => {
    expect(parseUciResponse("notreadyok")).toEqual({
      type: "other",
    });
  });

  it("ignores malformed bestmove messages", () => {
    expect(parseUciResponse("bestmove")).toEqual({
      type: "other",
    });
  });
});