
import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from "react";
  
  import { StockfishEngine, type OpponentAnalysisResult } from "../engine/stockfish";
  import { parseUciResponse } from "../engine/uciResponse";
  
  type EngineStatus =
    | "starting"
    | "ready"
    | "thinking"
    | "error";
  
  export function useStockfish() {
    const engineRef = useRef<StockfishEngine | null>(null);
  
    const [status, setStatus] =
      useState<EngineStatus>("starting");
  
    const [bestMove, setBestMove] =
      useState<string | null>(null);

    const [
      opponentAnalysis,
      setOpponentAnalysis,
    ] =
      useState<OpponentAnalysisResult | null>(
        null
    );
  
    const pendingRequestRef = useRef(false);
  
    // Identifies the current engine instance.
    const engineGenerationRef = useRef(0);
  
    const createEngine = useCallback(() => {
      const generation = ++engineGenerationRef.current;
      const engine = new StockfishEngine();
  
      engineRef.current = engine;
      pendingRequestRef.current = false;
  
      setStatus("starting");
  
      
      engine.onMessage((message) => {
        // Ignore messages from an engine that was replaced.
        if (generation !== engineGenerationRef.current) {
          return;
        }

        const response = parseUciResponse(message);

        if (response.type === "ready") {
          // A readiness message must not interrupt an active search.
          if (!pendingRequestRef.current) {
            setStatus("ready");
          }

          return;
        }

        if (
          response.type === "bestmove" &&
          pendingRequestRef.current
        ) {
          pendingRequestRef.current = false;

          if (response.move === "(none)") {
            // No legal move is available, or the engine could
            // not produce a move. Don't pass "(none)" to chess.js.
            setBestMove(null);
            setStatus("error");
            return;
          }

          setBestMove(response.move);
          setStatus("ready");
        }
      });

      engine.onOpponentAnalysis(
        (result) => {
          if (
            generation !==
            engineGenerationRef.current
          ) {
            return;
          }
      
          setOpponentAnalysis(result);
        }
      );

      engine.onError((error) => {
        if (generation !== engineGenerationRef.current) {
          return;
        }

        console.error("Stockfish engine error:", error);

        pendingRequestRef.current = false;
        setBestMove(null);
        setStatus("error");
      });
  
      engine.start();
    }, []);
  
    useEffect(() => {
      createEngine();
  
      return () => {
        ++engineGenerationRef.current;
        pendingRequestRef.current = false;
  
        engineRef.current?.stop();
        engineRef.current = null;
      };
    }, [createEngine]);
  
    const requestMove = useCallback((fen: string, elo: number) => {
      const engine = engineRef.current;
  
      if (
        !engine ||
        !engine.isReady() ||
        pendingRequestRef.current
      ) {
        return false;
      }
  
      pendingRequestRef.current = true;
      setBestMove(null);
      setOpponentAnalysis(null);
      setStatus("thinking");
  
      const configured = engine.setStrength(elo);

      if (!configured) {
        pendingRequestRef.current = false;
        setStatus("error");
        return false;
      }
      const started = engine.analyzePosition(fen);
  
      if (!started) {
        pendingRequestRef.current = false;
        setStatus("error");
      }
  
      return started;
    }, []);
  
    const cancelMove = useCallback(() => {
      // Invalidate any messages from the old worker.
      ++engineGenerationRef.current;
      pendingRequestRef.current = false;
  
      engineRef.current?.stop();
      engineRef.current = null;
  
      setBestMove(null);
      setOpponentAnalysis(null);
  
      // A fresh worker cannot return an old game's move.
      createEngine();
    }, [createEngine]);
  
    const clearBestMove = useCallback(() => {
      setBestMove(null);
    }, []);
  
    return {
      status,
      bestMove,
      opponentAnalysis,
      requestMove,
      cancelMove,
      clearBestMove,
    };
  }