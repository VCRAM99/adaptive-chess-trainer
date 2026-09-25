
import { useState } from "react";
import { Chess, type Square } from "chess.js";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";
import PromotionDialog from "./components/PromotionDialog";
import { applyMove, isLegalMove, requiresPromotion, undoLastMove, getGameStatus as getChessGameStatus, getMoveHistory } from "./lib/chessGame";

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

  //checka if the move is legal and if it requires a promotion. and updates the game state.
  function makeMove(
    source: Square,
    target: Square,
    promotion?: PromotionPiece
  ): boolean {
    if (game.isGameOver() || pendingPromotion) {
      return false;
    }
  
    if (!isLegalMove(game, source, target)) {
      return false;
    }
  
    if (
      requiresPromotion(game, source, target) &&
      !promotion
    ) {
      setPendingPromotion({
        from: source,
        to: target,
      });
  
      // The move waits until a promotion piece is selected.
      return false;
    }
  
    const nextGame = applyMove(
      game,
      source,
      target,
      promotion
    );
  
    if (!nextGame) {
      return false;
    }
  
    setGame(nextGame);
    return true;
  }

  // Completes the promotion by applying the move to the game state.
  function completePromotion(piece: PromotionPiece) {
    if (!pendingPromotion) {
      return;
    }
  
    const nextGame = applyMove(
      game,
      pendingPromotion.from,
      pendingPromotion.to,
      piece
    );
  
    if (nextGame) {
      setGame(nextGame);
    }
  
    setPendingPromotion(null);
  }

  // Start a completely new game.
  function startNewGame() {
    setGame(new Chess());
    setPendingPromotion(null);
  }

  // Undo the most recent move.
  function undoMove() {
    setPendingPromotion(null);
  
    const previousGame = undoLastMove(game);
  
    if (previousGame) {
      setGame(previousGame);
    }
  }

  // Flip the board orientation.
  function flipBoard() {
    setBoardOrientation((current) =>
      current === "white" ? "black" : "white"
    );
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
          status={getChessGameStatus(game)}
          moveHistory={getMoveHistory(game)}
          onUndo={undoMove}
          onNewGame={startNewGame}
          onFlipBoard={flipBoard}
        />
      </main>
      
      {pendingPromotion && (
        <PromotionDialog
          color={game.turn()}
          onSelect={completePromotion}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  );
}

export default App;