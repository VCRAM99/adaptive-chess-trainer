import { parseCandidateMoveEvaluation, type CandidateMoveEvaluation } from "./uciAnalysis";

import { devLog } from "../lib/devLogger";

export const OPPONENT_MULTIPV = 8;

export type OpponentAnalysisResult = {
  bestMove: string;
  candidates: CandidateMoveEvaluation[];
};

export type StockfishMessageHandler = (message: string) => void;

export type StockfishErrorHandler = (error: Error) => void;

export class StockfishEngine {
  private candidates = new Map<number, CandidateMoveEvaluation>();

  private worker: Worker | null = null;

  private messageHandler: StockfishMessageHandler | null = null;

  private errorHandler: StockfishErrorHandler | null = null;

  private ready = false;

  private opponentAnalysisHandler: ((result: OpponentAnalysisResult) => void) | null = null;

  onOpponentAnalysis(handler: ((result: OpponentAnalysisResult) => void) | null) {
    this.opponentAnalysisHandler = handler;
  }

  start() {
    if (this.worker) return;

    this.ready = false;

    try {
      this.worker = new Worker("/stockfish/stockfish-19-lite-single.js");
    } catch (error) {
      const engineError = error instanceof Error ? error : new Error(String(error));

      this.errorHandler?.(engineError);
      return;
    }

    this.worker.onmessage = (event: MessageEvent) => {
      const message = String(event.data);

      devLog("[Stockfish]", message);

      if (message.trim() === "readyok") {
        this.ready = true;
      }

      const candidate = parseCandidateMoveEvaluation(message);

      if (candidate) {
        this.candidates.set(candidate.rank, candidate);
      }

      if (message.startsWith("bestmove ")) {
        const bestMove = message.split(/\s+/)[1];

        if (bestMove && bestMove !== "(none)") {
          const candidates = Array.from(this.candidates.values()).sort((a, b) => a.rank - b.rank);

          this.opponentAnalysisHandler?.({
            bestMove,
            candidates,
          });
        }
      }

      this.messageHandler?.(message);
    };

    this.worker.onerror = (event: ErrorEvent) => {
      console.error("Stockfish worker error:", event);

      this.ready = false;

      this.errorHandler?.(new Error(event.message || "Stockfish worker failed."));
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

  setStrength(elo: number) {
    if (!this.ready) return false;

    this.send("setoption name UCI_LimitStrength value true");

    this.send(`setoption name UCI_Elo value ${elo}`);

    return true;
  }

  analyzePosition(fen: string) {
    if (!this.ready) return false;

    this.candidates.clear();

    this.send(`setoption name MultiPV value ${OPPONENT_MULTIPV}`);

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
    if (!this.worker) return;

    this.worker.terminate();
    this.worker = null;
    this.ready = false;
  }
}
