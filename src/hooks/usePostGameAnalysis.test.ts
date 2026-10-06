// @vitest-environment jsdom

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import {
    act,
    cleanup,
    renderHook,
  } from "@testing-library/react";
  
  import { buildGameRecord } from
    "../lib/postGame/buildGameRecord";
  
  import type { AnalysisResult } from
    "../engine/stockfishAnalysis";
  
  import { usePostGameAnalysis } from
    "./usePostGameAnalysis";
  
  // Create a controllable replacement for Stockfish.
  const { mockEngines, MockStockfishEngine } =
    vi.hoisted(() => {
      type ResultHandler = (
        result: unknown
      ) => void;
  
      type ErrorHandler = (
        error: Error
      ) => void;
  
      class MockEngine {
        ready = true;
        stopped = false;
        analyzedFens: string[] = [];
  
        resultHandler: ResultHandler | null = null;
        errorHandler: ErrorHandler | null = null;
  
        start() {
          // Simulate starting the worker.
        }
  
        stop() {
          this.stopped = true;
        }
  
        isReady() {
          return this.ready;
        }
  
        analyze(fen: string) {
          if (this.stopped) {
            return false;
          }
  
          this.analyzedFens.push(fen);
          return true;
        }
  
        onResult(handler: ResultHandler) {
          this.resultHandler = handler;
        }
  
        onError(handler: ErrorHandler) {
          this.errorHandler = handler;
        }
  
        emitResult(result: unknown) {
          this.resultHandler?.(result);
        }
  
        emitError(message: string) {
          this.errorHandler?.(new Error(message));
        }
      }
  
      const instances: MockEngine[] = [];
  
      class MockStockfishEngine extends MockEngine {
        constructor() {
          super();
          instances.push(this);
        }
      }
  
      return {
        mockEngines: instances,
        MockStockfishEngine,
      };
    });
  
  vi.mock("../engine/stockfishAnalysis", () => ({
    StockfishAnalysisEngine:
      MockStockfishEngine,
  }));
  
  function createTestGame(
    id = "test-game"
  ) {
    return buildGameRecord(
      "1. e4 e5",
      id,
      "2026-10-04T10:00:00Z",
      "2026-10-04T10:05:00Z",
      "draw"
    );
  }
  
  const testResult = {
    evaluation: {
      type: "cp",
      value: 20,
    },
    bestMove: "e2e4",
    candidates: [],
  } as unknown as AnalysisResult;
  
  beforeEach(() => {
    vi.useFakeTimers();
    mockEngines.length = 0;
  });
  
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  
  describe("usePostGameAnalysis", () => {
    it("can complete a new analysis after cancellation", () => {
      const { result } = renderHook(() =>
        usePostGameAnalysis()
      );
    
      act(() => {
        result.current.startAnalysis(
          createTestGame("first")
        );
      });
    
      const firstEngine = mockEngines[0];
    
      act(() => {
        vi.advanceTimersByTime(50);
      });
    
      act(() => {
        result.current.cancelAnalysis();
      });
    
      expect(firstEngine.stopped).toBe(true);
      expect(result.current.isAnalyzing).toBe(false);
    
      act(() => {
        result.current.startAnalysis(
          createTestGame("second")
        );
      });
    
      const secondEngine = mockEngines[1];
    
      act(() => {
        vi.advanceTimersByTime(50);
      });
    
      expect(secondEngine.analyzedFens).toHaveLength(1);
    
      // Move 1: before + after
      act(() => {
        secondEngine.emitResult(testResult);
      });
    
      act(() => {
        secondEngine.emitResult(testResult);
      });
    
      // Move 2: before + after
      act(() => {
        secondEngine.emitResult(testResult);
      });
    
      act(() => {
        secondEngine.emitResult(testResult);
      });
    
      expect(result.current.isComplete).toBe(true);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.completedMoves).toBe(2);
      expect(result.current.results).toHaveLength(2);
    
      expect(secondEngine.stopped).toBe(true);
    });
    it("does not let an old worker corrupt a newer completed analysis", () => {
      const { result } = renderHook(() =>
        usePostGameAnalysis()
      );
    
      act(() => {
        result.current.startAnalysis(
          createTestGame("old-game")
        );
      });
    
      const oldEngine = mockEngines[0];
    
      act(() => {
        vi.advanceTimersByTime(50);
      });
    
      act(() => {
        result.current.startAnalysis(
          createTestGame("new-game")
        );
      });
    
      const newEngine = mockEngines[1];
    
      act(() => {
        vi.advanceTimersByTime(50);
      });
    
      // Complete the new game's two moves.
      act(() => {
        newEngine.emitResult(testResult);
      });
    
      act(() => {
        newEngine.emitResult(testResult);
      });
    
      act(() => {
        newEngine.emitResult(testResult);
      });
    
      act(() => {
        newEngine.emitResult(testResult);
      });
    
      expect(result.current.isComplete).toBe(true);
      expect(result.current.completedMoves).toBe(2);
      expect(result.current.results).toHaveLength(2);
    
      const completedResults =
        result.current.results;
    
      // Extremely late result from the abandoned worker.
      act(() => {
        oldEngine.emitResult(testResult);
      });
    
      expect(result.current.isComplete).toBe(true);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.completedMoves).toBe(2);
    
      expect(result.current.results).toEqual(
        completedResults
      );
    });
    it("analyzes every move sequentially", () => {
      const game = createTestGame();
  
      const { result } = renderHook(() =>
        usePostGameAnalysis()
      );
  
      act(() => {
        result.current.startAnalysis(game);
      });
  
      expect(result.current.isAnalyzing)
        .toBe(true);
  
      expect(result.current.totalMoves)
        .toBe(2);
  
      const engine = mockEngines[0];
  
      act(() => {
        vi.advanceTimersByTime(50);
      });
  
      expect(engine.analyzedFens).toEqual([
        game.moves[0].fenBefore,
      ]);
  
      // First move: before and after.
      act(() => {
        engine.emitResult(testResult);
      });
  
      expect(engine.analyzedFens[1])
        .toBe(game.moves[0].fenAfter);
  
      act(() => {
        engine.emitResult(testResult);
      });
  
      expect(result.current.completedMoves)
        .toBe(1);
  
      expect(engine.analyzedFens[2])
        .toBe(game.moves[1].fenBefore);
  
      // Second move: before and after.
      act(() => {
        engine.emitResult(testResult);
      });
  
      expect(engine.analyzedFens[3])
        .toBe(game.moves[1].fenAfter);
  
      act(() => {
        engine.emitResult(testResult);
      });
  
      expect(result.current.isComplete)
        .toBe(true);
  
      expect(result.current.isAnalyzing)
        .toBe(false);
  
      expect(result.current.completedMoves)
        .toBe(2);
  
      expect(result.current.results)
        .toHaveLength(2);
  
      expect(result.current.results[0].position.ply)
        .toBe(1);
  
      expect(result.current.results[1].position.ply)
        .toBe(2);
  
      expect(engine.stopped).toBe(true);
    });
  
    it("ignores late results after cancellation", () => {
      const { result } = renderHook(() =>
        usePostGameAnalysis()
      );
  
      act(() => {
        result.current.startAnalysis(
          createTestGame()
        );
      });
  
      const engine = mockEngines[0];
  
      act(() => {
        vi.advanceTimersByTime(50);
      });
  
      act(() => {
        result.current.cancelAnalysis();
      });
  
      expect(engine.stopped).toBe(true);
  
      // Simulate a late callback from an old worker.
      act(() => {
        engine.emitResult(testResult);
      });
  
      expect(result.current.results)
        .toEqual([]);
  
      expect(result.current.completedMoves)
        .toBe(0);
  
      expect(result.current.isAnalyzing)
        .toBe(false);
    });
  
    it("invalidates the previous review", () => {
      const { result } = renderHook(() =>
        usePostGameAnalysis()
      );
  
      act(() => {
        result.current.startAnalysis(
          createTestGame("first")
        );
      });
  
      const firstEngine = mockEngines[0];
  
      act(() => {
        result.current.startAnalysis(
          createTestGame("second")
        );
      });
  
      const secondEngine = mockEngines[1];
  
      expect(firstEngine.stopped).toBe(true);
      expect(secondEngine.stopped).toBe(false);
  
      act(() => {
        firstEngine.emitResult(testResult);
      });
  
      expect(result.current.completedMoves)
        .toBe(0);
  
      act(() => {
        vi.advanceTimersByTime(50);
      });
  
      expect(secondEngine.analyzedFens)
        .toHaveLength(1);
  
      expect(result.current.isAnalyzing)
        .toBe(true);
    });
  
    it("handles engine errors", () => {
      const { result } = renderHook(() =>
        usePostGameAnalysis()
      );
  
      act(() => {
        result.current.startAnalysis(
          createTestGame()
        );
      });
  
      const engine = mockEngines[0];
  
      act(() => {
        engine.emitError(
          "Simulated Stockfish failure"
        );
      });
  
      expect(result.current.error)
        .toBe("Simulated Stockfish failure");
  
      expect(result.current.isAnalyzing)
        .toBe(false);
  
      expect(engine.stopped).toBe(true);
    });
  
    it("times out when Stockfish never becomes ready", () => {
      const { result } = renderHook(() =>
        usePostGameAnalysis()
      );
  
      act(() => {
        result.current.startAnalysis(
          createTestGame()
        );
      });
  
      const engine = mockEngines[0];
  
      engine.ready = false;
  
      act(() => {
        vi.advanceTimersByTime(15100);
      });
  
      expect(result.current.error)
        .toBe(
          "Post-game Stockfish engine did not become ready."
        );
  
      expect(result.current.isAnalyzing)
        .toBe(false);
  
      expect(engine.stopped).toBe(true);
    });
  });