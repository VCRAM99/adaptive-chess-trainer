import { Chess, type Square } from "chess.js";

export type PromotionPiece = "q" | "r" | "b" | "n";

/**
 * Creates an independent copy of a chess game.
 *
 * Replaying the moves preserves the game's move history,
 * which is useful for undo and repetition detection.
 */
export function copyGame(game: Chess): Chess {
  const history = game.history({ verbose: true });

  if (history.length === 0) return new Chess(game.fen());

  const copy = new Chess(history[0].before);

  for (const move of history) {
    copy.move(move.san);
  }

  return copy;
}

/**
 * Returns true if the requested move is legal.
 * For a promotion, this checks whether at least one
 * promotion choice is legal.
 */
export function isLegalMove(game: Chess, source: Square, target: Square): boolean {
  return game
    .moves({
      square: source,
      verbose: true,
    })
    .some((move) => move.to === target);
}

/**
 * Returns true when a legal move requires pawn promotion.
 */
export function requiresPromotion(game: Chess, source: Square, target: Square): boolean {
  return game
    .moves({
      square: source,
      verbose: true,
    })
    .some((move) => move.to === target && move.promotion !== undefined);
}

/**
 * Returns a new game with the requested move applied.
 * Returns null if the move is illegal or needs a
 * promotion choice that wasn't supplied.
 *
 * The original game is never modified.
 */
export function applyMove(
  game: Chess,
  source: Square,
  target: Square,
  promotion?: PromotionPiece,
): Chess | null {
  if (!isLegalMove(game, source, target)) return null;

  if (requiresPromotion(game, source, target) && !promotion) return null;

  const nextGame = copyGame(game);

  try {
    nextGame.move({
      from: source,
      to: target,
      ...(promotion ? { promotion } : {}),
    });

    return nextGame;
  } catch {
    return null;
  }
}

/**
 * Returns a new game with its last move undone.
 * Returns null when there are no moves to undo.
 */
/**
 * Undo is available during an active game after the
 * player has moved. Finished games and review mode
 * stay locked for every training mode.
 */
export function isUndoAllowed(
  game: Chess,
  playerColor: "white" | "black",
  isReviewMode: boolean,
): boolean {
  if (isReviewMode || game.isGameOver()) return false;

  return game.history().some((_, index) => {
    const moveColor = index % 2 === 0 ? "white" : "black";
    return moveColor === playerColor;
  });
}

export function undoLastMove(game: Chess): Chess | null {
  if (game.history().length === 0) return null;

  const previousGame = copyGame(game);
  previousGame.undo();

  return previousGame;
}

/**
 * Returns a message describing the current game state.
 */
export function getGameStatus(game: Chess): string {
  if (game.isCheckmate()) {
    const winner = game.turn() === "w" ? "Black" : "White";

    return `Checkmate! ${winner} wins.`;
  }

  if (game.isDraw()) return "Game drawn.";

  const currentPlayer = game.turn() === "w" ? "White" : "Black";

  if (game.isCheck()) {
    return `${currentPlayer} is in check.`;
  }

  return `${currentPlayer} to move.`;
}

/**
 * Returns the game's moves in standard algebraic notation.
 */
export function getMoveHistory(game: Chess): string[] {
  return game.history();
}
