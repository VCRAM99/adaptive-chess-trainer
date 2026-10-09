import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import type { ReviewArrow } from "../lib/postGame/reviewArrows";
import { BOARD_THEMES } from "../lib/preferences/boardThemes";

import type { BoardTheme, PieceSet } from "../lib/preferences/types";
import { getCustomPieces } from "../lib/preferences/pieceSets";

// Define the information this component receives.
type ChessBoardProps = {
  position: string;
  orientation: "white" | "black";
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  onMove: (source: Square, target: Square) => boolean;
  arrows?: ReviewArrow[];
};

// Create the chessboard component.
function ChessBoard({
  position,
  orientation,
  boardTheme,
  pieceSet,
  onMove,
  arrows = [],
}: ChessBoardProps) {
  const boardArrows = arrows.map((arrow) => ({
    startSquare: arrow.from as Square,
    endSquare: arrow.to as Square,
    color: arrow.color,
  }));

  const boardColors = BOARD_THEMES[boardTheme];
  const customPieces = getCustomPieces(pieceSet);
  const chessboardOptions = {
    position: position,

    boardOrientation: orientation,
    arrows: boardArrows,

    pieces: customPieces,

    onPieceDrop: ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!targetSquare) return false;

      return onMove(sourceSquare as Square, targetSquare as Square);
    },

    lightSquareStyle: {
      backgroundColor: boardColors.light,
    },

    darkSquareStyle: {
      backgroundColor: boardColors.dark,
    },

    boardStyle: {
      borderRadius: "4px",
      overflow: "hidden",
    },
  };

  return (
    <div className="chessboard-container">
      <Chessboard options={chessboardOptions} />
    </div>
  );
}

export default ChessBoard;
