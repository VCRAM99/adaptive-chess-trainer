import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";

import { buildGameRecord } from "./buildGameRecord";

describe("buildGameRecord", () => {
  it("preserves a draw result", () => {
    const record = buildGameRecord(
      "1. e4 e5 2. Nf3 Nc6",
      "draw-game",
      "2026-10-05T10:00:00Z",
      "2026-10-05T10:05:00Z",
      "draw",
    );

    expect(record.result).toBe("draw");
    expect(record.moves).toHaveLength(4);
  });
  it("includes the promotion piece in UCI", () => {
    const record = buildGameRecord(
      `[SetUp "1"]
    [FEN "7k/P7/8/8/8/8/8/7K w - - 0 1"]
    
    1. a8=Q+`,
      "promotion-game",
      "2026-10-05T10:00:00Z",
      "2026-10-05T10:01:00Z",
      "draw",
    );

    expect(record.moves).toHaveLength(1);

    expect(record.moves[0].san).toContain("a8=Q");

    expect(record.moves[0].uci).toBe("a7a8q");
  });

  it("reconstructs the move history", () => {
    const record = buildGameRecord(
      "1. e4 e5 2. Nf3 Nc6",
      "test-game",
      "2026-10-02T10:00:00Z",
      "2026-10-02T10:05:00Z",
      "draw",
    );

    expect(record.moves).toHaveLength(4);

    expect(record.moves[0].san).toBe("e4");
    expect(record.moves[0].uci).toBe("e2e4");
    expect(record.moves[0].playedBy).toBe("white");

    expect(record.moves[1].playedBy).toBe("black");

    expect(record.moves[2].san).toBe("Nf3");
    expect(record.moves[2].uci).toBe("g1f3");
  });

  it("preserves position continuity", () => {
    const record = buildGameRecord(
      "1. e4 e5",
      "continuity-test",
      "2026-10-02T10:00:00Z",
      "2026-10-02T10:01:00Z",
      "draw",
    );

    expect(record.moves[0].fenAfter).toBe(record.moves[1].fenBefore);
  });

  it("records the game result", () => {
    const record = buildGameRecord(
      "1. e4 e5",
      "result-test",
      "2026-10-02T10:00:00Z",
      "2026-10-02T10:01:00Z",
      "white",
    );

    expect(record.result).toBe("white");
  });
  it("records a checkmate game through the final position", () => {
    const record = buildGameRecord(
      "1. f3 e5 2. g4 Qh4#",
      "checkmate-game",
      "2026-10-05T10:00:00Z",
      "2026-10-05T10:05:00Z",
      "black",
    );

    expect(record.result).toBe("black");
    expect(record.moves).toHaveLength(4);

    const finalMove = record.moves[3];

    expect(finalMove.ply).toBe(4);
    expect(finalMove.san).toBe("Qh4#");
    expect(finalMove.uci).toBe("d8h4");
    expect(finalMove.playedBy).toBe("black");

    const finalPosition = new Chess(finalMove.fenAfter);

    expect(finalPosition.isCheckmate()).toBe(true);
  });
});
