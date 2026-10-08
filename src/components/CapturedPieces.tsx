import {
  capturedPieceColor,
  type CapturedPieceCount,
  type CapturedPieceType,
} from "../lib/capturedPieces";
import type { PieceSet } from "../lib/preferences/types";

const PIECE_NAMES: Record<CapturedPieceType, string> = {
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

const CLASSIC_GLYPHS: Record<
  "w" | "b",
  Record<CapturedPieceType, string>
> = {
  w: {
    q: "♕",
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  },
  b: {
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  },
};

type CapturedPiecesProps = {
  pieces: CapturedPieceCount[];
  capturer: "white" | "black";
  pieceSet: PieceSet;
};

function pieceAsset(
  pieceSet: PieceSet,
  pieceColor: "w" | "b",
  type: CapturedPieceType
): string | null {
  if (pieceSet === "classic") {
    return null;
  }

  const folder =
    pieceSet === "minimal" ? "minimal" : "modern";
  const file = `${pieceColor}${type.toUpperCase()}.svg`;

  return `${import.meta.env.BASE_URL}pieces/${folder}/${file}`;
}

function CapturedPieces({
  pieces,
  capturer,
  pieceSet,
}: CapturedPiecesProps) {
  const pieceColor = capturedPieceColor(capturer);

  if (pieces.length === 0) {
    return (
      <div
        className="captured-pieces"
        aria-hidden="true"
      />
    );
  }

  const summary = pieces
    .map(({ type, count }) => {
      const name = PIECE_NAMES[type];
      const plural = count === 1 ? "" : "s";

      return `${count} ${name}${plural}`;
    })
    .join(", ");

  return (
    <div
      className="captured-pieces"
      aria-label={`Captured pieces: ${summary}`}
    >
      {pieces.map(({ type, count }) => {
        const src = pieceAsset(
          pieceSet,
          pieceColor,
          type
        );

        return (
          <div className="captured-piece" key={type}>
            {src ? (
              <img
                className="captured-piece__icon"
                src={src}
                alt=""
                draggable={false}
              />
            ) : (
              <span
                className={`captured-piece__glyph captured-piece__glyph--${pieceColor}`}
                aria-hidden="true"
              >
                {CLASSIC_GLYPHS[pieceColor][type]}
              </span>
            )}

            <span className="captured-piece__count">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default CapturedPieces;
