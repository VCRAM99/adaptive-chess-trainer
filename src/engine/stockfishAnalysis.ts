import {
  parseCandidateMoveEvaluation,
  parseEngineEvaluation,
  type CandidateMoveEvaluation,
  type EngineEvaluation,
} from "./uciAnalysis";

import { publicAssetUrl } from "../lib/basePath";
import { parseUciResponse } from "./uciResponse";

export type AnalysisResult = {
  evaluation: EngineEvaluation | null;
  bestMove: string;
  candidates: CandidateMoveEvaluation[];
};

export type AnalysisResultHandler = (result: AnalysisResult) => void;

export type AnalysisErrorHandler = (error: Error) => void;

export class StockfishAnalysisEngine {
  private worker: Worker | null = null;

  private ready = false;

  private analyzing = false;

  private latestEvaluation: EngineEvaluation | null = null;

  private candidates = new Map<number, CandidateMoveEvaluation>();

  private resultHandler: AnalysisResultHandler | null = null;

  private errorHandler: AnalysisErrorHandler | null = null;

  start() {
    if (this.worker) return;

    try {
      this.worker = new Worker(publicAssetUrl("stockfish/stockfish-19-lite-single.js"));
    } catch (error) {
      this.handleError(error);
      return;
    }

    this.worker.onmessage = (event: MessageEvent) => {
      this.handleMessage(String(event.data));
    };

    this.worker.onerror = () => {
      this.handleError(new Error("Stockfish analysis worker failed"));
    };

    this.send("uci");
    this.send("isready");
  }

  onResult(handler: AnalysisResultHandler) {
    this.resultHandler = handler;
  }

  onError(handler: AnalysisErrorHandler) {
    this.errorHandler = handler;
  }

  isReady() {
    return this.ready;
  }

  isAnalyzing() {
    return this.analyzing;
  }

  analyze(fen: string) {
    if (!this.worker || !this.ready || this.analyzing) return false;

    this.analyzing = true;
    this.latestEvaluation = null;
    this.candidates.clear();

    this.send("setoption name UCI_LimitStrength value false");

    this.send("setoption name MultiPV value 3");

    this.send(`position fen ${fen}`);
    this.send("go depth 12");

    return true;
  }

  stopAnalysis() {
    if (!this.worker || !this.analyzing) return;

    this.send("stop");
  }

  stop() {
    if (this.worker) {
      this.worker.terminate();
    }

    this.worker = null;
    this.ready = false;
    this.analyzing = false;
    this.latestEvaluation = null;
  }

  private send(command: string) {
    this.worker?.postMessage(command);
  }

  private handleMessage(message: string) {
    const response = parseUciResponse(message);

    if (response.type === "ready") {
      this.ready = true;
      return;
    }

    const evaluation = parseEngineEvaluation(message);

    const candidate = parseCandidateMoveEvaluation(message);

    if (candidate) {
      this.candidates.set(candidate.rank, candidate);

      if (candidate.rank === 1) {
        this.latestEvaluation = candidate.evaluation;
      }
    } else if (evaluation) {
      this.latestEvaluation = evaluation;
    }

    if (response.type === "bestmove" && this.analyzing) {
      this.analyzing = false;

      this.resultHandler?.({
        evaluation: this.latestEvaluation,
        bestMove: response.move,

        candidates: Array.from(this.candidates.values()).sort((a, b) => a.rank - b.rank),
      });
    }
  }

  private handleError(error: unknown) {
    this.ready = false;
    this.analyzing = false;

    const normalizedError =
      error instanceof Error ? error : new Error("Unknown Stockfish analysis error");

    this.errorHandler?.(normalizedError);
  }
}
