import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicAssetUrl } from "../lib/basePath";
import { StockfishAnalysisEngine } from "./stockfishAnalysis";

class MockWorker {
  static instances: MockWorker[] = [];

  scriptUrl: string;

  onmessage: ((event: MessageEvent) => void) | null = null;

  onerror: ((event: Event) => void) | null = null;

  postMessage = vi.fn();

  terminate = vi.fn();

  constructor(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
    MockWorker.instances.push(this);
  }

  emitMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent);
  }

  emitError() {
    this.onerror?.(new Event("error"));
  }
}

function getWorker() {
  const worker = MockWorker.instances[MockWorker.instances.length - 1];

  if (!worker) {
    throw new Error("Expected a Stockfish worker");
  }

  return worker;
}

describe("StockfishAnalysisEngine", () => {
  beforeEach(() => {
    MockWorker.instances = [];

    vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);
  });

  it("starts the Stockfish worker", () => {
    const engine = new StockfishAnalysisEngine();

    engine.start();

    expect(getWorker().scriptUrl).toBe(publicAssetUrl("stockfish/stockfish-19-lite-single.js"));

    expect(getWorker().postMessage).toHaveBeenCalledWith("uci");

    expect(getWorker().postMessage).toHaveBeenCalledWith("isready");

    engine.stop();
  });

  it("becomes ready after readyok", () => {
    const engine = new StockfishAnalysisEngine();

    engine.start();

    expect(engine.isReady()).toBe(false);

    getWorker().emitMessage("readyok");

    expect(engine.isReady()).toBe(true);

    engine.stop();
  });

  it("does not analyze before ready", () => {
    const engine = new StockfishAnalysisEngine();

    engine.start();

    expect(engine.analyze("test-fen")).toBe(false);

    engine.stop();
  });

  it("starts full-strength analysis", () => {
    const engine = new StockfishAnalysisEngine();

    engine.start();
    getWorker().emitMessage("readyok");

    expect(engine.analyze("test-fen")).toBe(true);

    expect(getWorker().postMessage).toHaveBeenCalledWith(
      "setoption name UCI_LimitStrength value false",
    );

    expect(getWorker().postMessage).toHaveBeenCalledWith("position fen test-fen");

    expect(getWorker().postMessage).toHaveBeenCalledWith("go depth 12");

    expect(getWorker().postMessage).toHaveBeenCalledWith("setoption name MultiPV value 3");

    engine.stop();
  });

  it("returns the latest evaluation with the best move", () => {
    const engine = new StockfishAnalysisEngine();

    const handler = vi.fn();

    engine.onResult(handler);

    engine.start();
    getWorker().emitMessage("readyok");

    engine.analyze("test-fen");

    getWorker().emitMessage("info depth 8 score cp 20 nodes 100");

    getWorker().emitMessage("info depth 12 score cp 35 nodes 500");

    getWorker().emitMessage("bestmove e2e4");

    expect(handler).toHaveBeenCalledWith({
      evaluation: {
        type: "cp",
        value: 35,
        depth: 12,
      },
      bestMove: "e2e4",
      candidates: [],
    });

    engine.stop();
  });

  it("prevents overlapping analysis", () => {
    const engine = new StockfishAnalysisEngine();

    engine.start();
    getWorker().emitMessage("readyok");

    expect(engine.analyze("first-fen")).toBe(true);

    expect(engine.analyze("second-fen")).toBe(false);

    engine.stop();
  });

  it("reports worker errors", () => {
    const engine = new StockfishAnalysisEngine();

    const handler = vi.fn();

    engine.onError(handler);

    engine.start();
    getWorker().emitMessage("readyok");

    getWorker().emitError();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(engine.isReady()).toBe(false);

    engine.stop();
  });

  it("terminates the worker", () => {
    const engine = new StockfishAnalysisEngine();

    engine.start();

    const worker = getWorker();

    engine.stop();

    expect(worker.terminate).toHaveBeenCalledTimes(1);

    expect(engine.isReady()).toBe(false);
  });

  it("collects candidate moves from MultiPV analysis", () => {
    const engine = new StockfishAnalysisEngine();

    const handler = vi.fn();

    engine.onResult(handler);

    engine.start();
    getWorker().emitMessage("readyok");

    engine.analyze("test-fen");

    getWorker().emitMessage("info depth 12 multipv 1 score cp 31 pv e2e4 e7e5");

    getWorker().emitMessage("info depth 12 multipv 2 score cp 28 pv d2d4 d7d5");

    getWorker().emitMessage("info depth 12 multipv 3 score cp 24 pv g1f3 d7d5");

    getWorker().emitMessage("bestmove e2e4");

    expect(handler).toHaveBeenCalledWith({
      evaluation: {
        type: "cp",
        value: 31,
        depth: 12,
      },

      bestMove: "e2e4",

      candidates: [
        {
          rank: 1,
          move: "e2e4",
          evaluation: {
            type: "cp",
            value: 31,
            depth: 12,
          },
        },
        {
          rank: 2,
          move: "d2d4",
          evaluation: {
            type: "cp",
            value: 28,
            depth: 12,
          },
        },
        {
          rank: 3,
          move: "g1f3",
          evaluation: {
            type: "cp",
            value: 24,
            depth: 12,
          },
        },
      ],
    });

    engine.stop();
  });
});
