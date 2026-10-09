import { useCallback, useEffect, useRef, useState } from "react";

import {
  OpponentAnalysisEngine,
  type OpponentCandidateAnalysisResult,
} from "../engine/opponentAnalysis";

export type OpponentAnalysisResult = {
  fen: string;
  analysis: OpponentCandidateAnalysisResult;
};

export function useOpponentAnalysis() {
  const engineRef = useRef<OpponentAnalysisEngine | null>(null);

  const [result, setResult] = useState<OpponentAnalysisResult | null>(null);

  const [isReady, setIsReady] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const generationRef = useRef(0);

  const searchTokenRef = useRef(0);

  const activeFenRef = useRef<string | null>(null);

  const [terminalFen, setTerminalFen] = useState<string | null>(null);

  const attachEngine = useCallback((generation: number) => {
    searchTokenRef.current = 0;

    const engine = new OpponentAnalysisEngine();

    engineRef.current = engine;

    engine.onResult((analysisResult) => {
      // Ignore a search replaced by New Game, Undo, or a newer position.
      if (
        generation !== generationRef.current ||
        analysisResult.searchToken !== searchTokenRef.current
      ) {
        return;
      }

      const analyzedFen = activeFenRef.current;

      if (!analyzedFen) {
        setIsAnalyzing(false);
        return;
      }

      setResult({
        fen: analyzedFen,
        analysis: analysisResult,
      });

      activeFenRef.current = null;
      setIsAnalyzing(false);
    });

    engine.onTerminal((token) => {
      if (generation !== generationRef.current || token !== searchTokenRef.current) return;

      const analyzedFen = activeFenRef.current;

      activeFenRef.current = null;
      setIsAnalyzing(false);
      setTerminalFen(analyzedFen);
    });

    engine.onError((error, token) => {
      if (
        generation !== generationRef.current ||
        (token !== undefined && token !== searchTokenRef.current)
      ) {
        return;
      }

      console.error("Opponent analysis error:", error);

      const message = error instanceof Error ? error.message : String(error);

      activeFenRef.current = null;

      setError(message);
      setIsReady(false);
      setIsAnalyzing(false);
    });

    engine.start();

    /*
     * Stockfish readiness is asynchronous.
     * We'll synchronize the React readiness
     * state below.
     */
    const interval = window.setInterval(() => {
      if (generation !== generationRef.current) {
        window.clearInterval(interval);
        return;
      }

      if (engine.isReady()) {
        setIsReady(true);

        window.clearInterval(interval);
      }
    }, 50);
  }, []);

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    attachEngine(generation);

    return () => {
      generationRef.current += 1;

      activeFenRef.current = null;

      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, [attachEngine]);

  const analyze = useCallback((fen: string, candidateCount?: number) => {
    const engine = engineRef.current;

    if (!engine || !engine.isReady() || engine.isAnalyzing()) return false;

    setResult(null);
    setError(null);
    setTerminalFen(null);
    setIsAnalyzing(true);
    activeFenRef.current = fen;

    const searchToken = engine.analyze(fen, candidateCount);

    if (searchToken === false) {
      activeFenRef.current = null;
      setIsAnalyzing(false);
      return false;
    }

    searchTokenRef.current = searchToken;
    return true;
  }, []);

  const cancel = useCallback(() => {
    ++generationRef.current;

    activeFenRef.current = null;

    engineRef.current?.stop();
    engineRef.current = null;

    setResult(null);
    setError(null);
    setTerminalFen(null);
    setIsReady(false);
    setIsAnalyzing(false);

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    attachEngine(generation);
  }, [attachEngine]);

  return {
    isReady,
    isAnalyzing,
    error,
    result,
    terminalFen,
    analyze,
    cancel,
  };
}
