import { useState, useEffect} from "react";
import { Chess, type Square } from "chess.js";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";
import PromotionDialog from "./components/PromotionDialog";
import { applyMove, isLegalMove, requiresPromotion, undoLastMove, getGameStatus as getChessGameStatus, getMoveHistory } from "./lib/chessGame";
import { useStockfish } from "./hooks/useStockfish";
import { parseUciMove } from "./engine/uci";

import "./App.css";


// Types for the promotion piece and pending promotion.
type PromotionPiece = "q" | "r" | "b" | "n";

type PendingPromotion = {
  from: Square;
  to: Square;
};

function App() {
  const {
    status: engineStatus,
    bestMove,
    requestMove,
    cancelMove,
    clearBestMove,
  } = useStockfish();

  
  // Store the current chess game in React state.
  const [game, setGame] = useState(() => new Chess());

  const [boardOrientation, setBoardOrientation] =
  useState<"white" | "black">("white");


  // Store the pending promotion piece.
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);


  useEffect(() => {
    if (!bestMove || game.turn() !== "b") {
      return;
    }

    if (game.isGameOver()) {
      clearBestMove();
      return;
    }

    const parsedMove = parseUciMove(bestMove);

    if (!parsedMove) {
      console.error(
        "Stockfish returned an invalid move:",
        bestMove
      );

      clearBestMove();
      return;
    }

    const nextGame = applyMove(
      game,
      parsedMove.source,
      parsedMove.target,
      parsedMove.promotion
    );

    if (nextGame) {
      setGame(nextGame);
    } else {
      console.error(
        "Stockfish returned an invalid move:",
        bestMove
      );
    }

    clearBestMove();
  }, [bestMove, game, clearBestMove]);

  //checka if the move is legal and if it requires a promotion. and updates the game state.
  function makeMove(
    source: Square,
    target: Square,
    promotion?: PromotionPiece
  ): boolean {
    
    if (
      game.isGameOver() ||
      pendingPromotion ||
      game.turn() !== "w" ||
      engineStatus !== "ready"
    ) {
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

    if (!nextGame.isGameOver()) {
      requestMove(nextGame.fen());
    }
    
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
    
      if (!nextGame.isGameOver()) {
        requestMove(nextGame.fen());
      }
    }
  
    setPendingPromotion(null);
  }

  // Start a completely new game.
  function startNewGame() {
    cancelMove();
    setGame(new Chess());
    setPendingPromotion(null);
  }

  // Undo the most recent move. 
  function undoMove() {
    cancelMove();
    setPendingPromotion(null);

    // If Stockfish has moved, undo Black's move first.
    const afterFirstUndo = undoLastMove(game);

    if (!afterFirstUndo) {
      return;
    }

    // Then undo White's preceding move, if one exists.
    const afterSecondUndo = undoLastMove(afterFirstUndo);

    setGame(afterSecondUndo ?? afterFirstUndo);
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
          engineStatus={engineStatus}
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