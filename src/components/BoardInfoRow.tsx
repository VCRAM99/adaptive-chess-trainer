import type { CapturedPieceCount } from "../lib/capturedPieces";
import type { PieceSet } from "../lib/preferences/types";
import CapturedPieces from "./CapturedPieces";

type EngineStatus = "ready" | "thinking" | "error";

type BoardInfoRowProps = {
  role: "player" | "opponent";
  color: "white" | "black";
  playerRating: number;
  engineStatus: EngineStatus;
  capturedPieces: CapturedPieceCount[];
  pieceSet: PieceSet;
};

function colorLabel(color: "white" | "black"): string {
  return color === "white" ? "White" : "Black";
}

function BoardInfoRow({
  role,
  color,
  playerRating,
  engineStatus,
  capturedPieces,
  pieceSet,
}: BoardInfoRowProps) {
  const label = colorLabel(color);

  return (
    <div className="board-info-row">
      {role === "player" ? (
        <div
          className="board-identity board-identity--player"
          data-tooltip="PLAYER ELO"
          aria-label={`You, ${label}, Elo ${playerRating}`}
          tabIndex={0}
        >
          <p className="board-participant">
            <span className="board-participant__name">You</span>
            <span className="board-participant__color">{label}</span>
            <span className="board-participant__rating">{playerRating}</span>
          </p>
        </div>
      ) : (
        <OpponentIdentity colorLabel={label} engineStatus={engineStatus} />
      )}

      <CapturedPieces pieces={capturedPieces} capturer={color} pieceSet={pieceSet} />
    </div>
  );
}

function OpponentIdentity({
  colorLabel: label,
  engineStatus,
}: {
  colorLabel: string;
  engineStatus: EngineStatus;
}) {
  const statusLabel =
    engineStatus === "thinking" ? "THINKING" : engineStatus === "error" ? "ENGINE ERROR" : "READY";

  return (
    <div
      className="board-identity board-identity--opponent"
      data-tooltip={statusLabel}
      aria-label={`Adaptive Opponent, ${label}, ${statusLabel}`}
      tabIndex={0}
    >
      <span
        className={`engine-status-dot ` + `engine-status-dot--${engineStatus}`}
        aria-hidden="true"
      />

      <p className="board-participant">
        <span className="board-participant__name">Adaptive Opponent</span>
        <span className="board-participant__color">{label}</span>
      </p>
    </div>
  );
}

export default BoardInfoRow;
