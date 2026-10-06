import type { EngineEvaluation } from "../../engine/uciAnalysis";
import type { ReviewedPosition } from "../../hooks/usePostGameAnalysis";

export const EVALUATION_GRAPH_LIMIT = 6;

export type EvaluationPoint = {
  ply: number;
  evaluation: number | null;
  graphEvaluation: number | null;
  isMate: boolean;
  mateIn: number | null;
};

function evaluationToWhitePerspective(
  evaluation: EngineEvaluation,
  sideToMove: "white" | "black"
): {
  evaluation: number;
  isMate: boolean;
  mateIn: number | null;
} {
  const direction =
    sideToMove === "white" ? 1 : -1;

  if (evaluation.type === "cp") {
    return {
      evaluation:
        (evaluation.value / 100) * direction,
      isMate: false,
      mateIn: null,
    };
  }

  const whiteMateValue =
    evaluation.value * direction;

  return {
    evaluation:
      whiteMateValue > 0
        ? EVALUATION_GRAPH_LIMIT
        : -EVALUATION_GRAPH_LIMIT,

    isMate: true,
    mateIn: whiteMateValue,
  };
}

function clampEvaluation(
  evaluation: number
): number {
  return Math.max(
    -EVALUATION_GRAPH_LIMIT,
    Math.min(
      EVALUATION_GRAPH_LIMIT,
      evaluation
    )
  );
}

export function createEvaluationTimeline(
  reviews: ReviewedPosition[]
): EvaluationPoint[] {
  if (reviews.length === 0) {
    return [];
  }

  const points: EvaluationPoint[] = [];

  const firstReview = reviews[0];
  const startingEvaluation =
    firstReview.before.evaluation;

  if (startingEvaluation === null) {
    points.push({
      ply: 0,
      evaluation: null,
      graphEvaluation: null,
      isMate: false,
      mateIn: null,
    });
  } else {
    const convertedStart =
      evaluationToWhitePerspective(
        startingEvaluation,
        "white"
      );

    points.push({
      ply: 0,
      evaluation:
        convertedStart.evaluation,
      graphEvaluation:
        clampEvaluation(
          convertedStart.evaluation
        ),
      isMate:
        convertedStart.isMate,
      mateIn:
        convertedStart.mateIn,
    });
  }

  for (const review of reviews) {
    const sideToMoveAfter =
      review.position.playedBy === "white"
        ? "black"
        : "white";

    const afterEvaluation =
      review.after.evaluation;

    if (afterEvaluation === null) {
      points.push({
        ply: review.position.ply,
        evaluation: null,
        graphEvaluation: null,
        isMate: false,
        mateIn: null,
      });

      continue;
    }

    const converted =
      evaluationToWhitePerspective(
        afterEvaluation,
        sideToMoveAfter
      );

    points.push({
      ply: review.position.ply,
      evaluation:
        converted.evaluation,
      graphEvaluation:
        clampEvaluation(
          converted.evaluation
        ),
      isMate: converted.isMate,
      mateIn: converted.mateIn,
    });
  }

  return points;
}