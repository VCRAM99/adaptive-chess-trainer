import type { PieceRenderObject } from "react-chessboard";

import type { PieceSet } from "./types";

const PIECE_NAMES = [
  "wK",
  "wQ",
  "wR",
  "wB",
  "wN",
  "wP",
  "bK",
  "bQ",
  "bR",
  "bB",
  "bN",
  "bP",
] as const;

function createPieceSet(folder: string): PieceRenderObject {
  return Object.fromEntries(
    PIECE_NAMES.map((piece) => [
      piece,
      (props) => (
        <img
          src={`/pieces/${folder}/${piece}.svg`}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            ...props?.svgStyle,
          }}
        />
      ),
    ]),
  ) as PieceRenderObject;
}

const MODERN_PIECES = createPieceSet("modern");

const MINIMAL_PIECES = createPieceSet("minimal");

export function getCustomPieces(pieceSet: PieceSet): PieceRenderObject | undefined {
  switch (pieceSet) {
    case "modern":
      return MODERN_PIECES;

    case "minimal":
      return MINIMAL_PIECES;

    case "classic":
    default:
      return undefined;
  }
}
