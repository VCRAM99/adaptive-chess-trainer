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
import { updateOpponentForm, } from "./lib/opponentForm";
import { getDisplayedRating } from "./lib/displayRating";
import "./App.css";
import { devLog } from "./lib/devLogger";
import ColorSelectionDialog from "./components/ColorSelectionDialog";

//PostGame
import { buildGameRecord } from "./lib/postGame/buildGameRecord";
import type { CompletedGameRecord, GameResult } from "./lib/postGame/types";
import { usePostGameAnalysis } from "./hooks/usePostGameAnalysis";
import { getReviewFen } from "./lib/postGame/reviewNavigation";
import { buildAnalyzedMoves } from "./lib/postGame/buildAnalyzedMoves";
import { createReviewArrows } from "./lib/postGame/reviewArrows";
import { calculateMatchSummary } from "./lib/postGame/matchSummary";
import { createEvaluationTimeline } from "./lib/postGame/evaluationTimeline";
import EvaluationTimeline from "./components/EvaluationTimeline";


// Types for the player color and player color choice.
type PlayerColor = "white" | "black";
// Types for the promotion piece and pending promotion.
type PromotionPiece = "q" | "r" | "b" | "n";
type PendingPromotion = {
  from: Square;   
  to: Square;
};

function formatTierName(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

const MOVE_TIERS = [
  "diamond",
  "platinum",
  "gold",
  "silver",
  "bronze",
  "steel",
  "wood",
] as const;

function App() {
  const gameIdRef = useRef(0);
  const [completedGame, setCompletedGame] = useState<CompletedGameRecord | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [selectedReviewPly, setSelectedReviewPly] = useState(0);
  const completedGameIdRef = useRef<number | null>(null);
  const gameStartedAtRef = useRef(new Date().toISOString());
  const handledOpponentFenRef = useRef<string | null>(null);
  const opponentFormRef = useRef(0);
  const {
    isAnalyzing: isReviewAnalyzing,
    completedMoves: reviewedMoveCount,
    totalMoves: reviewTotalMoves,
    results: reviewResults,
    error: reviewError,
    isComplete: isReviewComplete,
    startAnalysis: startPostGameAnalysis,
    cancelAnalysis: cancelPostGameAnalysis,
  } = usePostGameAnalysis();
  
  const analyzedMoves =
  isReviewComplete
    ? buildAnalyzedMoves(reviewResults)
    : [];

  const evaluationTimeline =
    isReviewComplete
      ? createEvaluationTimeline(
          reviewResults
        )
      : [];

  const [playerColor, setPlayerColor] =
  useState<PlayerColor>("white");

  const [
    isColorDialogOpen,
    setIsColorDialogOpen,
  ] = useState(true);

  const opponentColor: PlayerColor =
  playerColor === "white"
    ? "black"
    : "white";

  const matchSummary =
    isReviewComplete
      ? calculateMatchSummary(
          analyzedMoves,
          playerColor
        )
      : null;

  const selectedAnalyzedMove =
    isReviewMode &&
    isReviewComplete &&
    selectedReviewPly >= 1 &&
    selectedReviewPly <= analyzedMoves.length
      ? analyzedMoves[selectedReviewPly - 1] ?? null
      : null;

  const reviewArrows =
      isReviewMode && selectedAnalyzedMove
        ? createReviewArrows(
            selectedAnalyzedMove.uci,
            selectedAnalyzedMove.bestMoveUci
          )
        : [];

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
  const [estimatedPlayerRating, setEstimatedPlayerRating] = useState(700);

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
      game.turn() !==
        toChessColor(opponentColor) ||
      game.isGameOver()
    ) {
      return;
    }
  
    const candidates =
    createOpponentCandidates(
      opponentAnalysisResult.analysis
        .candidates,
      opponentColor,
      opponentColor
    );
  
    const responseConfig =
      createOpponentConfig(
        pendingOpponentSkill,
        trainingMode
      );
      const decision = chooseAdaptiveOpponentMove(
        candidates,
        {
          targetSkill: responseConfig.targetRating,
          opponentForm: opponentFormRef.current,
          fen: pendingOpponentFen,
        }
      );
      devLog("Adaptive opponent decision", {
          estimatedPlayerSkill:
            pendingOpponentSkill,
          trainingMode,
          targetSkill:
            responseConfig.targetRating,
          
          opponentForm:
            opponentFormRef.current,
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

    opponentFormRef.current =
  updateOpponentForm(
    opponentFormRef.current
  );
  
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
    opponentColor,
  ]);

  useEffect(() => {
    if (!latestAnalysis) {
      return;
    }

    if (
      latestAnalysis.playerColor !== playerColor
    ) {
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
  
    // The opponent's response is separate from whether
    // this analysis changed/updated the rating.
    setPendingOpponentSkill(
      nextSkill
    );
  }, [
    latestAnalysis,
    pendingOpponentFen,
    estimatedPlayerRating,
    playerColor,
  ]);

  useEffect(() => {
    if (!game.isGameOver()) {
      return;
    }
  
    if (
      completedGameIdRef.current ===
      gameIdRef.current
    ) {
      return;
    }
  
    let result: GameResult;
  
    if (game.isDraw()) {
      result = "draw";
    } else if (game.isCheckmate()) {
      result =
      game.turn() !== toChessColor(playerColor)
          ? "black"
          : "white";
    } else {
      // Defensive fallback for an unexpected
      // terminal condition.
      return;
    }
  
    try {
      const record = buildGameRecord(
        game.pgn(),
        `game-${gameIdRef.current}`,
        gameStartedAtRef.current,
        new Date().toISOString(),
        result
      );
  
      completedGameIdRef.current =
        gameIdRef.current;
  
      setCompletedGame(record);
  
      devLog("Completed game captured", {
        gameId: record.id,
        result: record.result,
        moveCount: record.moves.length,
      });
    } catch (error) {
      console.error(
        "Failed to capture completed game:",
        error
      );
    }
  }, [game]);


  //checka if the move is legal and if it requires a promotion. and updates the game state.
  function makeMove(
    source: Square,
    target: Square,
    promotion?: PromotionPiece
  ): boolean {
    if (
      game.isGameOver() ||
      pendingPromotion ||
      game.turn() !== toChessColor(playerColor) ||
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

      analyzePlayerMove({
        moveNumber: Math.ceil(
          nextGame.history().length / 2
        ),
        playerColor,
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
          playerColor,
          playerMove,
          beforeFen,
          afterFen,
          legalMoveCount,
        });
      }
    }
  
    setPendingPromotion(null);
  }

  // Analyze the game and enter review mode.
  function handleAnalyzeGame() {
    if (!completedGame) {
      return;
    }

    setSelectedReviewPly(
      completedGame.moves.length
    );

    setIsReviewMode(true);
    startPostGameAnalysis(completedGame);
  }

  function reviewPrevious() {
    if (!completedGame) {
      return;
    }
  
    setSelectedReviewPly((current) =>
      Math.max(1, current - 1)
    );
  }
  
  function reviewNext() {
    if (!completedGame) {
      return;
    }
  
    setSelectedReviewPly((current) =>
      Math.min(
        current + 1,
        completedGame.moves.length
      )
    );
  }
  
  function reviewStart() {
    if (!completedGame?.moves.length) {
      return;
    }
  
    setSelectedReviewPly(1);
  }
  
  function reviewEnd() {
    if (!completedGame) {
      return;
    }
  
    setSelectedReviewPly(
      completedGame.moves.length
    );
  }

  function requestNewGame() {
    setIsColorDialogOpen(true);
  }


  // Reset the game to a new position.
  function resetGame(
    color: PlayerColor
  ) {
    cancelOpponentAnalysis();
    cancelPostGameAnalysis();
    setIsReviewMode(false);
    setSelectedReviewPly(0);

    gameIdRef.current += 1;

    completedGameIdRef.current = null;
    gameStartedAtRef.current = new Date().toISOString();
    setCompletedGame(null);

    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);

    setPendingOpponentSkill(null);

    handledOpponentFenRef.current = null;
    opponentFormRef.current = 0;

    const newGame = new Chess();

    setPlayerColor(color);
    setBoardOrientation(color);
    setGame(newGame);
    setPendingPromotion(null);

    if (color === "black") {
      handledOpponentFenRef.current = null;

      setPendingOpponentFen(
        newGame.fen()
      );

      setPendingOpponentLegalMoves(
        newGame.moves().length
      );

      setPendingOpponentSkill(
        estimatedPlayerRating
      );
    } else {
      setPendingOpponentFen(null);
      setPendingOpponentLegalMoves(0);
      setPendingOpponentSkill(null);
    }
  }

  // Choose the player color.
  function choosePlayerColor(
    color: PlayerColor
  ) {
    setIsColorDialogOpen(false);
    resetGame(color);
  }

  // Undo the most recent move. 
  function undoMove() {
    if (isReviewMode) {
      return;
    }
  
    const history = game.history();
  
    // If the player has not made a move yet,
    // there is nothing for them to undo.
    const hasPlayerMove = history.some(
      (_, index) =>
        getMoveColor(index) === playerColor
    );
  
    if (!hasPlayerMove) {
      return;
    }
  
    cancelOpponentAnalysis();
    cancelPostGameAnalysis();
  
    completedGameIdRef.current = null;
    setCompletedGame(null);
  
    setPendingPromotion(null);
    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);
    setPendingOpponentSkill(null);
  
    handledOpponentFenRef.current = null;
  
    // Check who made the most recent move.
    const lastMoveIndex = history.length - 1;
    const lastMoveColor =
      getMoveColor(lastMoveIndex);
  
    // If the opponent made the most recent move,
    // undo their response first.
    if (lastMoveColor === opponentColor) {
      const afterOpponentUndo =
        undoLastMove(game);
  
      if (!afterOpponentUndo) {
        return;
      }
  
      // Then undo the player's preceding move.
      const afterPlayerUndo =
        undoLastMove(afterOpponentUndo);
  
      setGame(
        afterPlayerUndo ??
          afterOpponentUndo
      );
  
      return;
    }
  
    // If the player's move is currently the
    // most recent move, the opponent has not
    // responded yet. Undo only the player move.
    const afterPlayerUndo =
      undoLastMove(game);
  
    if (afterPlayerUndo) {
      setGame(afterPlayerUndo);
    }
  }

  function toChessColor(
    color: PlayerColor
  ): "w" | "b" {
    return color === "white" ? "w" : "b";
  }

  function getMoveColor(
    plyIndex: number
  ): PlayerColor {
    return plyIndex % 2 === 0
      ? "white"
      : "black";
  }
  // Flip the board orientation.
  function flipBoard() {
    setBoardOrientation((current) =>
      current === "white" ? "black" : "white"
    );
  }

  const reviewPosition =
  !completedGame ||
  completedGame.moves.length === 0
    ? null
    : getReviewFen(
        completedGame,
        Math.max(
          1,
          Math.min(
            selectedReviewPly,
            completedGame.moves.length
          )
        )
      );

        
