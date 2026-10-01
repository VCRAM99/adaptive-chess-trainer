import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
  getDecisionImportance,
} from "../lib/decisionDifficulty";

import type {
  DecisionImportance,
} from "../lib/decisionDifficulty";


import {
    StockfishAnalysisEngine,
} from "../engine/stockfishAnalysis";

import type {
    AnalysisResult,
} from "../engine/stockfishAnalysis";

import {
    normalizeToWhitePerspective,
    getPlayerPerspectiveEvaluation,
} from "../lib/moveQuality";

import type {
    PlayerColor,
} from "../lib/moveQuality";

import {
    createMoveAnalysis,
} from "../lib/moveAnalysis";

import type {
    MoveAnalysis,
} from "../lib/moveAnalysis";

import {
    devLog,
} from "../lib/devLogger";

type AnalyzePlayerMoveInput = {
    moveNumber: number;
  
    playerColor: PlayerColor;
  
    playerMove: string;
  
    beforeFen: string;
    afterFen: string;

    legalMoveCount: number;
};

type AnalysisJob = {
    input: AnalyzePlayerMoveInput;
  
    stage: "before" | "after";
  
    beforeResult: AnalysisResult | null;
};

function getSideToMove(
    fen: string
  ): PlayerColor {
    const parts = fen.split(" ");
  
    return parts[1] === "b"
      ? "black"
      : "white";
}


function getCandidatePlayerEvaluation(
  evaluation: AnalysisResult["candidates"][number]["evaluation"],
  fen: string,
  playerColor: PlayerColor
): number {
  const sideToMove =
    getSideToMove(fen);

  const whiteEvaluation =
    normalizeToWhitePerspective(
      evaluation,
      sideToMove
    );

  return getPlayerPerspectiveEvaluation(
    whiteEvaluation,
    playerColor
  );
}

export function useMoveAnalysis() {
    const engineRef =
      useRef<StockfishAnalysisEngine | null>(
        null
      );
  
    const jobRef =
      useRef<AnalysisJob | null>(null);
  
    const [isReady, setIsReady] =
      useState(false);
  
    const [isAnalyzing, setIsAnalyzing] =
      useState(false);
  
    const [latestAnalysis, setLatestAnalysis] =
      useState<MoveAnalysis | null>(null);

    useEffect(() => {
        const engine =
          new StockfishAnalysisEngine();
      
        engineRef.current = engine;
      
        engine.onError((error) => {
          console.error(
            "Analysis engine error:",
            error
          );
      
          jobRef.current = null;
      
          setIsAnalyzing(false);
          setIsReady(false);
        });
        
        engine.onResult((result) => {
            const job = jobRef.current;
          
            if (!job) {
              return;
            }
          
            if (!result.evaluation) {
              console.error(
                "Analysis completed without an evaluation"
              );
          
              jobRef.current = null;
              setIsAnalyzing(false);
          
              return;
            }
          
            if (job.stage === "before") {
              job.beforeResult = result;
              job.stage = "after";
          
              const started =
                engine.analyze(job.input.afterFen);
          
              if (!started) {
                console.error(
                  "Could not start after-position analysis"
                );
          
                jobRef.current = null;
                setIsAnalyzing(false);
              }
          
              return;
            }
          
            if (!job.beforeResult?.evaluation) {
              jobRef.current = null;
              setIsAnalyzing(false);
          
              return;
            }
          
            const beforeWhite =
              normalizeToWhitePerspective(
                job.beforeResult.evaluation,
                getSideToMove(job.input.beforeFen)
              );
          
            const afterWhite =
              normalizeToWhitePerspective(
                result.evaluation,
                getSideToMove(job.input.afterFen)
              );
          
            const beforePlayer =
              getPlayerPerspectiveEvaluation(
                beforeWhite,
                job.input.playerColor
              );
          
            const afterPlayer =
              getPlayerPerspectiveEvaluation(
                afterWhite,
                job.input.playerColor
              );
              

              const candidates =
              job.beforeResult.candidates;
              
            let decisionImportance:
              DecisionImportance = "low";
            
            if (candidates.length >= 2) {
              const bestCandidate =
                candidates[0];
            
              const secondCandidate =
                candidates[1];
            
              const bestEvaluation =
                getCandidatePlayerEvaluation(
                  bestCandidate.evaluation,
                  job.input.beforeFen,
                  job.input.playerColor
                );
            
              const secondEvaluation =
                getCandidatePlayerEvaluation(
                  secondCandidate.evaluation,
                  job.input.beforeFen,
                  job.input.playerColor
                );
            
              decisionImportance =
                getDecisionImportance(
                  bestEvaluation,
                  secondEvaluation
                );
            }

            if (job.input.legalMoveCount <= 1) {
              decisionImportance = "low";
            }
            
            const analysis =
              createMoveAnalysis({
                moveNumber: job.input.moveNumber,
          
                playerColor:
                  job.input.playerColor,
          
                playerMove:
                  job.input.playerMove,
          
                bestMove:
                  job.beforeResult.bestMove,
          
                beforeEvaluation:
                  beforePlayer,
          
                afterEvaluation:
                  afterPlayer,

                legalMoveCount:
                  job.input.legalMoveCount,

                decisionImportance,
              });
          
            setLatestAnalysis(analysis);
          
            devLog(
              "Player move analysis:",
              analysis
            );
          
            jobRef.current = null;
            setIsAnalyzing(false);
        });

        engine.start();
      
        const readyCheck = window.setInterval(() => {
          if (engine.isReady()) {
            setIsReady(true);
      
            window.clearInterval(readyCheck);
          }
        }, 50);
      
        return () => {
          window.clearInterval(readyCheck);
      
          engine.stop();
      
          engineRef.current = null;
          jobRef.current = null;
        };
    }, []);

    const analyzePlayerMove =
        useCallback(
            (
            input: AnalyzePlayerMoveInput
            ) => {
            const engine =
                engineRef.current;

            if (
                !engine ||
                !engine.isReady() ||
                engine.isAnalyzing() ||
                jobRef.current
            ) {
                return false;
            }

            jobRef.current = {
                input,
                stage: "before",
                beforeResult: null,
            };

            setIsAnalyzing(true);

            const started =
                engine.analyze(input.beforeFen);

            if (!started) {
                jobRef.current = null;
                setIsAnalyzing(false);

                return false;
            }

            return true;
            },
            []
        );
    return {
        isReady,
        isAnalyzing,
        latestAnalysis,
        analyzePlayerMove,
    };
}