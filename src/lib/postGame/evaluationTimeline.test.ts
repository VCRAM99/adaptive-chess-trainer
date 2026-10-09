import { describe, expect, it } from "vitest";

import type { EngineEvaluation } from "../../engine/uciAnalysis";

import type { ReviewedPosition } from "../../hooks/usePostGameAnalysis";

import { createEvaluationTimeline, EVALUATION_GRAPH_LIMIT } from "./evaluationTimeline";

function createReview(
  ply: number,
  playedBy: "white" | "black",
  evaluation: EngineEvaluation | null,
): ReviewedPosition {
  return {
    position: {
      ply,
      san: "e4",
      playedBy,
      playedMoveUci: "e2e4",
      fenBefore: "",
      fenAfter: "",
    },

    before: {
      evaluation: {
        type: "cp",
        value: 0,
        depth: 12,
      },
      bestMove: "e2e4",
      candidates: [],
    },

    after: {
      evaluation,
      bestMove: "e7e5",
      candidates: [],
    },
  };
}

describe("createEvaluationTimeline", () => {
  it("keeps positive evaluations positive when White is to move", () => {
    const reviews = [
      createReview(2, "black", {
        type: "cp",
        value: 150,
        depth: 12,
      }),
    ];

    const points = createEvaluationTimeline(reviews);

    expect(points[1].evaluation).toBe(1.5);
    expect(points[1].graphEvaluation).toBe(1.5);
  });

  it("flips the evaluation when Black is to move", () => {
    const reviews = [
      createReview(1, "white", {
        type: "cp",
        value: 200,
        depth: 12,
      }),
    ];

    const points = createEvaluationTimeline(reviews);

    expect(points[1].evaluation).toBe(-2);
    expect(points[1].graphEvaluation).toBe(-2);
  });

  it("clamps large White advantages", () => {
    const reviews = [
      createReview(2, "black", {
        type: "cp",
        value: 1200,
        depth: 12,
      }),
    ];

    const points = createEvaluationTimeline(reviews);

    expect(points[1].evaluation).toBe(12);

    expect(points[1].graphEvaluation).toBe(EVALUATION_GRAPH_LIMIT);
  });

  it("clamps large Black advantages", () => {
    const reviews = [
      createReview(1, "white", {
        type: "cp",
        value: 900,
        depth: 12,
      }),
    ];

    const points = createEvaluationTimeline(reviews);

    expect(points[1].evaluation).toBe(-9);

    expect(points[1].graphEvaluation).toBe(-EVALUATION_GRAPH_LIMIT);
  });

  it("places White mate at the top of the graph", () => {
    const reviews = [
      createReview(2, "black", {
        type: "mate",
        value: 3,
        depth: 12,
      }),
    ];

    const points = createEvaluationTimeline(reviews);

    expect(points[1].isMate).toBe(true);
    expect(points[1].mateIn).toBe(3);

    expect(points[1].graphEvaluation).toBe(EVALUATION_GRAPH_LIMIT);
  });

  it("places Black mate at the bottom of the graph", () => {
    const reviews = [
      createReview(1, "white", {
        type: "mate",
        value: 3,
        depth: 12,
      }),
    ];

    const points = createEvaluationTimeline(reviews);

    expect(points[1].isMate).toBe(true);
    expect(points[1].mateIn).toBe(-3);

    expect(points[1].graphEvaluation).toBe(-EVALUATION_GRAPH_LIMIT);
  });
  it("includes exactly one starting-position point", () => {
    const points = createEvaluationTimeline([
      createReview(1, "white", {
        type: "cp",
        value: 25,
        depth: 12,
      }),
      createReview(2, "black", {
        type: "cp",
        value: -30,
        depth: 12,
      }),
    ]);

    expect(points).toHaveLength(3);

    expect(points.map((point) => point.ply)).toEqual([0, 1, 2]);
  });

  it("clamps extreme positive evaluations to the graph limit", () => {
    const points = createEvaluationTimeline([
      createReview(1, "white", {
        type: "cp",
        value: -2000,
        depth: 12,
      }),
    ]);

    expect(points[1].evaluation).toBe(20);

    expect(points[1].graphEvaluation).toBe(EVALUATION_GRAPH_LIMIT);
  });

  it("clamps extreme negative evaluations to the graph limit", () => {
    const points = createEvaluationTimeline([
      createReview(1, "white", {
        type: "cp",
        value: 2000,
        depth: 12,
      }),
    ]);

    expect(points[1].evaluation).toBe(-20);

    expect(points[1].graphEvaluation).toBe(-EVALUATION_GRAPH_LIMIT);
  });

  it("preserves a missing move evaluation without removing the point", () => {
    const points = createEvaluationTimeline([createReview(1, "white", null)]);

    expect(points).toHaveLength(2);

    expect(points[1]).toEqual({
      ply: 1,
      evaluation: null,
      graphEvaluation: null,
      isMate: false,
      mateIn: null,
    });
  });

  it("handles a one-move game", () => {
    const points = createEvaluationTimeline([
      createReview(1, "white", {
        type: "cp",
        value: 75,
        depth: 12,
      }),
    ]);

    expect(points).toHaveLength(2);

    expect(points[0].ply).toBe(0);
    expect(points[1].ply).toBe(1);
  });

  it("handles missing evaluations", () => {
    const reviews = [createReview(1, "white", null)];

    const points = createEvaluationTimeline(reviews);

    expect(points[1]).toEqual({
      ply: 1,
      evaluation: null,
      graphEvaluation: null,
      isMate: false,
      mateIn: null,
    });
  });
});
