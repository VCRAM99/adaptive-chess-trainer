
import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from "react";
  
  import { StockfishEngine } from "../engine/stockfish";
  
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
        // Ignore messages from an engine that has been replaced.
        if (
          generation !== engineGenerationRef.current
        ) {
          return;
        }
  
        if (message === "readyok") {
          setStatus("ready");
        }
  
        if (
          message.startsWith("bestmove ") &&
          pendingRequestRef.current
        ) {
          const move = message.split(" ")[1];
  
          pendingRequestRef.current = false;
          setBestMove(move);
          setStatus("ready");
        }
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
  
    const requestMove = useCallback((fen: string) => {
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
      setStatus("thinking");
  
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
  
      // A fresh worker cannot return an old game's move.
      createEngine();
    }, [createEngine]);
  
    const clearBestMove = useCallback(() => {
      setBestMove(null);
    }, []);
  
    return {
      status,
      bestMove,
      requestMove,
      cancelMove,
      clearBestMove,
    };
  }