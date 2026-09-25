
export type StockfishMessageHandler = (
    message: string
  ) => void;
  
  export class StockfishEngine {
    private worker: Worker | null = null;
  
    private messageHandler: StockfishMessageHandler | null =
      null;
  
    private ready = false;
  
    start() {
      if (this.worker) {
        return;
      }
  
      this.ready = false;
  
      this.worker = new Worker(
        "/stockfish/stockfish-19-lite-single.js"
      );
  
      this.worker.onmessage = (event: MessageEvent) => {
        const message = String(event.data);
  
        console.log("[Stockfish]", message);
  
        if (message === "readyok") {
          this.ready = true;
        }
  
        this.messageHandler?.(message);
      };
  
      this.worker.onerror = (event) => {
        console.error("Stockfish worker error:", event);
      };
  
      this.send("uci");
      this.send("isready");
    }
  
    onMessage(handler: StockfishMessageHandler) {
      this.messageHandler = handler;
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