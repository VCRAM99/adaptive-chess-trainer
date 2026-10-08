import { useCallback, useEffect, useRef, useState } from "react";

import { getDecisionImportance, type DecisionImportance } from "../lib/decisionDifficulty";
import { StockfishAnalysisEngine, type AnalysisResult } from "../engine/stockfishAnalysis";
import {
  getPlayerPerspectiveEvaluation,
  normalizeToWhitePerspective,
  type PlayerColor,
} from "../lib/moveQuality";
import { createMoveAnalysis, type MoveAnalysis } from "../lib/moveAnalysis";

import type { MoveAnalysisDelivery } from "../lib/moveAnalysisRequest";

import { devLog } from "../lib/devLogger";

type AnalyzePlayerMoveInput = {
  requestId: string;

  gameGeneration: number;

  moveNumber: number;

  playerColor: PlayerColor;

  playerMove: string;

  beforeFen: string;
  afterFen: string;

  legalMoveCount: number;
};

type AnalysisJob = {
  generation: number;

  input: AnalyzePlayerMoveInput;

  stage: "before" | "after";

  beforeResult: AnalysisResult | null;
};

function getSideToMove(fen: string): PlayerColor {
  const parts = fen.split(" ");

  return parts[1] === "b" ? "black" : "white";
}

function getCandidatePlayerEvaluation(
  evaluation: AnalysisResult["candidates"][number]["evaluation"],
  fen: string,
  playerColor: PlayerColor,
): number {
  const sideToMove = getSideToMove(fen);

  const whiteEvaluation = normalizeToWhitePerspective(evaluation, sideToMove);

  return getPlayerPerspectiveEvaluation(whiteEvaluation, playerColor);
}

