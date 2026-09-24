
import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";

// Define the information this component receives.
type ChessBoardProps = {
  position: string;
  orientation: "white" | "black";

  onMove: (
    source: Square,
    target: Square
  ) => boolean;
};

// Create the chessboard component.
function ChessBoard({
  position,
  orientation,
  onMove,
}: ChessBoardProps) {

  const chessboardOptions = {
    position: position,

    boardOrientation: orientation,

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