import { useCallback, useEffect, useRef, useState } from "react";

import { StockfishAnalysisEngine, type AnalysisResult } from "../engine/stockfishAnalysis";

import type { CompletedGameRecord } from "../lib/postGame/types";

import {
  createPostGameAnalysisQueue,
  type PostGameAnalysisPosition,
} from "../lib/postGame/postGameAnalysisQueue";

export type ReviewedPosition = {
  position: PostGameAnalysisPosition;
  before: AnalysisResult;
  after: AnalysisResult;
};

type ReviewJob = {
  generation: number;
  queue: PostGameAnalysisPosition[];
  index: number;
  stage: "before" | "after";
  beforeResult: AnalysisResult | null;
  results: ReviewedPosition[];
};

export function usePostGameAnalysis() {
  const engineRef = useRef<StockfishAnalysisEngine | null>(null);

  const jobRef = useRef<ReviewJob | null>(null);

  const generationRef = useRef(0);

  const readyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mountedRef = useRef(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [completedMoves, setCompletedMoves] = useState(0);

  const [totalMoves, setTotalMoves] = useState(0);

  const [results, setResults] = useState<ReviewedPosition[]>([]);

  const [error, setError] = useState<string | null>(null);

  const [isComplete, setIsComplete] = useState(false);

  const stopCurrentEngine = useCallback(() => {
    if (readyTimerRef.current !== null) {
      clearInterval(readyTimerRef.current);
      readyTimerRef.current = null;
    }

    engineRef.current?.stop();
    engineRef.current = null;
    jobRef.current = null;
  }, []);

  const cancelAnalysis = useCallback(() => {
    generationRef.current += 1;
    stopCurrentEngine();

    if (!mountedRef.current) return;

    setIsAnalyzing(false);
    setCompletedMoves(0);
    setTotalMoves(0);
    setResults([]);
    setError(null);
    setIsComplete(false);
  }, [stopCurrentEngine]);

  const startAnalysis = useCallback(
    (game: CompletedGameRecord) => {
      // Invalidate any previous review.
      generationRef.current += 1;
      stopCurrentEngine();

      const generation = generationRef.current;

      const queue = createPostGameAnalysisQueue(game);

      setCompletedMoves(0);
      setTotalMoves(queue.length);
      setResults([]);
      setError(null);
      setIsComplete(false);

      if (queue.length === 0) {
        setIsAnalyzing(false);
        setIsComplete(true);
        return;
      }

      const engine = new StockfishAnalysisEngine();

      engineRef.current = engine;

      const job: ReviewJob = {
        generation,
        queue,
        index: 0,
        stage: "before",
        beforeResult: null,
        results: [],
      };

      jobRef.current = job;
      setIsAnalyzing(true);

      // A newer review or an unmount makes this engine's results irrelevant.
      const isCurrent = () =>
        mountedRef.current &&
        generationRef.current === generation &&
        engineRef.current === engine &&
        jobRef.current === job;

      const fail = (message: string) => {
        if (!isCurrent()) return;

        generationRef.current += 1;
        stopCurrentEngine();

        setError(message);
        setIsAnalyzing(false);
      };

      const analyzeCurrentPosition = () => {
        if (!isCurrent()) return;

        const position = job.queue[job.index];

        if (!position) {
          fail("Missing review position.");
          return;
        }

        const fen = job.stage === "before" ? position.fenBefore : position.fenAfter;

        if (!engine.analyze(fen)) {
          fail(`Could not analyze move ${position.ply}.`);
        }
      };

      engine.onError((engineError) => {
        fail(engineError.message);
      });

      engine.onResult((result) => {
        if (!isCurrent()) return;

        if (!result.evaluation) {
          fail("Stockfish returned no evaluation.");
          return;
        }

        if (job.stage === "before") {
          job.beforeResult = result;
          job.stage = "after";

          analyzeCurrentPosition();
          return;
        }

        const position = job.queue[job.index];

        if (!job.beforeResult || !position) {
          fail("Incomplete review analysis.");
          return;
        }

        job.results.push({
          position,
          before: job.beforeResult,
          after: result,
        });

        job.index += 1;
        job.beforeResult = null;
        job.stage = "before";

        setCompletedMoves(job.index);

        if (job.index >= job.queue.length) {
          const completedResults = [...job.results];

          generationRef.current += 1;
          stopCurrentEngine();

          setResults(completedResults);
          setIsAnalyzing(false);
          setIsComplete(true);
          return;
        }

        analyzeCurrentPosition();
      });

      engine.start();

      const readyStartedAt = Date.now();

      readyTimerRef.current = setInterval(() => {
        if (!isCurrent()) return;

        if (engine.isReady()) {
          if (readyTimerRef.current !== null) {
            clearInterval(readyTimerRef.current);
            readyTimerRef.current = null;
          }

          analyzeCurrentPosition();
          return;
        }

        if (Date.now() - readyStartedAt > 15000) {
          fail("Post-game Stockfish engine did not become ready.");
        }
      }, 50);
    },
    [stopCurrentEngine],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      stopCurrentEngine();
    };
  }, [stopCurrentEngine]);

  return {
    isAnalyzing,
    completedMoves,
    totalMoves,
    results,
    error,
    isComplete,
    startAnalysis,
    cancelAnalysis,
  };
}