export function useMoveAnalysis() {
  const engineRef = useRef<StockfishAnalysisEngine | null>(null);

  const jobRef = useRef<AnalysisJob | null>(null);

  const queuedJobRef = useRef<AnalysisJob | null>(null);

  const searchGenerationRef = useRef(0);

  const mountedRef = useRef(true);

  const errorGenerationRef = useRef(0);

  const [isReady, setIsReady] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [latestAnalysis, setLatestAnalysis] = useState<MoveAnalysisDelivery | null>(null);

  const startJob = useCallback((engine: StockfishAnalysisEngine, job: AnalysisJob) => {
    jobRef.current = job;
    errorGenerationRef.current = job.generation;
    setIsAnalyzing(true);

    const started = engine.analyze(job.input.beforeFen);

    if (!started) {
      if (jobRef.current === job) {
        jobRef.current = null;
      }

      setIsAnalyzing(false);
      return false;
    }

    return true;
  }, []);

  useEffect(() => {
    const engine = new StockfishAnalysisEngine();

    engineRef.current = engine;
    mountedRef.current = true;

    engine.onError((error) => {
      if (!mountedRef.current || errorGenerationRef.current !== searchGenerationRef.current) return;

      console.error("Analysis engine error:", error);

      jobRef.current = null;
      queuedJobRef.current = null;

      setIsAnalyzing(false);
      setIsReady(false);
    });

    engine.onResult((result) => {
      if (!mountedRef.current) return;

      const job = jobRef.current;
      const currentGeneration = searchGenerationRef.current;

      // Drop a result from a search this game has already replaced.
      if (!job || job.generation !== currentGeneration) {
        const queued = queuedJobRef.current;
        queuedJobRef.current = null;

        if (
          queued &&
          queued.generation === currentGeneration &&
          engine.isReady() &&
          !engine.isAnalyzing()
        ) {
          startJob(engine, queued);
          return;
        }

        setIsAnalyzing(false);
        return;
      }

      if (!result.evaluation) {
        console.error("Analysis completed without an evaluation");

        jobRef.current = null;
        setIsAnalyzing(false);

        return;
      }

      if (job.stage === "before") {
        job.beforeResult = result;
        job.stage = "after";

        const started = engine.analyze(job.input.afterFen);

        if (!started) {
          console.error("Could not start after-position analysis");

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

      if (job.generation !== searchGenerationRef.current) return;

      const beforeWhite = normalizeToWhitePerspective(
        job.beforeResult.evaluation,
        getSideToMove(job.input.beforeFen),
      );

      const afterWhite = normalizeToWhitePerspective(
        result.evaluation,
        getSideToMove(job.input.afterFen),
      );

      const beforePlayer = getPlayerPerspectiveEvaluation(beforeWhite, job.input.playerColor);

      const afterPlayer = getPlayerPerspectiveEvaluation(afterWhite, job.input.playerColor);

      const candidates = job.beforeResult.candidates;

      let decisionImportance: DecisionImportance = "low";

      if (candidates.length >= 2) {
        const bestCandidate = candidates[0];

        const secondCandidate = candidates[1];

        const bestEvaluation = getCandidatePlayerEvaluation(
          bestCandidate.evaluation,
          job.input.beforeFen,
          job.input.playerColor,
        );

        const secondEvaluation = getCandidatePlayerEvaluation(
          secondCandidate.evaluation,
          job.input.beforeFen,
          job.input.playerColor,
        );

        decisionImportance = getDecisionImportance(bestEvaluation, secondEvaluation);
      }

      if (job.input.legalMoveCount <= 1) {
        decisionImportance = "low";
      }

      const moveAnalysis: MoveAnalysis = createMoveAnalysis({
        moveNumber: job.input.moveNumber,

        playerColor: job.input.playerColor,

        playerMove: job.input.playerMove,

        bestMove: job.beforeResult.bestMove,

        beforeEvaluation: beforePlayer,

        afterEvaluation: afterPlayer,

        legalMoveCount: job.input.legalMoveCount,

        decisionImportance,
      });

      const published: MoveAnalysisDelivery = {
        requestId: job.input.requestId,
        gameGeneration: job.input.gameGeneration,
        beforeFen: job.input.beforeFen,
        afterFen: job.input.afterFen,
        analysis: moveAnalysis,
      };

      setLatestAnalysis(published);

      devLog("Player move analysis:", moveAnalysis);

      jobRef.current = null;
      setIsAnalyzing(false);
    });

    engine.start();

    const readyCheck = window.setInterval(() => {
      if (!mountedRef.current) {
        window.clearInterval(readyCheck);
        return;
      }

      if (engine.isReady()) {
        setIsReady(true);

        window.clearInterval(readyCheck);
      }
    }, 50);

    return () => {
      mountedRef.current = false;
      searchGenerationRef.current += 1;
      errorGenerationRef.current = -1;
      jobRef.current = null;
      queuedJobRef.current = null;

      window.clearInterval(readyCheck);

      engine.stop();

      engineRef.current = null;
    };
  }, [startJob]);

  const cancelAnalysis = useCallback(() => {
    searchGenerationRef.current += 1;
    errorGenerationRef.current = -1;
    jobRef.current = null;
    queuedJobRef.current = null;

    engineRef.current?.stopAnalysis();

    if (!mountedRef.current) return;

    setIsAnalyzing(false);
    setLatestAnalysis(null);
  }, []);

  const analyzePlayerMove = useCallback(
    (input: AnalyzePlayerMoveInput) => {
      const engine = engineRef.current;

      if (!engine || !engine.isReady()) return false;

      const generation = ++searchGenerationRef.current;

      const job: AnalysisJob = {
        generation,
        input,
        stage: "before",
        beforeResult: null,
      };

      if (engine.isAnalyzing()) {
        queuedJobRef.current = job;
        jobRef.current = null;
        engine.stopAnalysis();
        return true;
      }

      jobRef.current = null;

      return startJob(engine, job);
    },
    [startJob],
  );

  return {
    isReady,
    isAnalyzing,
    latestAnalysis,
    analyzePlayerMove,
    cancelAnalysis,
  };
}
