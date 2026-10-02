import {
    OpponentAnalysisEngine,
    type OpponentCandidateAnalysisResult,
  } from "../engine/opponentAnalysis";
  
  export type BenchmarkRun = {
    fen: string;
    analysisTimeMs: number;
    durationMs: number;
    result: OpponentCandidateAnalysisResult;
  };
  
  export type AnalysisComparisonSummary = {
    candidateCount500: number;
    candidateCount1000: number;
    sharedCandidates: number;
    sharedCandidatePercent: number;
    averageEvaluationDifference: number;
    maxEvaluationDifference: number;
    averageRankDifference: number;
  };

  function getCentipawnValue(
    evaluation:
      OpponentCandidateAnalysisResult[
        "candidates"
      ][number]["evaluation"]
  ): number | null {
    if (evaluation.type !== "cp") {
      return null;
    }
  
    return evaluation.value;
  }

  function runSingleAnalysis(
    fen: string,
    analysisTimeMs: number
  ): Promise<BenchmarkRun> {
    return new Promise((resolve, reject) => {
      const engine =
        new OpponentAnalysisEngine();
  
      const startedAt =
        performance.now();
  
      engine.onResult((result) => {
        const durationMs =
          performance.now() - startedAt;
  
        engine.stop();
  
        resolve({
          fen,
          analysisTimeMs,
          durationMs,
          result,
        });
      });
  
      engine.onError((error) => {
        engine.stop();
        reject(error);
      });
  
      engine.start();
  
      const waitForReady = () => {
        if (engine.isReady()) {
          const started = engine.analyze(
            fen,
            20,
            analysisTimeMs
          );
  
          if (!started) {
            engine.stop();
  
            reject(
              new Error(
                "Benchmark analysis could not start."
              )
            );
          }
  
          return;
        }
  
        window.setTimeout(
          waitForReady,
          10
        );
      };
  
      waitForReady();
    });
  }


  export type CandidateComparison = {
    move: string;
    rank500: number | null;
    rank1000: number | null;
    evaluation500: string | null;
    evaluation1000: string | null;
  };
  
  function formatEvaluation(
    evaluation:
      OpponentCandidateAnalysisResult[
        "candidates"
      ][number]["evaluation"]
  ): string {
    return `${evaluation.type}:${evaluation.value}`;
  }
  
  export async function compareAnalysisTimes(
    fen: string
  ) {
    const run500 =
      await runSingleAnalysis(
        fen,
        500
      );
  
    const run1000 =
      await runSingleAnalysis(
        fen,
        1000
      );
  
    const candidates500 =
      new Map(
        run500.result.candidates.map(
          (candidate) => [
            candidate.move,
            candidate,
          ]
        )
      );
  
    const candidates1000 =
      new Map(
        run1000.result.candidates.map(
          (candidate) => [
            candidate.move,
            candidate,
          ]
        )
      );
  
    const moves =
      new Set([
        ...candidates500.keys(),
        ...candidates1000.keys(),
      ]);
  
    const comparison:
      CandidateComparison[] =
      Array.from(moves).map(
        (move) => {
          const candidate500 =
            candidates500.get(move);
  
          const candidate1000 =
            candidates1000.get(move);
  
          return {
            move,
  
            rank500:
              candidate500?.rank ??
              null,
  
            rank1000:
              candidate1000?.rank ??
              null,
  
            evaluation500:
              candidate500
                ? formatEvaluation(
                    candidate500.evaluation
                  )
                : null,
  
            evaluation1000:
              candidate1000
                ? formatEvaluation(
                    candidate1000.evaluation
                  )
                : null,
          };
        }
      );

      const shared =
      comparison.filter(
        (candidate) =>
          candidate.rank500 !== null &&
          candidate.rank1000 !== null
      );
    
    const evaluationDifferences =
      shared
        .map((candidate) => {
          const candidate500 =
            candidates500.get(
              candidate.move
            );
    
          const candidate1000 =
            candidates1000.get(
              candidate.move
            );
    
          if (
            !candidate500 ||
            !candidate1000
          ) {
            return null;
          }
    
          const value500 =
            getCentipawnValue(
              candidate500.evaluation
            );
    
          const value1000 =
            getCentipawnValue(
              candidate1000.evaluation
            );
    
          if (
            value500 === null ||
            value1000 === null
          ) {
            return null;
          }
    
          return Math.abs(
            value500 - value1000
          );
        })
        .filter(
          (value): value is number =>
            value !== null
        );
    
    const rankDifferences =
      shared.map((candidate) =>
        Math.abs(
          candidate.rank500! -
            candidate.rank1000!
        )
      );
    
    const summary:
      AnalysisComparisonSummary = {
        candidateCount500:
          run500.result.candidates.length,
    
        candidateCount1000:
          run1000.result.candidates.length,
    
        sharedCandidates:
          shared.length,
    
        sharedCandidatePercent:
          comparison.length === 0
            ? 0
            : (shared.length /
                comparison.length) *
              100,
    
        averageEvaluationDifference:
          evaluationDifferences.length === 0
            ? 0
            : evaluationDifferences.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              evaluationDifferences.length,
    
        maxEvaluationDifference:
          evaluationDifferences.length === 0
            ? 0
            : Math.max(
                ...evaluationDifferences
              ),
    
        averageRankDifference:
          rankDifferences.length === 0
            ? 0
            : rankDifferences.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              rankDifferences.length,
      };
  
    console.log(
      "500 ms candidates:",
      run500.result.candidates.length
    );
  
    console.log(
      "1000 ms candidates:",
      run1000.result.candidates.length
    );
  
    console.table(summary);
    console.table(comparison);
  
    return {
      run500,
      run1000,
      comparison,
      summary,
    };
  }