
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
  } from "vitest";
  
  import { StockfishEngine } from "./stockfish";
  
  class MockWorker {
    static instances: MockWorker[] = [];
  
    onmessage:
      | ((event: MessageEvent) => void)
      | null = null;
  
    onerror:
      | ((event: ErrorEvent) => void)
      | null = null;
  
    postMessage = vi.fn();
    terminate = vi.fn();
  
    scriptUrl: string;

    constructor(scriptUrl: string) {
        this.scriptUrl = scriptUrl;
        MockWorker.instances.push(this);
    }
  
    emitMessage(message: string) {
      this.onmessage?.({
        data: message,
      } as MessageEvent);
    }
  
    emitError(message: string) {
      this.onerror?.({
        message,
      } as ErrorEvent);
    }
  }
  
  describe("StockfishEngine", () => {
  
    beforeEach(() => {
      MockWorker.instances = [];
  
      vi.stubGlobal("Worker", MockWorker);
    });
  
    afterEach(() => {
      vi.unstubAllGlobals();
    });
  
    function getWorker() {
      const worker = MockWorker.instances[0];
  
      if (!worker) {
        throw new Error("Mock worker was not created.");
      }
  
      return worker;
    }
  
    it("starts a worker and sends initialization commands", () => {
      const engine = new StockfishEngine();
  
      engine.start();
  
      const worker = getWorker();
  
      expect(worker.scriptUrl).toBe(
        "/stockfish/stockfish-19-lite-single.js"
      );
  
      expect(worker.postMessage).toHaveBeenCalledWith("uci");
      expect(worker.postMessage).toHaveBeenCalledWith(
        "isready"
      );
  
      engine.stop();
    });
  
    it("does not create a second worker when started twice", () => {
      const engine = new StockfishEngine();
  
      engine.start();
      engine.start();
  
      expect(MockWorker.instances).toHaveLength(1);
  
      engine.stop();
    });
  
    it("becomes ready after receiving readyok", () => {
      const engine = new StockfishEngine();
  
      engine.start();
  
      expect(engine.isReady()).toBe(false);
  
      getWorker().emitMessage("readyok");
  
      expect(engine.isReady()).toBe(true);
  
      engine.stop();
    });
  
    it("forwards engine messages to its handler", () => {
      const engine = new StockfishEngine();
      const handler = vi.fn();
  
      engine.onMessage(handler);
      engine.start();
  
      getWorker().emitMessage("bestmove e7e5");
  
      expect(handler).toHaveBeenCalledWith(
        "bestmove e7e5"
      );
  
      engine.stop();
    });
  
    it("does not analyze before initialization completes", () => {
      const engine = new StockfishEngine();
  
      engine.start();
  
      expect(
        engine.analyzePosition("example-fen")
      ).toBe(false);
  
      expect(getWorker().postMessage).not.toHaveBeenCalledWith(
        "go depth 8"
      );
  
      engine.stop();
    });
  
    it("sends the position and search command when ready", () => {
      const engine = new StockfishEngine();
  
      engine.start();
      getWorker().emitMessage("readyok");
  
      const started = engine.analyzePosition("example-fen");
  
      expect(started).toBe(true);
  
      expect(getWorker().postMessage).toHaveBeenCalledWith(
        "position fen example-fen"
      );
  
      expect(getWorker().postMessage).toHaveBeenCalledWith(
        "go depth 8"
      );
  
      engine.stop();
    });
  
    it("reports worker errors and clears readiness", () => {
      const engine = new StockfishEngine();
      const errorHandler = vi.fn();
  
      engine.onError(errorHandler);
      engine.start();
  
      const worker = getWorker();
  
      worker.emitMessage("readyok");
      expect(engine.isReady()).toBe(true);
  
      worker.emitError("Worker failed");
  
      expect(engine.isReady()).toBe(false);
  
      expect(errorHandler).toHaveBeenCalledOnce();
      expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(
        Error
      );
  
      expect(errorHandler.mock.calls[0][0].message).toBe(
        "Worker failed"
      );
  
      engine.stop();
    });
  
    it("terminates the worker when stopped", () => {
      const engine = new StockfishEngine();
  
      engine.start();
  
      const worker = getWorker();
  
      engine.stop();
  
      expect(worker.terminate).toHaveBeenCalledOnce();
      expect(engine.isReady()).toBe(false);
    });
  
    it("can start a fresh worker after being stopped", () => {
      const engine = new StockfishEngine();
  
      engine.start();
      engine.stop();
      engine.start();
  
      expect(MockWorker.instances).toHaveLength(2);
  
      engine.stop();
    });

    it("configures limited strength with an Elo rating", () => {
      const engine = new StockfishEngine();
    
      engine.start();
      getWorker().emitMessage("readyok");
    
      const configured = engine.setStrength(1500);
    
      expect(configured).toBe(true);
    
      expect(
        getWorker().postMessage
      ).toHaveBeenCalledWith(
        "setoption name UCI_LimitStrength value true"
      );
    
      expect(
        getWorker().postMessage
      ).toHaveBeenCalledWith(
        "setoption name UCI_Elo value 1500"
      );
    
      engine.stop();
    });
  });