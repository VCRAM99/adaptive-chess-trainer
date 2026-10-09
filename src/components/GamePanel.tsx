import { getTrainingModeLabel, type TrainingMode } from "../lib/trainingDifficulty";

import { Undo2, FlipHorizontal2, SquarePlus, Brain } from "lucide-react";

export type GameStatusTone = "normal" | "warning" | "finished";

type GamePanelProps = {
  status: string;
  statusTone?: GameStatusTone;
  trainingMode: TrainingMode;

  onUndo: () => void;
  onNewGame: () => void;
  onFlipBoard: () => void;
  onAnalyze?: () => void;

  undoDisabled?: boolean;
  showAnalyze?: boolean;

  postGameResult?: {
    label: "VICTORY" | "DEFEAT" | "DRAW";
    ratingChange: string;
    chessResult: string;
  } | null;

  isAnalysisLoading?: boolean;
  isAnalysisMode?: boolean;
  analysisError?: boolean;
};

function GamePanel({
  status,
  statusTone = "normal",
  trainingMode,
  onUndo,
  undoDisabled = false,
  onNewGame,
  onFlipBoard,
  onAnalyze,
  showAnalyze = false,
  postGameResult = null,
  isAnalysisLoading = false,
  isAnalysisMode = false,
  analysisError = false,
}: GamePanelProps) {
  return (
    <aside className="game-panel">
      <h2 className="game-panel__title">Game Information</h2>

      <div className="game-panel__content">
        <div className="game-panel__mode">
          <span className="ui-label">TRAINING MODE:</span>

          <span className={`training-mode ` + `training-mode--${trainingMode}`}>
            {getTrainingModeLabel(trainingMode)}
          </span>
        </div>

        {postGameResult ? (
          <div className="game-result">
            <div className="game-result__headline">
              <strong
                className={
                  `game-result__label ` +
                  `game-result__label--${postGameResult.label.toLowerCase()}`
                }
              >
                {postGameResult.label}
              </strong>

              <span
                className={
                  `game-result__rating ` +
                  (postGameResult.ratingChange.startsWith("+")
                    ? "game-result__rating--positive"
                    : postGameResult.ratingChange.startsWith("-")
                      ? "game-result__rating--negative"
                      : "game-result__rating--neutral")
                }
              >
                {postGameResult.ratingChange} ELO
              </span>
            </div>

            <span className="game-result__chess-result">{postGameResult.chessResult}</span>

            {analysisError && (
              <span className="game-result__analysis-error" role="alert">
                Analysis could not be completed.
              </span>
            )}
          </div>
        ) : (
          <div
            className={`game-panel__status ` + `game-panel__status--${statusTone}`}
            role="status"
          >
            {status}
          </div>
        )}
      </div>

      <div className="game-panel__divider" />

      <div className="game-panel__controls">
        {!isAnalysisMode && (
          <button
            type="button"
            className="ui-icon-button"
            onClick={onUndo}
            disabled={undoDisabled}
            aria-label="Undo"
            data-tooltip="UNDO"
          >
            <Undo2 size={19} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="ui-icon-button"
          onClick={onFlipBoard}
          aria-label="Flip board"
          data-tooltip="FLIP BOARD"
        >
          <FlipHorizontal2 size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="ui-icon-button"
          onClick={onNewGame}
          aria-label="New game"
          data-tooltip="NEW GAME"
        >
          <SquarePlus size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>

        {showAnalyze && onAnalyze && (
          <button
            type="button"
            className="ui-icon-button"
            onClick={onAnalyze}
            disabled={isAnalysisLoading}
            aria-label={isAnalysisLoading ? "Analyzing game" : "Analyze game"}
            data-tooltip={isAnalysisLoading ? "ANALYZING" : "ANALYZE"}
          >
            {isAnalysisLoading ? (
              <span className="analysis-spinner" aria-hidden="true" />
            ) : (
              <Brain size={19} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
}

export default GamePanel;
