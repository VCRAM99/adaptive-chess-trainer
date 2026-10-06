import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import type { ReviewArrow } from "../lib/postGame/reviewArrows";

// Define the information this component receives.
type ChessBoardProps = {
  position: string;
  orientation: "white" | "black";

  onMove: (
    source: Square,
    target: Square
  ) => boolean;
  arrows?: ReviewArrow[];
};



// Create the chessboard component.
function ChessBoard({
  position,
  orientation,
  onMove,
  arrows = [],
}: ChessBoardProps) {

  const boardArrows = arrows.map((arrow) => ({
    startSquare: arrow.from as Square,
    endSquare: arrow.to as Square,
    color: arrow.color,
  }));


  const chessboardOptions = {
    position: position,

    boardOrientation: orientation,
    arrows: boardArrows,

    onPieceDrop: ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (!targetSquare) {
        return false;
      }

      return onMove(
        sourceSquare as Square,
        targetSquare as Square
      );
    },

    lightSquareStyle: {
      backgroundColor: "#eeeed2",
    },

    darkSquareStyle: {
      backgroundColor: "#769656",
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