import type {
    AnalyzedMove,
  } from "./types";
  
  export function getReviewMoveLabel(
    move: Pick<
      AnalyzedMove,
      "ply" | "san" | "playedBy"
    >
  ): string {
    const moveNumber = Math.ceil(
      move.ply / 2
    );
  
    if (move.playedBy === "white") {
      return `${moveNumber}. ${move.san}`;
    }
  
    return `${moveNumber}... ${move.san}`;
  }