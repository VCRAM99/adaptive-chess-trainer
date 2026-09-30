import {
    Chess,
  } from "chess.js";
  
  
  export type OpeningMoveCharacteristics = {
    developsMinorPiece: boolean;
    movesCentralPawn: boolean;
    castles: boolean;
    movesQueenEarly: boolean;
    movesFlankPawn: boolean;
  };
  
  
  const CENTRAL_PAWN_STARTING_SQUARES =
    new Set([
      "d2",
      "e2",
      "d7",
      "e7",
    ]);
  
  
  const MINOR_PIECE_STARTING_SQUARES =
    new Set([
      "b1",
      "g1",
      "b8",
      "g8",
    ]);
  
  
  const FLANK_PAWN_FILES =
    new Set([
      "a",
      "b",
      "g",
      "h",
    ]);
  
  
  export function getOpeningMoveCharacteristics(
    fen: string,
    uciMove: string
  ): OpeningMoveCharacteristics {
    const game =
      new Chess(fen);
  
    const from =
      uciMove.slice(0, 2);
  
    const to =
      uciMove.slice(2, 4);
  
    const piece =
      game.get(
        from as Parameters<
          typeof game.get
        >[0]
      );
  
    if (!piece) {
      return {
        developsMinorPiece: false,
        movesCentralPawn: false,
        castles: false,
        movesQueenEarly: false,
        movesFlankPawn: false,
      };
    }
  
    const developsMinorPiece =
      (
        piece.type === "n" ||
        piece.type === "b"
      ) &&
      MINOR_PIECE_STARTING_SQUARES.has(
        from
      );
  
    const movesCentralPawn =
      piece.type === "p" &&
      CENTRAL_PAWN_STARTING_SQUARES.has(
        from
      );
  
    const castles =
      piece.type === "k" &&
      (
        (
          from === "e1" &&
          (
            to === "g1" ||
            to === "c1"
          )
        ) ||
        (
          from === "e8" &&
          (
            to === "g8" ||
            to === "c8"
          )
        )
      );
  
    const movesQueenEarly =
      piece.type === "q";
  
    const movesFlankPawn =
      piece.type === "p" &&
      FLANK_PAWN_FILES.has(
        from[0]
      );
  
    return {
      developsMinorPiece,
      movesCentralPawn,
      castles,
      movesQueenEarly,
      movesFlankPawn,
    };
  }