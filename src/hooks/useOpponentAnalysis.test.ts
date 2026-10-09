// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, cleanup, renderHook } from "@testing-library/react";

import type { OpponentCandidateAnalysisResult } from "../engine/opponentAnalysis";
import { useOpponentAnalysis } from "./useOpponentAnalysis";

const { mockEngines, MockOpponentEngine } = vi.hoisted(() => {
  type ResultHandler = (result: OpponentCandidateAnalysisResult) => void;
  type ErrorHandler = (error: Error, token?: number) => void;
  type TerminalHandler = (token: number) => void;

  class MockEngine {
    ready = true;
    analyzing = false;
    stopped = false;
    token = 0;
    resultHandler: ResultHandler | null = null;
    errorHandler: ErrorHandler | null = null;
    terminalHandler: TerminalHandler | null = null;

    start() {}

    stop() {
      this.stopped = true;
      this.analyzing = false;
      this.token = 0;
    }

    isReady() {
      return this.ready;
    }

    isAnalyzing() {
      return this.analyzing;
    }

    analyze() {
      if (!this.ready || this.analyzing) return false as const;

      this.analyzing = true;
      this.token += 1;
      return this.token;
    }

    onResult(handler: ResultHandler) {
      this.resultHandler = handler;
    }

    onError(handler: ErrorHandler) {
      this.errorHandler = handler;
    }

    onTerminal(handler: TerminalHandler) {
      this.terminalHandler = handler;
    }

    emitTerminal(token = this.token) {
      this.analyzing = false;
      this.terminalHandler?.(token);
    }

    emitNoneFailure(token = this.token) {
      this.analyzing = false;
      this.errorHandler?.(new Error("Stockfish returned no legal move."), token);
    }

    emitResult(bestMove: string, token = this.token) {
      this.analyzing = false;
      this.resultHandler?.({
        bestMove,
        candidates: [],
        searchToken: token,
      });
    }
  }

  const instances: MockEngine[] = [];

  class MockOpponentEngine extends MockEngine {
    constructor() {
      super();
      instances.push(this);
    }
  }

  return { mockEngines: instances, MockOpponentEngine };
});

vi.mock("../engine/opponentAnalysis", async () => {
  const actual = await vi.importActual<typeof import("../engine/opponentAnalysis")>(
    "../engine/opponentAnalysis",
  );

  return {
    ...actual,
    OpponentAnalysisEngine: MockOpponentEngine,
  };
});

describe("useOpponentAnalysis", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockEngines.length = 0;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function renderReadyOpponent() {
    const hook = renderHook(() => useOpponentAnalysis());

    act(() => {
      vi.advanceTimersByTime(50);
    });

    return hook;
  }

  it("clears thinking when a terminal position has no move", () => {
    const { result } = renderReadyOpponent();

    act(() => {
      result.current.analyze("terminal-fen", 0);
    });

    act(() => {
      mockEngines[0].emitTerminal();
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.terminalFen).toBe("terminal-fen");
    expect(result.current.result).toBeNull();
  });

  it("uses the error path when a playable position returns no move", () => {
    const { result } = renderReadyOpponent();

    act(() => {
      result.current.analyze("playable-fen", 8);
    });

    act(() => {
      mockEngines[0].emitNoneFailure();
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.error).toBe("Stockfish returned no legal move.");
    expect(result.current.terminalFen).toBeNull();
  });

  it("does not let a stale empty result interrupt a newer search", () => {
    const { result } = renderReadyOpponent();

    act(() => {
      result.current.analyze("first-fen", 8);
    });

    const firstEngine = mockEngines[0];

    act(() => {
      result.current.cancel();
      vi.advanceTimersByTime(50);
      result.current.analyze("second-fen", 8);
    });

    act(() => {
      firstEngine.emitTerminal(1);
      firstEngine.emitNoneFailure(1);
    });

    expect(result.current.isAnalyzing).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.terminalFen).toBeNull();

    act(() => {
      mockEngines[1].emitTerminal(0);
    });

    expect(result.current.isAnalyzing).toBe(true);
    expect(result.current.terminalFen).toBeNull();
  });

  it("stops the worker on cleanup", () => {
    const { unmount } = renderReadyOpponent();
    const engine = mockEngines[0];

    unmount();

    expect(engine.stopped).toBe(true);
  });

  it("clears thinking when the worker fails", () => {
    const { result } = renderReadyOpponent();

    act(() => {
      result.current.analyze("playable-fen", 4);
      mockEngines[0].errorHandler?.(
        new Error("Opponent analysis engine failed."),
        mockEngines[0].token,
      );
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBe("Opponent analysis engine failed.");
  });
});
