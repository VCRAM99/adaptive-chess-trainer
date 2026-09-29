import { useState, useEffect, useRef} from "react";
import { Chess, type Square } from "chess.js";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";
import PromotionDialog from "./components/PromotionDialog";
import { applyMove, isLegalMove, requiresPromotion, undoLastMove, getGameStatus as getChessGameStatus, getMoveHistory } from "./lib/chessGame";
import { useStockfish } from "./hooks/useStockfish";
import { parseUciMove } from "./engine/uci";
import { useMoveAnalysis } from "./hooks/useMoveAnalysis";
import { updateSkillFromAnalysis } from "./lib/skillEstimator";
import { useOpponentAnalysis,} from "./hooks/useOpponentAnalysis";


import type { TrainingMode } from "./lib/trainingDifficulty";
import { createOpponentConfig } from "./lib/trainingDifficulty";

import "./App.css";


// Types for the promotion piece and pending promotion.
type PromotionPiece = "q" | "r" | "b" | "n";

type PendingPromotion = {
  from: Square;
  to: Square;
};

function App() {
  const gameIdRef = useRef(0);
  

  const {
    status: engineStatus,
    bestMove,
    requestMove,
    cancelMove,
    clearBestMove,
  } = useStockfish();

  const {
    isReady: analysisReady,
    isAnalyzing,
    latestAnalysis,
    analyzePlayerMove,
  } = useMoveAnalysis();

  const [
    pendingOpponentFen,
    setPendingOpponentFen,
  ] = useState<string | null>(null);

  const [
    pendingOpponentLegalMoves,
    setPendingOpponentLegalMoves,
  ] = useState(0);

  const lastRatedMoveRef = useRef<string | null>(null);


  // Store the current chess game in React state.
  const [game, setGame] = useState(() => new Chess());

  const [boardOrientation, setBoardOrientation] =
  useState<"white" | "black">("white");


  // Store the pending promotion piece.
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  

  // Store the training mode.
  const [trainingMode, setTrainingMode] = useState<TrainingMode>("medium");

  // Store the estimated player rating.
  const [estimatedPlayerRating, setEstimatedPlayerRating] = useState(1200);

  const opponentConfig = createOpponentConfig(
    estimatedPlayerRating,
    trainingMode
  );

  // Store whether the game has started.
  const gameHasStarted = game.history().length > 0;

  const {
    isReady:
      opponentAnalysisReady,
  
    isAnalyzing:
      opponentAnalysisRunning,
  
    analyze:
      analyzeOpponentPosition,

    cancel:
      cancelOpponentAnalysis,
  } = useOpponentAnalysis();


  // Analyze the opponent position with the
  // full-strength objective analysis engine.
  useEffect(() => {
    if (
      !pendingOpponentFen ||
      !opponentAnalysisReady ||
      opponentAnalysisRunning
    ) {
      return;
    }
  
    analyzeOpponentPosition(
      pendingOpponentFen,
      pendingOpponentLegalMoves
    );
  }, [
    pendingOpponentFen,
    pendingOpponentLegalMoves,
    opponentAnalysisReady,
    opponentAnalysisRunning,
    analyzeOpponentPosition,
  ]);

  useEffect(() => {
    if (!latestAnalysis) {
      return;
    }

    if (!pendingOpponentFen) {
      return;
    }
  
    const analysisId =
    `${gameIdRef.current}-` +
    `${latestAnalysis.moveNumber}-` +
    `${latestAnalysis.playerColor}-` +
    `${latestAnalysis.playerMove}`;
  
    let nextSkill =
      estimatedPlayerRating;
  
    // Only apply the skill evidence once.
    if (
      lastRatedMoveRef.current !==
      analysisId
    ) {
      nextSkill =
        updateSkillFromAnalysis(
          estimatedPlayerRating,
          latestAnalysis
        );
  
      lastRatedMoveRef.current =
        analysisId;
  
      setEstimatedPlayerRating(
        nextSkill
      );
    }
  
    // Black's response is separate from whether
    // this analysis changed/updated the rating.
    const nextOpponentConfig =
      createOpponentConfig(
        nextSkill,
        trainingMode
      );

    requestMove(
      pendingOpponentFen,
      nextOpponentConfig.stockfishRating
    );

    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);
  }, [
    latestAnalysis,
    pendingOpponentFen,
    estimatedPlayerRating,
    trainingMode,
    requestMove,
  ]);

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
  
    // Position before the player's move.
    const beforeFen = game.fen();
    const legalMoveCount = game.moves().length;
  
    const nextGame = applyMove(
      game,
      source,
      target,
      promotion
    );
  
    // applyMove can return null, so check this first.
    if (!nextGame) {
      return false;
    }
  
    // We now know nextGame exists.
    const afterFen = nextGame.fen();
  
    const playerMove =
      `${source}${target}`;
  
    setGame(nextGame);
    if (!nextGame.isGameOver()) {
      setPendingOpponentFen(afterFen);
    
      setPendingOpponentLegalMoves(
        nextGame.moves().length
      );
    } else {
      setPendingOpponentFen(null);
      setPendingOpponentLegalMoves(0);
    }
  
    // Analyze the player's move.
    if (analysisReady && !isAnalyzing) {
      analyzePlayerMove({
        moveNumber: Math.ceil(
          nextGame.history().length / 2
        ),
        playerColor: "white",
        playerMove,
        beforeFen,
        afterFen,
        legalMoveCount,
      });
    } else if (!nextGame.isGameOver()) {
      requestMove(
        afterFen,
        opponentConfig.stockfishRating
      );
    
      setPendingOpponentFen(null);
      setPendingOpponentLegalMoves(0);
    }
  
    return true;
  }

  // Completes the promotion by applying the move to the game state.
  function completePromotion(piece: PromotionPiece) {
    if (!pendingPromotion) {
      return;
    }
  
    // Save the position BEFORE the promotion move.
    const beforeFen = game.fen();
    const legalMoveCount = game.moves().length;
  
    const nextGame = applyMove(
      game,
      pendingPromotion.from,
      pendingPromotion.to,
      piece
    );
  
    if (nextGame) {
      // Save the position AFTER the promotion move.
      const afterFen = nextGame.fen();
  
      // UCI promotion moves include the promoted piece.
      // Example: e7e8q
      const playerMove =
        `${pendingPromotion.from}${pendingPromotion.to}${piece}`;
  
      setGame(nextGame);
      if (!nextGame.isGameOver()) {
        setPendingOpponentFen(afterFen);
      
        setPendingOpponentLegalMoves(
          nextGame.moves().length
        );
      } else {
        setPendingOpponentFen(null);
        setPendingOpponentLegalMoves(0);
      }
  
      // Send the move to our analysis engine.
      if (analysisReady && !isAnalyzing) {
        analyzePlayerMove({
          moveNumber: Math.ceil(
            nextGame.history().length / 2
          ),
          playerColor: "white",
          playerMove,
          beforeFen,
          afterFen,
          legalMoveCount,
        });
      } else if (!nextGame.isGameOver()) {
        requestMove(
          afterFen,
          opponentConfig.stockfishRating
        );
      
        setPendingOpponentFen(null);
        setPendingOpponentLegalMoves(0);
      }
    }
  
    setPendingPromotion(null);
  }

  // Start a completely new game.
  function startNewGame() {
    cancelMove();
    cancelOpponentAnalysis();

    gameIdRef.current += 1;

    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);

    setGame(new Chess());
    setPendingPromotion(null);
  }

  // Undo the most recent move. 
  function undoMove() {
    cancelMove();
    cancelOpponentAnalysis();

    setPendingPromotion(null);
    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);

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
        
        <div className="training-settings">
          <h3>Training difficulty</h3>

          <div className="training-options">
            <button
              type="button"
              onClick={() => setTrainingMode("easy")}
              disabled={gameHasStarted}
              aria-pressed={trainingMode === "easy"}
            >
              Easy
            </button>

            <button
              type="button"
              onClick={() => setTrainingMode("medium")}
              disabled={gameHasStarted}
              aria-pressed={trainingMode === "medium"}
            >
              Medium
            </button>

            <button
              type="button"
              onClick={() => setTrainingMode("hard")}
              disabled={gameHasStarted}
              aria-pressed={trainingMode === "hard"}
            >
              Hard
            </button>
          </div>

          <p>
            Estimated skill: {estimatedPlayerRating}
          </p>

          <p>
            Target opponent: {opponentConfig.targetRating}
          </p>
          {opponentConfig.stockfishRating !== opponentConfig.targetRating && (
            <p>
              Stockfish's current Elo mode is limited to
              ratings of {opponentConfig.stockfishRating} or higher.
            </p>
          )}

          {gameHasStarted && (
            <p>
              Training difficulty is locked for this game.
            </p>
          )}
        </div>
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