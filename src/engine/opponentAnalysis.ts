import {
    parseCandidateMoveEvaluation,
    type CandidateMoveEvaluation,
  } from "./uciAnalysis";
  
  import {
    parseUciResponse,
  } from "./uciResponse";
  
  export const OPPONENT_ANALYSIS_MULTIPV = 8;
  
  export type OpponentCandidateAnalysisResult = {
    bestMove: string;
    candidates: CandidateMoveEvaluation[];
  };
  
  export type OpponentCandidateAnalysisHandler = (
    result: OpponentCandidateAnalysisResult
  ) => void;
  
  export type OpponentCandidateAnalysisErrorHandler = (
    error: Error
  ) => void;
  
  export class OpponentAnalysisEngine {
    private worker: Worker | null = null;
  
    private ready = false;
  
    private analyzing = false;
  
    private candidates =
      new Map<number, CandidateMoveEvaluation>();
  
    private resultHandler:
      | OpponentCandidateAnalysisHandler
      | null = null;
  
    private errorHandler:
      | OpponentCandidateAnalysisErrorHandler
      | null = null;
  
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
  
      this.worker.onmessage = (
        event: MessageEvent
      ) => {
        const message = String(event.data);
  
        if (message.trim() === "readyok") {
          this.ready = true;
          return;
        }
  
        const candidate =
          parseCandidateMoveEvaluation(
            message
          );
  
        if (candidate) {
          this.candidates.set(
            candidate.rank,
            candidate
          );
        }
  
        const response =
          parseUciResponse(message);
  
        if (
          response.type === "bestmove" &&
          this.analyzing
        ) {
          this.analyzing = false;
  
          if (
            response.move === "(none)"
          ) {
            return;
          }
  
          const candidates =
            Array.from(
              this.candidates.values()
            ).sort(
              (a, b) =>
                a.rank - b.rank
            );
  
          this.resultHandler?.({
            bestMove: response.move,
            candidates,
          });
        }
      };
  
      this.worker.onerror = (
        event: ErrorEvent
      ) => {
        this.ready = false;
        this.analyzing = false;
  
        this.errorHandler?.(
          new Error(
            event.message ||
              "Opponent analysis engine failed."
          )
        );
      };
  
      this.send("uci");
      this.send("isready");
    }
  
    onResult(
      handler: OpponentCandidateAnalysisHandler
    ) {
      this.resultHandler = handler;
    }
  
    onError(
      handler: OpponentCandidateAnalysisErrorHandler
    ) {
      this.errorHandler = handler;
    }
  
    isReady() {
      return this.ready;
    }
  
    isAnalyzing() {
      return this.analyzing;
    }
  
    analyze(fen: string) {
      if (
        !this.ready ||
        this.analyzing
      ) {
        return false;
      }
  
      this.analyzing = true;
      this.candidates.clear();
  
      // Candidate generation is deliberately
      // full-strength and independent of the
      // player's target opponent rating.
      this.send(
        "setoption name UCI_LimitStrength value false"
      );
  
      this.send(
        `setoption name MultiPV value ${OPPONENT_ANALYSIS_MULTIPV}`
      );
  
      this.send(
        `position fen ${fen}`
      );
  
      this.send("go depth 12");
  
      return true;
    }
  
    stop() {
      if (!this.worker) {
        return;
      }
  
      this.worker.terminate();
  
      this.worker = null;
      this.ready = false;
      this.analyzing = false;
      this.candidates.clear();
    }
  
    private send(command: string) {
      if (!this.worker) {
        throw new Error(
          "Opponent analysis engine has not been started."
        );
      }
  
      this.worker.postMessage(command);
    }
  }