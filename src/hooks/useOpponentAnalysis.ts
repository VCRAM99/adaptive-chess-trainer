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
  
  export function useOpponentAnalysis() {
    const engineRef =
      useRef<OpponentAnalysisEngine | null>(
        null
      );
  
    const [
      result,
      setResult,
    ] =
      useState<OpponentCandidateAnalysisResult | null>(
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
  
    const generationRef =
      useRef(0);
  
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
  
        engine.onResult(
          (analysisResult) => {
            if (
              generation !==
              generationRef.current
            ) {
              return;
            }
  
            setResult(
              analysisResult
            );
  
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
  
        engineRef.current?.stop();
        engineRef.current = null;
      };
    }, [createEngine]);
  
    const analyze =
      useCallback(
        (fen: string) => {
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
          setIsAnalyzing(true);
  
          const started =
            engine.analyze(fen);
  
          if (!started) {
            setIsAnalyzing(false);
          }
  
          return started;
        },
        []
      );

    const cancel =
    useCallback(() => {
      ++generationRef.current;

      engineRef.current?.stop();
      engineRef.current = null;

      setResult(null);
      setIsReady(false);
      setIsAnalyzing(false);

      createEngine();
    }, [createEngine]);
  
    return {
      isReady,
      isAnalyzing,
      result,
      analyze,
      cancel,
    };
  }