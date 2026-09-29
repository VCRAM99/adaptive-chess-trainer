import { useState, useEffect, useRef} from "react";
import { Chess, type Square } from "chess.js";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";
import PromotionDialog from "./components/PromotionDialog";
import { applyMove, isLegalMove, requiresPromotion, undoLastMove, getGameStatus as getChessGameStatus, getMoveHistory } from "./lib/chessGame";
import { parseUciMove } from "./engine/uci";
import { useMoveAnalysis } from "./hooks/useMoveAnalysis";
import { updateSkillFromAnalysis } from "./lib/skillEstimator";
import { useOpponentAnalysis,} from "./hooks/useOpponentAnalysis";
import { createOpponentCandidates, } from "./lib/opponentCandidateAnalysis";
import { chooseAdaptiveOpponentMove, } from "./lib/opponentDecision";


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
  const handledOpponentFenRef = useRef<string | null>(null);

  //temporary logging of the time it takes to analyze the opponent and player moves.
  const playerAnalysisStartedAtRef =
  useRef<number | null>(null);

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

  const [
    pendingOpponentSkill,
    setPendingOpponentSkill,
  ] = useState<number | null>(
    null
  );

  // Store whether the game has started.
  const gameHasStarted = game.history().length > 0;

  const {
    isReady:
      opponentAnalysisReady,
    isAnalyzing:
      opponentAnalysisRunning,
    result:
      opponentAnalysisResult,
    analyze:
      analyzeOpponentPosition,
    cancel:
      cancelOpponentAnalysis,
  } = useOpponentAnalysis();

  const opponentStatus:
  | "starting"
  | "ready"
  | "thinking" =
  !opponentAnalysisReady
    ? "starting"
    : pendingOpponentFen
      ? "thinking"
      : "ready";
      
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
    if (
      !pendingOpponentFen ||
      pendingOpponentSkill === null ||
      !opponentAnalysisResult
    ) {
      return;
    }
  
    if (
      opponentAnalysisResult.fen !==
      pendingOpponentFen

      
    ) {
      return;
    }
  
    if (
      handledOpponentFenRef.current ===
      pendingOpponentFen
    ) {
      return;
    }
  
    if (
      game.turn() !== "b" ||
      game.isGameOver()
    ) {
      return;
    }
  
    const candidates =
      createOpponentCandidates(
        opponentAnalysisResult.analysis
          .candidates,
        "black",
        "black"
      );
  
    const responseConfig =
      createOpponentConfig(
        pendingOpponentSkill,
        trainingMode
      );

    //temporary logging of the time it takes to select the opponent move.
    console.time(
      "Opponent move selection"
    );

    const decision =
      chooseAdaptiveOpponentMove(
        candidates,
        responseConfig.targetRating
      );

    //temporary logging of the time it takes to select the opponent move.
      console.timeEnd(
        "Opponent move selection"
      );

      console.log(
        "Adaptive opponent decision:",
        {
          estimatedPlayerSkill:
            pendingOpponentSkill,
          trainingMode,
          targetSkill:
            responseConfig.targetRating,
          candidateCount:
            candidates.length,
          selectedMove:
            decision.candidate?.move ??
            null,
          selectedCentipawnLoss:
            decision.candidate
              ?.centipawnLoss ??
            null,
          selectedMate:
            decision.candidate?.mate ??
            null,
          bypassedSelection:
            decision.bypassedSelection,
        }
      );
  
    if (!decision.candidate) {
      console.error(
        "Adaptive opponent could not select a move."
      );
      return;
    }
  
    const parsedMove =
      parseUciMove(
        decision.candidate.move
      );
  
    if (!parsedMove) {
      console.error(
        "Adaptive opponent selected an invalid UCI move:",
        decision.candidate.move
      );
      return;
    }
  
    const nextGame =
      applyMove(
        game,
        parsedMove.source,
        parsedMove.target,
        parsedMove.promotion
      );
  
    if (!nextGame) {
      console.error(
        "Adaptive opponent selected an illegal move:",
        decision.candidate.move
      );
      return;
    }
  
    handledOpponentFenRef.current =
      pendingOpponentFen;
  
    setGame(nextGame);
  
    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);
    setPendingOpponentSkill(null);
  }, [
    pendingOpponentFen,
    pendingOpponentSkill,
    opponentAnalysisResult,
    game,
    trainingMode,
  ]);

  useEffect(() => {
    if (!latestAnalysis) {
      return;
    }

    if (!pendingOpponentFen) {
      return;
    }

    //temporary logging of the time it takes to analyze the player's move.
    if (
      playerAnalysisStartedAtRef.current !==
      null
    ) {
      console.log(
        "Player move analysis:",
        Math.round(
          performance.now() -
            playerAnalysisStartedAtRef.current
        ),
        "ms"
      );
    
      playerAnalysisStartedAtRef.current =
        null;
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
    setPendingOpponentSkill(
      nextSkill
    );
  }, [
    latestAnalysis,
    pendingOpponentFen,
    estimatedPlayerRating,
  ]);

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
      !analysisReady ||
      !opponentAnalysisReady
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
      handledOpponentFenRef.current =
       null;

      setPendingOpponentSkill(null);
      setPendingOpponentFen(afterFen);
    
      setPendingOpponentLegalMoves(
        nextGame.moves().length
      );
    } else {
      setPendingOpponentFen(null);
      setPendingOpponentLegalMoves(0);
      setPendingOpponentSkill(null);
    }
  
    // Analyze the player's move.
    if (
      analysisReady &&
      !isAnalyzing
    ) {
      //temporary logging of the time it takes to analyze the player's move.
      playerAnalysisStartedAtRef.current =
      performance.now();

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

        handledOpponentFenRef.current =
          null;

        setPendingOpponentSkill(null);
        setPendingOpponentFen(afterFen);
      
        setPendingOpponentLegalMoves(
          nextGame.moves().length
        );
      } else {
        setPendingOpponentFen(null);
        setPendingOpponentLegalMoves(0);
        setPendingOpponentSkill(null);
      }
  
      // Send the move to our analysis engine.
      if (
        analysisReady &&
        !isAnalyzing
      ) {
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
      }
    }
  
    setPendingPromotion(null);
  }

  // Start a completely new game.
  function startNewGame() {
    cancelOpponentAnalysis();

    gameIdRef.current += 1;

    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);

    setPendingOpponentSkill(null);

    handledOpponentFenRef.current = null;

    setGame(new Chess());
    setPendingPromotion(null);
  }

  // Undo the most recent move. 
  function undoMove() {
    cancelOpponentAnalysis();

    setPendingPromotion(null);
    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);
    setPendingOpponentSkill(null);

    handledOpponentFenRef.current = null;

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
            <span>ADAPTIVE OPPONENT</span>
          </div>

          <ChessBoard
            position={game.fen()}
            orientation={boardOrientation}
            onMove={makeMove}
          />

          <div className="player-info">
            <span>White</span>
            <span>Estimated Skill: {estimatedPlayerRating}</span>
          </div>
        </section>

        <GamePanel
          status={getChessGameStatus(game)}
          moveHistory={getMoveHistory(game)}
          opponentStatus={opponentStatus}
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