const displayedBoardPosition =
  isReviewMode && reviewPosition
    ? reviewPosition
    : game.fen();


    function blockReviewMove() {
      return false;
    }
    const topColor: PlayerColor =
      boardOrientation === "white"
        ? "black"
        : "white";

    const bottomColor: PlayerColor =
      boardOrientation === "white"
        ? "white"
        : "black";

    function getPlayerLabel(
      color: PlayerColor
    ): string {
      if (color === playerColor) {
        return `Estimated Skill: ${getDisplayedRating(
          estimatedPlayerRating
        )}`;
      }

  return "ADAPTIVE OPPONENT";
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
          <span>
            {topColor === "white"
              ? "White"
              : "Black"}
          </span>

          <span>
            {getPlayerLabel(topColor)}
          </span>
        </div>

          <ChessBoard
            position={displayedBoardPosition}
            orientation={boardOrientation}
            onMove={
              isReviewMode
                ? blockReviewMove
                : makeMove
            }
            arrows={reviewArrows}
          />

          <div className="player-info">
            <span>
              {bottomColor === "white"
                ? "White"
                : "Black"}
            </span>

            <span>
              {getPlayerLabel(bottomColor)}
            </span>
          </div>
        </section>

        <GamePanel
          status={getChessGameStatus(game)}
          moveHistory={getMoveHistory(game)}
          opponentStatus={opponentStatus}
          onUndo={undoMove}
          undoDisabled={isReviewMode}
          onNewGame={requestNewGame}
          onFlipBoard={flipBoard}
        />
        {completedGame && (
          <section className="post-game-review">
            <h3>
              {isReviewMode
                ? "Game Analysis"
                : "Game Over"}
            </h3>

            <p>
              Result: {completedGame.result}
            </p>
            {matchSummary && (
              <div className="game-summary">
                <h3>Game Summary</h3>

                <div className="game-summary-main">
                  <div>
                    <span>Your Accuracy</span>
                    <strong>
                      {matchSummary.player.accuracy !== null
                        ? `${matchSummary.player.accuracy.toFixed(1)}%`
                        : "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Opponent Accuracy</span>
                    <strong>
                      {matchSummary.opponent.accuracy !== null
                        ? `${matchSummary.opponent.accuracy.toFixed(1)}%`
                        : "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>AVG-CPL</span>
                    <strong>
                      {matchSummary.player.averageCentipawnLoss !== null
                        ? matchSummary.player.averageCentipawnLoss.toFixed(1)
                        : "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>Gradable Moves</span>
                    <strong>
                      {matchSummary.player.gradableMoves}
                    </strong>
                  </div>
                  <div>
                    <span>Forced Moves</span>
                    <strong>
                      {matchSummary.player.forcedMoves}
                    </strong>
                  </div>
                </div>

                <div className="tier-summary">
                  <h4>Move Quality</h4>

                  <div className="tier-summary-grid">
                    {MOVE_TIERS.map((tier) => (
                      <div
                        className={`tier-summary-item tier-summary-${tier}`}
                        key={tier}
                      >
                        <span>
                          {formatTierName(tier)}
                        </span>

                        <strong>
                          {
                            matchSummary.player
                              .tierCounts[tier]
                          }
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!isReviewMode && (
              <button
                type="button"
                onClick={handleAnalyzeGame}
              >
                Analyze Game
              </button>
            )}

            {isReviewMode && isReviewAnalyzing && (
              <div>
                <p>
                  Analyzing moves:{" "}
                  {reviewedMoveCount} /{" "}
                  {reviewTotalMoves}
                </p>

                <progress
                  value={reviewedMoveCount}
                  max={Math.max(
                    reviewTotalMoves,
                    1
                  )}
                />
              </div>
            )}

            {isReviewMode && reviewError && (
              <p role="alert">
                Analysis error: {reviewError}
              </p>
            )}

            {isReviewMode && isReviewComplete && (
              <div className = "completed-review">
                <EvaluationTimeline
                  points={evaluationTimeline}
                  selectedPly={selectedReviewPly}
                  onSelectedPlyChange={
                    setSelectedReviewPly
                  }
                />
              <div className="review-navigation">
                <button
                  type="button"
                  onClick={reviewStart}
                  disabled={selectedReviewPly <= 1}
                >
                  Start
                </button>

                <button
                  type="button"
                  onClick={reviewPrevious}
                  disabled={selectedReviewPly <= 1}
                >
                  Previous
                </button>

                <span aria-live="polite">
                  Move {selectedReviewPly} / {completedGame.moves.length}
                </span>

                <button
                  type="button"
                  onClick={reviewNext}
                  disabled={
                    selectedReviewPly ===
                    completedGame.moves.length
                  }
                >
                  Next
                </button>

                <button
                  type="button"
                  onClick={reviewEnd}
                  disabled={
                    selectedReviewPly ===
                    completedGame.moves.length
                  }
                >
                  End
                </button>
              </div>
            </div>
            )}
            {selectedAnalyzedMove && (
              <div className="review-move-details">
                <div className="review-move-header">
                  <div>
                    <span className="review-move-label">
                      Move {selectedAnalyzedMove.ply}
                    </span>
              
                    <h4>{selectedAnalyzedMove.san}</h4>
                  </div>
              
                  {selectedAnalyzedMove.tier && (
                    <span
                      className={`move-tier move-tier-${selectedAnalyzedMove.tier}`}
                    >
                      {formatTierName(
                        selectedAnalyzedMove.tier
                      )}
                    </span>
                  )}
                </div>
              
                <div className="review-move-stats">
                  <div>
                    <span>Played by</span>
                    <strong>
                      {selectedAnalyzedMove.playedBy === "white"
                        ? "White"
                        : "Black"}
                    </strong>
                  </div>
              
                  <div>
                    <span>Played move</span>
                    <strong>
                      {selectedAnalyzedMove.uci}
                    </strong>
                  </div>
              
                  <div>
                    <span>Best move</span>
                    <strong>
                      {selectedAnalyzedMove.bestMoveUci ??
                        "Unavailable"}
                    </strong>
                  </div>
              
                  <div>
                    <span>Centipawn loss</span>
              
                    <strong>
                      {selectedAnalyzedMove.qualitySource ===
                        "centipawn" &&
                      selectedAnalyzedMove.centipawnLoss !== null
                        ? selectedAnalyzedMove.centipawnLoss.toFixed(
                            1
                          )
                        : selectedAnalyzedMove.qualitySource ===
                            "mate"
                          ? "Mate"
                          : "N/A"}
                    </strong>
                  </div>
                </div>
              
                {selectedAnalyzedMove.isForcedMove && (
                  <p className="review-move-note">
                    Forced move — excluded from accuracy.
                  </p>
                )}
              </div>
            )}   
          </section>
        )}
     
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
            Estimated skill: {getDisplayedRating(estimatedPlayerRating)}
          </p>

          <p>
            Target opponent: {getDisplayedRating(opponentConfig.targetRating)}
          </p>

          {gameHasStarted && (
            <p>
              Training difficulty is locked for this game.
            </p>
          )}
        </div>
      </main>
      {isColorDialogOpen && (
        <ColorSelectionDialog
          onSelect={choosePlayerColor}
          onCancel={
            gameHasStarted ||
            completedGame
              ? () =>
                  setIsColorDialogOpen(false)
              : undefined
          }
        />
      )}
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