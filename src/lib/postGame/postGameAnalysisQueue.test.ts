import { describe, expect, it } from "vitest";

import { buildGameRecord } from "./buildGameRecord";

import { createPostGameAnalysisQueue } from "./postGameAnalysisQueue";

describe("post-game analysis queue", () => {
  it("creates one task per move", () => {
    const game = buildGameRecord(
      "1. e4 e5 2. Nf3 Nc6",
      "test-game",
      "2026-10-04T10:00:00Z",
      "2026-10-04T10:05:00Z",
      "draw",
    );

    const queue = createPostGameAnalysisQueue(game);

    expect(queue).toHaveLength(4);

    expect(queue[0].playedMoveUci).toBe("e2e4");

    expect(queue[1].playedBy).toBe("black");

    expect(queue[2].playedMoveUci).toBe("g1f3");
  });

  it("preserves position continuity", () => {
    const game = buildGameRecord(
      "1. e4 e5",
      "continuity-test",
      "2026-10-04T10:00:00Z",
      "2026-10-04T10:05:00Z",
      "draw",
    );

    const queue = createPostGameAnalysisQueue(game);

    expect(queue[0].fenAfter).toBe(queue[1].fenBefore);
  });

  it("handles an empty game", () => {
    const game = buildGameRecord(
      "",
      "empty-game",
      "2026-10-04T10:00:00Z",
      "2026-10-04T10:00:00Z",
      "draw",
    );

    expect(createPostGameAnalysisQueue(game)).toEqual([]);
  });
});
