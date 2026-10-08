import { parseCandidateMoveEvaluation, type CandidateMoveEvaluation } from "./uciAnalysis";

import { parseUciResponse } from "./uciResponse";

export const DEFAULT_OPPONENT_MULTIPV = 8;

export const MAX_OPPONENT_MULTIPV = 20;
export const OPPONENT_ANALYSIS_TIME_MS = 500;

export type OpponentCandidateAnalysisResult = {
  bestMove: string;
  candidates: CandidateMoveEvaluation[];
  searchToken: number;
};

export type OpponentCandidateAnalysisHandler = (result: OpponentCandidateAnalysisResult) => void;

export type OpponentTerminalHandler = (searchToken: number) => void;

export type OpponentCandidateAnalysisErrorHandler = (error: Error, searchToken?: number) => void;

export class OpponentAnalysisEngine {
  private worker: Worker | null = null;

  private ready = false;

  private analyzing = false;

  private searchToken = 0;

  private legalMoveCount = DEFAULT_OPPONENT_MULTIPV;

  private candidates = new Map<number, CandidateMoveEvaluation>();

  private resultHandler: OpponentCandidateAnalysisHandler | null = null;

  private errorHandler: OpponentCandidateAnalysisErrorHandler | null = null;

  private terminalHandler: OpponentTerminalHandler | null = null;

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

      if (message.trim() === "readyok") {
        this.ready = true;
        return;
      }

      const candidate = parseCandidateMoveEvaluation(message);

      if (candidate) {
        this.candidates.set(candidate.rank, candidate);
      }

      const response = parseUciResponse(message);

      if (response.type === "bestmove" && this.analyzing) {
        this.analyzing = false;

        const token = this.searchToken;

        if (response.move === "(none)") {
          if (this.legalMoveCount <= 0) {
            this.terminalHandler?.(token);
            return;
          }

          this.errorHandler?.(new Error("Stockfish returned no legal move."), token);
          return;
        }

        const candidates = Array.from(this.candidates.values()).sort((a, b) => a.rank - b.rank);

        this.resultHandler?.({
          bestMove: response.move,
          candidates,
          searchToken: token,
        });
      }
    };

    this.worker.onerror = (event: ErrorEvent) => {
      this.ready = false;
      this.analyzing = false;

      this.errorHandler?.(
        new Error(event.message || "Opponent analysis engine failed."),
        this.searchToken,
      );
    };

    this.send("uci");
    this.send("isready");
  }

  onResult(handler: OpponentCandidateAnalysisHandler) {
    this.resultHandler = handler;
  }

  onError(handler: OpponentCandidateAnalysisErrorHandler) {
    this.errorHandler = handler;
  }

  onTerminal(handler: OpponentTerminalHandler) {
    this.terminalHandler = handler;
  }

  isReady() {
    return this.ready;
  }

  isAnalyzing() {
    return this.analyzing;
  }

  analyze(
    fen: string,
    candidateCount = DEFAULT_OPPONENT_MULTIPV,
    analysisTimeMs = OPPONENT_ANALYSIS_TIME_MS,
  ): number | false {
    if (!this.ready || this.analyzing) return false;

    const token = ++this.searchToken;
    this.legalMoveCount = Math.floor(candidateCount);

    const multiPv = getOpponentMultiPv(candidateCount);

    this.analyzing = true;
    this.candidates.clear();

    // Candidate generation is deliberately
    // full-strength and independent of the
    // player's target opponent rating.
    this.send("setoption name UCI_LimitStrength value false");

    this.send(`setoption name MultiPV value ${multiPv}`);

    this.send(`position fen ${fen}`);

    this.send(`go movetime ${analysisTimeMs}`);

    return token;
  }

  stop() {
    if (!this.worker) return;

    this.worker.terminate();

    this.worker = null;
    this.ready = false;
    this.analyzing = false;
    this.searchToken = 0;
    this.candidates.clear();
  }

  private send(command: string) {
    if (!this.worker) {
      throw new Error("Opponent analysis engine has not been started.");
    }

    this.worker.postMessage(command);
  }
}

export function getOpponentMultiPv(legalMoveCount: number): number {
  return Math.max(1, Math.min(MAX_OPPONENT_MULTIPV, Math.floor(legalMoveCount)));
}
