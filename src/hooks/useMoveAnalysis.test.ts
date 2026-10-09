// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, cleanup, renderHook } from "@testing-library/react";

import type { AnalysisResult } from "../engine/stockfishAnalysis";
import { useMoveAnalysis } from "./useMoveAnalysis";

const { mockEngines, MockStockfishEngine } = vi.hoisted(() => {
  type ResultHandler = (result: AnalysisResult) => void;
  type ErrorHandler = (error: Error) => void;

  class MockEngine {
    ready = true;
    analyzing = false;
    stopped = false;
    analyzedFens: string[] = [];
    resultHandler: ResultHandler | null = null;
    errorHandler: ErrorHandler | null = null;

    start() {}

    stop() {
      this.stopped = true;
      this.analyzing = false;
    }

    stopAnalysis() {
      this.analyzing = false;
    }

    isReady() {
      return this.ready;
    }

    isAnalyzing() {
      return this.analyzing;
    }

    analyze(fen: string) {
      if (this.stopped || !this.ready || this.analyzing) return false;

      this.analyzing = true;
      this.analyzedFens.push(fen);
      return true;
    }

    onResult(handler: ResultHandler) {
      this.resultHandler = handler;
    }

    onError(handler: ErrorHandler) {
      this.errorHandler = handler;
    }

    emitResult(result: AnalysisResult) {
      this.analyzing = false;
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

  return { mockEngines: instances, MockStockfishEngine };
});

vi.mock("../engine/stockfishAnalysis", () => ({
  StockfishAnalysisEngine: MockStockfishEngine,
}));

function scoredResult(bestMove: string): AnalysisResult {
  return {
    evaluation: { type: "cp", value: 12, depth: 12 },
    bestMove,
    candidates: [],
  };
}

function request(id: string, gameGeneration = 1) {
  return {
    requestId: id,
    gameGeneration,
    moveNumber: 1,
    playerColor: "white" as const,
    playerMove: "e2e4",
    beforeFen: `before-${id}`,
    afterFen: `after-${id}`,
    legalMoveCount: 20,
  };
}

describe("useMoveAnalysis", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEngines.length = 0;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function renderReadyAnalysis() {
    const hook = renderHook(() => useMoveAnalysis());

    act(() => {
      vi.advanceTimersByTime(50);
    });

    return hook;
  }

  function finishCurrentSearch(engine: (typeof mockEngines)[number], bestMove: string) {
    act(() => {
      engine.emitResult(scoredResult(bestMove));
      engine.emitResult(scoredResult(bestMove));
    });
  }

  it("publishes analysis for the current request", () => {
    const { result } = renderReadyAnalysis();

    act(() => {
      result.current.analyzePlayerMove(request("1:1"));
    });

    finishCurrentSearch(mockEngines[0], "d2d4");

    expect(result.current.latestAnalysis?.requestId).toBe("1:1");
    expect(result.current.latestAnalysis?.afterFen).toBe("after-1:1");
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("drops a result that arrives after cancellation", () => {
    const { result } = renderReadyAnalysis();

    act(() => {
      result.current.analyzePlayerMove(request("1:1"));
      result.current.cancelAnalysis();
    });

    finishCurrentSearch(mockEngines[0], "d2d4");

    expect(result.current.latestAnalysis).toBeNull();
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("keeps the newer request when an older search finishes first", () => {
    const { result } = renderReadyAnalysis();
    const engine = mockEngines[0];

    act(() => {
      result.current.analyzePlayerMove(request("1:1"));
      result.current.analyzePlayerMove(request("1:2"));
    });

    act(() => {
      engine.emitResult(scoredResult("old"));
    });

    finishCurrentSearch(engine, "d2d4");

    expect(result.current.latestAnalysis?.requestId).toBe("1:2");
    expect(result.current.latestAnalysis?.analysis.playerMove).toBe("e2e4");
  });

  it("ignores results after the hook unmounts", () => {
    const { result, unmount } = renderReadyAnalysis();
    const engine = mockEngines[0];

    act(() => {
      result.current.analyzePlayerMove(request("1:1"));
    });

    unmount();

    expect(engine.stopped).toBe(true);

    expect(() => {
      engine.emitResult(scoredResult("d2d4"));
    }).not.toThrow();
  });

  it("clears analyzing state when the worker fails", () => {
    const { result } = renderReadyAnalysis();

    act(() => {
      result.current.analyzePlayerMove(request("1:1"));
      mockEngines[0].emitError("analysis failed");
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(result.current.latestAnalysis).toBeNull();
  });
});
