export type StockfishMessageHandler = (
  message: string
) => void;

export type StockfishErrorHandler = (
  error: Error
) => void;

export class StockfishEngine {
  private worker: Worker | null = null;

  private messageHandler: StockfishMessageHandler | null =
    null;

  private errorHandler: StockfishErrorHandler | null =
    null;

  private ready = false;

  start() {
    if (this.worker) {
      return;
    }

    this.ready = false;

    try {
      this.worker = new Worker(
        "/stockfish/stockfish-19-lite-single.js"
      );
    } catch (error) {
      const engineError =
        error instanceof Error
          ? error
          : new Error(String(error));

      this.errorHandler?.(engineError);
      return;
    }

    this.worker.onmessage = (event: MessageEvent) => {
      const message = String(event.data);

      console.log("[Stockfish]", message);

      if (message.trim() === "readyok") {
        this.ready = true;
      }

      this.messageHandler?.(message);
    };

    this.worker.onerror = (event: ErrorEvent) => {
      console.error("Stockfish worker error:", event);

      this.ready = false;

      this.errorHandler?.(
        new Error(event.message || "Stockfish worker failed.")
      );
    };

    this.send("uci");
    this.send("isready");
  }

  onMessage(handler: StockfishMessageHandler) {
    this.messageHandler = handler;
  }

  onError(handler: StockfishErrorHandler) {
    this.errorHandler = handler;
  }

  isReady() {
    return this.ready;
  }

  send(command: string) {
    if (!this.worker) {
      throw new Error("Stockfish has not been started.");
    }

    this.worker.postMessage(command);
  }

  analyzePosition(fen: string) {
    if (!this.ready) {
      return false;
    }

    this.send(`position fen ${fen}`);
    this.send("go depth 8");

    return true;
  }

  stopAnalysis() {
    if (this.worker) {
      this.send("stop");
    }
  }

  stop() {
    if (!this.worker) {
      return;
    }

    this.worker.terminate();
    this.worker = null;
    this.ready = false;
  }
}