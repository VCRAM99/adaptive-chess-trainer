import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from "react";
  
  import {
    OpponentAnalysisEngine,
    type OpponentCandidateAnalysisResult,
  } from "../engine/opponentAnalysis";

  export type OpponentAnalysisResult = {
    fen: string;
    analysis: OpponentCandidateAnalysisResult;
  };
  
  export function useOpponentAnalysis() {
    const engineRef =
      useRef<OpponentAnalysisEngine | null>(
        null
      );
  
    const [
      result,
      setResult,
    ] =
      useState<OpponentAnalysisResult | null>(
        null
      );
  
    const [
      isReady,
      setIsReady,
    ] = useState(false);
  
    const [
      isAnalyzing,
      setIsAnalyzing,
    ] = useState(false);

    const [
      error,
      setError,
    ] = useState<string | null>(null);
  
    const generationRef =
      useRef(0);

    const activeFenRef =
      useRef<string | null>(null);
  
    const createEngine =
      useCallback(() => {
        const generation =
          ++generationRef.current;
  
        const engine =
          new OpponentAnalysisEngine();
  
        engineRef.current = engine;
  
        setIsReady(false);
        setIsAnalyzing(false);
        setResult(null);
        setError(null);
  
        engine.onResult(
          (analysisResult) => {
            if (
              generation !==
              generationRef.current
            ) {
              return;
            }
  
            const analyzedFen =
              activeFenRef.current;

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
          }
        );
  
        engine.onError((error) => {
          if (
            generation !==
            generationRef.current
          ) {
            return;
          }
        
          console.error(
            "Opponent analysis error:",
            error
          );
        
          const message =
            error instanceof Error
              ? error.message
              : String(error);
        
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
        const interval =
          window.setInterval(() => {
            if (
              generation !==
              generationRef.current
            ) {
              window.clearInterval(
                interval
              );
              return;
            }
  
            if (engine.isReady()) {
              setIsReady(true);
  
              window.clearInterval(
                interval
              );
            }
          }, 50);
      }, []);
  
    useEffect(() => {
      createEngine();
  
      return () => {
        ++generationRef.current;

        activeFenRef.current = null;
  
        engineRef.current?.stop();
        engineRef.current = null;
      };
    }, [createEngine]);
  
    const analyze =
      useCallback(
        (fen: string, candidateCount?: number) => {
          const engine =
            engineRef.current;
  
          if (
            !engine ||
            !engine.isReady() ||
            engine.isAnalyzing()
          ) {
            return false;
          }
  
          setResult(null);
          setError(null);
          setIsAnalyzing(true);
          activeFenRef.current = fen;

          const started =
            engine.analyze(
              fen,
              candidateCount
            );

          if (!started) {
            activeFenRef.current = null;
            setIsAnalyzing(false);
          }

          return started;
        },
        []
      );

    const cancel =
    useCallback(() => {
      ++generationRef.current;

      activeFenRef.current = null;

      engineRef.current?.stop();
      engineRef.current = null;

      setResult(null);
      setError(null);
      setIsReady(false);
      setIsAnalyzing(false);

      createEngine();
    }, [createEngine]);
  
    return {
      isReady,
      isAnalyzing,
      error,
      result,
      analyze,
      cancel,
    };
  }