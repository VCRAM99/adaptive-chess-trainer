
import { useState } from "react";
import { Chess, type Square } from "chess.js";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";

import "./App.css";


// Types for the promotion piece and pending promotion.
type PromotionPiece = "q" | "r" | "b" | "n";

type PendingPromotion = {
  from: Square;
  to: Square;
};

function App() {
  // Store the current chess game in React state.
  const [game, setGame] = useState(() => new Chess());

  const [boardOrientation, setBoardOrientation] =
  useState<"white" | "black">("white");


  // Store the pending promotion piece.
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  // Create a copy while preserving the game's move history.
  function copyGame(): Chess {
    const copy = new Chess();

    for (const move of game.history()) {
      copy.move(move);
    }

    return copy;
  }


  function makeMove(
    source: Square,
    target: Square,
    promotion?: PromotionPiece
  ): boolean {
    if (game.isGameOver() || pendingPromotion) {
      return false;
    }
  
    const piece = game.get(source);
  
    if (!piece) {
      return false;
    }
  
    const promotionRank =
      piece.color === "w" ? "8" : "1";
  
    const requiresPromotion =
      piece.type === "p" &&
      target[1] === promotionRank;
  
    // Check whether the requested move is legal.
    const legalMoves = game.moves({
      square: source,
      verbose: true,
    });
  
    const isLegal = legalMoves.some(
      (move) =>
        move.to === target &&
        (!requiresPromotion || move.promotion !== undefined)
    );
  
    if (!isLegal) {
      return false;
    }
  
    // Wait for the player to select a promotion piece.
    if (requiresPromotion && !promotion) {
      setPendingPromotion({
        from: source,
        to: target,
      });
  
      return false;
    }
  
    const gameCopy = copyGame();
  
    try {
      gameCopy.move({
        from: source,
        to: target,
        ...(promotion ? { promotion } : {}),
      });
  
      setGame(gameCopy);
  
      return true;
    } catch {
      return false;
    }
  }


  function completePromotion(piece: PromotionPiece) {
    if (!pendingPromotion) {
      return;
    }

    const gameCopy = copyGame();

    try {
      gameCopy.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: piece,
      });

      setGame(gameCopy);
      setPendingPromotion(null);
    } catch {
      setPendingPromotion(null);
    }
  }

  // Start a completely new game.
  function startNewGame() {
    setGame(new Chess());
    setPendingPromotion(null);
  }

  // Undo the most recent move.
  function undoMove() {
    const gameCopy = copyGame();
    setPendingPromotion(null);

    if (gameCopy.undo() !== null) {
      setGame(gameCopy);
    }
  }

  // Flip the board orientation.
  function flipBoard() {
    setBoardOrientation((current) =>
      current === "white" ? "black" : "white"
    );
  }

  // Determine which player's turn it is.
  function getGameStatus(): string {
    if (game.isCheckmate()) {
      const winner = game.turn() === "w" ? "Black" : "White";
      return `Checkmate! ${winner} wins.`;
    }

    if (game.isDraw()) {
      return "Game over! Draw.";
    }

    const currentPlayer = game.turn() === "w" ? "White" : "Black";

    if (game.isCheck()) {
      return `${currentPlayer} is in check!`;
    }

    return `${currentPlayer} to move`;
  }

  // Display the application.
  return (
    <div className="app">
      <header className="app-header">
        <h1>Adaptive Chess Trainer</h1>
        <p>Play. Analyze. Improve.</p>
      </header>

      <main className="game-layout">
        <section className="board-section">
          <div className="player-info">
            <span>Black</span>
            <span>Computer opponent coming soon</span>
          </div>

          <ChessBoard
            position={game.fen()}
            orientation={boardOrientation}
            onMove={makeMove}
          />

          <div className="player-info">
            <span>White</span>
            <span>Estimated Elo: 1000 (provisional)</span>
          </div>
        </section>

        <GamePanel
          status={getGameStatus()}
          moveHistory={game.history()}
          onUndo={undoMove}
          onNewGame={startNewGame}
          onFlipBoard={flipBoard}
        />

        {pendingPromotion && (
          <div className="promotion-overlay">
            <div
              className="promotion-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Choose a promotion piece"
            >
              <h2>Choose your promotion</h2>

              <p>Select the piece your pawn will become.</p>

              <div className="promotion-options">
                {(
                  [
                    ["q", "Queen"],
                    ["r", "Rook"],
                    ["b", "Bishop"],
                    ["n", "Knight"],
                  ] as const
                ).map(([piece, name]) => (
                  <button
                    key={piece}
                    onClick={() => completePromotion(piece)}
                  >
                    <span className="promotion-symbol">
                      {game.turn() === "w"
                        ? {
                            q: "♕",
                            r: "♖",
                            b: "♗",
                            n: "♘",
                          }[piece]
                        : {
                            q: "♛",
                            r: "♜",
                            b: "♝",
                            n: "♞",
                          }[piece]}
                    </span>

                    <span>{name}</span>
                  </button>
                ))}
              </div>

              <button
                className="cancel-promotion"
                onClick={() => setPendingPromotion(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;