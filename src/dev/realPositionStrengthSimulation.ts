import {
  OpponentAnalysisEngine,
  OPPONENT_ANALYSIS_TIME_MS,
  MAX_OPPONENT_MULTIPV,
  type OpponentCandidateAnalysisResult,
} from "../engine/opponentAnalysis";

import { createOpponentCandidates } from "../lib/opponentCandidateAnalysis";

import { simulateSkillRange } from "./opponentStrengthSimulator";

export function analyzePosition(fen: string): Promise<OpponentCandidateAnalysisResult> {
  return new Promise((resolve, reject) => {
    const engine = new OpponentAnalysisEngine();

    engine.onResult((result) => {
      engine.stop();
      resolve(result);
    });

    engine.onError((error) => {
      engine.stop();
      reject(error);
    });

    engine.start();

    const waitForReady = () => {
      if (!engine.isReady()) {
        window.setTimeout(waitForReady, 10);

        return;
      }

      const started = engine.analyze(fen, MAX_OPPONENT_MULTIPV, OPPONENT_ANALYSIS_TIME_MS);

      if (!started) {
        engine.stop();

        reject(new Error("Real-position analysis could not start."));
      }
    };

    waitForReady();
  });
}

export async function simulateRealPosition(fen: string) {
  const analysis = await analyzePosition(fen);

  const candidates = createOpponentCandidates(analysis.candidates, "black", "black");

  console.table(
    candidates.map((candidate) => ({
      move: candidate.move,
      rank: candidate.rank,
      cpl: candidate.centipawnLoss,
      mate: candidate.mate,
    })),
  );

  const results = simulateSkillRange(candidates, 10_000);

  console.table(
    results.map((result) => ({
      skill: result.targetSkill,

      avgCpl: Number(result.averageCpl.toFixed(1)),

      medianCpl: result.medianCpl,

      excellent: Number(result.excellentPercent.toFixed(1)),

      good: Number(result.goodPercent.toFixed(1)),

      inaccuracy: Number(result.inaccuracyPercent.toFixed(1)),

      mistake: Number(result.mistakePercent.toFixed(1)),

      blunder: Number(result.blunderPercent.toFixed(1)),
    })),
  );

  return {
    analysis,
    candidates,
    results,
  };
}
