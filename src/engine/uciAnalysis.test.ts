import { describe, expect, it } from "vitest";

import {
  parseEngineEvaluation,
  parseCandidateMoveEvaluation,
} from "./uciAnalysis";

describe("parseEngineEvaluation", () => {
  it("parses a positive centipawn evaluation", () => {
    expect(
      parseEngineEvaluation(
        "info depth 12 score cp 34 nodes 1000"
      )
    ).toEqual({
      type: "cp",
      value: 34,
      depth: 12,
    });
  });

  it("parses a negative centipawn evaluation", () => {
    expect(
      parseEngineEvaluation(
        "info depth 10 score cp -87 nodes 500"
      )
    ).toEqual({
      type: "cp",
      value: -87,
      depth: 10,
    });
  });

  it("parses a positive mate score", () => {
    expect(
      parseEngineEvaluation(
        "info depth 15 score mate 3 nodes 2000"
      )
    ).toEqual({
      type: "mate",
      value: 3,
      depth: 15,
    });
  });

  it("parses a negative mate score", () => {
    expect(
      parseEngineEvaluation(
        "info depth 18 score mate -2"
      )
    ).toEqual({
      type: "mate",
      value: -2,
      depth: 18,
    });
  });

  it("ignores messages without a score", () => {
    expect(
      parseEngineEvaluation(
        "info depth 10 nodes 500"
      )
    ).toBeNull();
  });

  it("ignores readyok", () => {
    expect(
      parseEngineEvaluation("readyok")
    ).toBeNull();
  });

  it("ignores bestmove messages", () => {
    expect(
      parseEngineEvaluation(
        "bestmove e2e4"
      )
    ).toBeNull();
  });

  it("requires a depth value", () => {
    expect(
      parseEngineEvaluation(
        "info score cp 42"
      )
    ).toBeNull();
  });
});

describe(
  "parseCandidateMoveEvaluation",
  () => {
    it("parses the first candidate move", () => {
      expect(
        parseCandidateMoveEvaluation(
          "info depth 12 multipv 1 score cp 31 nodes 500 pv e2e4 e7e5"
        )
      ).toEqual({
        rank: 1,
        move: "e2e4",
        evaluation: {
          type: "cp",
          value: 31,
          depth: 12,
        },
      });
    });

    it("parses another candidate move", () => {
      expect(
        parseCandidateMoveEvaluation(
          "info depth 12 multipv 3 score cp 18 pv g1f3 d7d5"
        )
      ).toEqual({
        rank: 3,
        move: "g1f3",
        evaluation: {
          type: "cp",
          value: 18,
          depth: 12,
        },
      });
    });

    it("supports mate evaluations", () => {
      expect(
        parseCandidateMoveEvaluation(
          "info depth 15 multipv 1 score mate 3 pv h5h7"
        )
      ).toEqual({
        rank: 1,
        move: "h5h7",
        evaluation: {
          type: "mate",
          value: 3,
          depth: 15,
        },
      });
    });

    it("ignores normal info messages without multipv", () => {
      expect(
        parseCandidateMoveEvaluation(
          "info depth 12 score cp 31 pv e2e4"
        )
      ).toBeNull();
    });

    it("ignores messages without a principal variation", () => {
      expect(
        parseCandidateMoveEvaluation(
          "info depth 12 multipv 1 score cp 31"
        )
      ).toBeNull();
    });
  }
);