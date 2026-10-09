export type EngineEvaluation =
  | {
      type: "cp";
      value: number;
      depth: number;
    }
  | {
      type: "mate";
      value: number;
      depth: number;
    };

export function parseEngineEvaluation(message: string): EngineEvaluation | null {
  const depthMatch = /\bdepth\s+(\d+)/.exec(message);

  if (!depthMatch) return null;

  const depth = Number(depthMatch[1]);

  const cpMatch = /\bscore\s+cp\s+(-?\d+)/.exec(message);

  if (cpMatch) {
    return {
      type: "cp",
      value: Number(cpMatch[1]),
      depth,
    };
  }

  const mateMatch = /\bscore\s+mate\s+(-?\d+)/.exec(message);

  if (mateMatch) {
    return {
      type: "mate",
      value: Number(mateMatch[1]),
      depth,
    };
  }

  return null;
}

export type CandidateMoveEvaluation = {
  rank: number;
  move: string;
  evaluation: EngineEvaluation;
};

export function parseCandidateMoveEvaluation(message: string): CandidateMoveEvaluation | null {
  const evaluation = parseEngineEvaluation(message);

  if (!evaluation) return null;

  const multiPvMatch = /\bmultipv\s+(\d+)/.exec(message);

  const pvMatch = /\bpv\s+(\S+)/.exec(message);

  if (!multiPvMatch || !pvMatch) return null;

  return {
    rank: Number(multiPvMatch[1]),
    move: pvMatch[1],
    evaluation,
  };
}
