import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOpponentMultiPv,
  MAX_OPPONENT_MULTIPV,
  OpponentAnalysisEngine,
} from "./opponentAnalysis";

describe("getOpponentMultiPv", () => {
  it("uses the legal move count when below the maximum", () => {
    expect(getOpponentMultiPv(8)).toBe(8);

    expect(getOpponentMultiPv(17)).toBe(17);
  });

  it("caps MultiPV at the configured maximum", () => {
    expect(getOpponentMultiPv(35)).toBe(MAX_OPPONENT_MULTIPV);
  });

  it("never returns less than one", () => {
    expect(getOpponentMultiPv(0)).toBe(1);

    expect(getOpponentMultiPv(-5)).toBe(1);
  });

  it("uses a whole-number candidate count", () => {
    expect(getOpponentMultiPv(12.9)).toBe(12);
  });
});

class MockWorker {
  static instances: MockWorker[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  scriptUrl: string;

  constructor(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
    MockWorker.instances.push(this);
  }

  emit(message: string) {
    this.onmessage?.({ data: message } as MessageEvent);
  }

  fail(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }
}

describe("OpponentAnalysisEngine bestmove (none)", () => {
  beforeEach(() => {
    MockWorker.instances = [];
    vi.stubGlobal("Worker", MockWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function readyEngine() {
    const engine = new OpponentAnalysisEngine();
    engine.start();
    MockWorker.instances[0].emit("readyok");
    return engine;
  }

  it("finishes a terminal position without a move or an error", () => {
    const engine = readyEngine();
    const onResult = vi.fn();
    const onError = vi.fn();
    const onTerminal = vi.fn();

    engine.onResult(onResult);
    engine.onError(onError);
    engine.onTerminal(onTerminal);

    expect(engine.analyze("terminal-fen", 0)).toBe(1);
    MockWorker.instances[0].emit("bestmove (none)");

    expect(engine.isAnalyzing()).toBe(false);
    expect(onTerminal).toHaveBeenCalledWith(1);
    expect(onResult).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();

    engine.stop();
  });

  it("reports an unexpected empty move as an error", () => {
    const engine = readyEngine();
    const onResult = vi.fn();
    const onError = vi.fn();
    const onTerminal = vi.fn();

    engine.onResult(onResult);
    engine.onError(onError);
    engine.onTerminal(onTerminal);

    expect(engine.analyze("playable-fen", 12)).toBe(1);
    MockWorker.instances[0].emit("bestmove (none)");

    expect(engine.isAnalyzing()).toBe(false);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Stockfish returned no legal move.",
      }),
      1,
    );
    expect(onResult).not.toHaveBeenCalled();
    expect(onTerminal).not.toHaveBeenCalled();

    engine.stop();
  });

  it("reports worker failures and stops analyzing", () => {
    const engine = readyEngine();
    const onError = vi.fn();
    engine.onError(onError);

    engine.analyze("playable-fen", 4);
    MockWorker.instances[0].fail("Worker failed");

    expect(engine.isAnalyzing()).toBe(false);
    expect(engine.isReady()).toBe(false);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "Worker failed" }), 1);

    engine.stop();
  });

  it("does not start a second search while one is running", () => {
    const engine = readyEngine();

    expect(engine.analyze("first-fen", 4)).toBe(1);
    expect(engine.analyze("second-fen", 4)).toBe(false);
    expect(engine.isAnalyzing()).toBe(true);

    engine.stop();
  });
});
