
import { useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";

import "./App.css";

function App() {
  // Store the current chess game in React state.
  const [game, setGame] = useState(() => new Chess());

  // Create a copy while preserving the game's move history.
  function copyGame(): Chess {
    const copy = new Chess();

    for (const move of game.history()) {
      copy.move(move);
    }

    return copy;
  }

  // Attempt to make a legal chess move.
  function makeMove(source: Square, target: Square): boolean {
    if (game.isGameOver()) {
      return false;
    }

    const gameCopy = copyGame();

    try {
      gameCopy.move({
        from: source,
        to: target,
        promotion: "q",
      });

      setGame(gameCopy);

      return true;
    } catch {
      return false;
    }
  }

  // Start a completely new game.
  function startNewGame() {
    setGame(new Chess());
  }

  // Undo the most recent move.
  function undoMove() {
    const gameCopy = copyGame();

    if (gameCopy.undo() !== null) {
      setGame(gameCopy);
    }
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

  // Configure the interactive chessboard.
  const chessboardOptions = {
    position: game.fen(),

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

      return makeMove(
        sourceSquare as Square,
        targetSquare as Square
      );
    },

    boardOrientation: "white" as const,

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

          <div className="chessboard-container">
            <Chessboard options={chessboardOptions} />
          </div>

          <div className="player-info">
            <span>White</span>
            <span>Estimated Elo: 1000 (provisional)</span>
          </div>
        </section>

        <aside className="game-panel">
          <h2>Game information</h2>

          <div className="status-box">
            <h3>Game status</h3>
            <p>{getGameStatus()}</p>
          </div>

          <div className="moves-box">
            <h3>Move history</h3>

            <div className="move-history">
              {game.history().length === 0 ? (
                <p>No moves played yet.</p>
              ) : (
                <ol>
                  {game.history().map((move, index) => (
                    <li key={index}>
                      {index % 2 === 0 ? "White" : "Black"}:
                      {" "}
                      {move}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="game-controls">
            <button onClick={undoMove}>
              Undo move
            </button>

            <button onClick={startNewGame}>
              New game
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;