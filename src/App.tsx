import { useState, useEffect, useRef} from "react";
import { Chess, type Square } from "chess.js";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";
import PromotionDialog from "./components/PromotionDialog";
import { applyMove, isLegalMove, requiresPromotion, undoLastMove, getGameStatus as getChessGameStatus } from "./lib/chessGame";
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
import NewGameDialog, { type NewGameSettings, } from "./components/NewGameDialog";
import ProfilePage from "./pages/ProfilePage";
type AppPage = "game" | "profile";
import { loadProfile, saveProfile, addStoredGame, resetProfile } from "./lib/profile/profileStorage";
import { createStoredGame, getStoredGameResult, } from "./lib/profile/createStoredGame";
import type { PlayerProfile } from "./lib/profile/types";
import { getCheckmateWinner, } from "./lib/postGame/gameResult";
import { applyAccentTheme } from "./lib/preferences/applyAccentTheme";
import { loadPreferences, savePreferences } from "./lib/preferences/preferencesStorage";
import type { AccentTheme } from "./lib/preferences/types";
import { UserRound, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, } from "lucide-react";

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

type BoardIdentityProps = {
  type: "player" | "opponent";

  playerRating: number;

  engineStatus:
    | "ready"
    | "thinking"
    | "error";
};

function BoardIdentity({
  type,
  playerRating,
  engineStatus,
}: BoardIdentityProps) {
  if (type === "player") {
    return (
      <div
        className="board-identity board-identity--player"
        data-tooltip="PLAYER ELO"
        aria-label={`Player Elo: ${playerRating}`}
        tabIndex={0}
      >
        <p className="board-player-rating">
          {playerRating}
        </p>
      </div>
    );
  }

  const statusLabel =
    engineStatus === "thinking"
      ? "THINKING"
      : engineStatus === "error"
        ? "ENGINE ERROR"
        : "READY";

  return (
    <div
      className="board-identity board-identity--opponent"
      data-tooltip={statusLabel}
      aria-label={`Adaptive opponent: ${statusLabel}`}
      tabIndex={0}
    >
      <span
        className={
          `engine-status-dot ` +
          `engine-status-dot--${engineStatus}`
        }
        aria-hidden="true"
      />

      <p className="board-opponent-label">
        Adaptive Opponent
      </p>
    </div>
  );
}

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

  const [playerProfile, setPlayerProfile] =
  useState<PlayerProfile>(() =>
    loadProfile()
  );

  const [
    userPreferences,
    setUserPreferences,
  ] = useState(() => loadPreferences());

  const [
    isNewGameDialogOpen,
    setIsNewGameDialogOpen,
  ] = useState(true);

  const [
    hasStartedFirstGame,
    setHasStartedFirstGame,
  ] = useState(false);

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
  const [estimatedPlayerRating, setEstimatedPlayerRating] = useState(() => playerProfile.estimatedRating);
  const gameStartRatingRef = useRef(estimatedPlayerRating);
  const storedGameIdRef = useRef<string | null>(null);

  const [
    pendingOpponentSkill,
    setPendingOpponentSkill,
  ] = useState<number | null>(
    null
  );

  const {
    isReady:
      opponentAnalysisReady,
    isAnalyzing:
      opponentAnalysisRunning,
    error:
      opponentAnalysisError,
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

  const [appPage, setAppPage] =
      useState<AppPage>("game");

    const currentGameStatus =
    getChessGameStatus(game);
  
  const normalizedGameStatus =
    currentGameStatus.toLowerCase();
  
  const gameStatusTone:
    | "normal"
    | "warning"
    | "finished" =
    game.isGameOver()
      ? "finished"
      : normalizedGameStatus.includes("check")
        ? "warning"
        : "normal";
      
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
    applyAccentTheme(
      userPreferences.accentTheme
    );
  
    savePreferences(
      userPreferences
    );
  }, [userPreferences]);

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
    setPlayerProfile((currentProfile) => {
      if (
        currentProfile.estimatedRating ===
          estimatedPlayerRating &&
        currentProfile.bestRating >=
          estimatedPlayerRating
      ) {
        return currentProfile;
      }
  
      const updatedProfile: PlayerProfile = {
        ...currentProfile,
  
        estimatedRating:
          estimatedPlayerRating,
  
        bestRating: Math.max(
          currentProfile.bestRating,
          estimatedPlayerRating
        ),
      };
  
      saveProfile(updatedProfile);
  
      return updatedProfile;
    });
  }, [estimatedPlayerRating]);

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
        getCheckmateWinner(
          game.turn()
        );
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

  function handleAccentThemeChange(
    accentTheme: AccentTheme
  ) {
    setUserPreferences(
      (currentPreferences) => ({
        ...currentPreferences,
        accentTheme,
      })
    );
  }

  //Reset the player profile and the estimated player rating.
  function handleResetProgress() {
    const freshProfile =
      resetProfile();
  
    setPlayerProfile(
      freshProfile
    );
  
    setEstimatedPlayerRating(
      freshProfile.estimatedRating
    );
  
    gameStartRatingRef.current =
      freshProfile.estimatedRating;
  }

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

  useEffect(() => {
    if (
      !isReviewMode ||
      !isReviewComplete ||
      !completedGame
    ) {
      return;
    }
  
    const totalMoves: number =
      completedGame.moves.length;
  
    const handleReviewKeyDown = (
      event: KeyboardEvent
    ) => {
      const target =
        event.target as HTMLElement | null;
  
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
  
      if (event.key === "ArrowLeft") {
        event.preventDefault();
  
        setSelectedReviewPly((current) =>
          Math.max(1, current - 1)
        );
  
        return;
      }
  
      if (event.key === "ArrowRight") {
        event.preventDefault();
  
        setSelectedReviewPly((current) =>
          Math.min(
            totalMoves,
            current + 1
          )
        );
      }
    };
  
    window.addEventListener(
      "keydown",
      handleReviewKeyDown
    );
  
    return () => {
      window.removeEventListener(
        "keydown",
        handleReviewKeyDown
      );
    };
  }, [
    isReviewMode,
    isReviewComplete,
    completedGame,
  ]);

  function requestNewGame() {
    setIsNewGameDialogOpen(true);
  }


  // Reset the game to a new position.
  function resetGame(
    color: PlayerColor,
    mode: TrainingMode
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

    gameStartRatingRef.current = estimatedPlayerRating;
    storedGameIdRef.current = null;
    const newGame = new Chess();

    setPlayerColor(color);
    setTrainingMode(mode);
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
  function handleStartNewGame(
    settings: NewGameSettings
  ) {
    setIsNewGameDialogOpen(false);
    setHasStartedFirstGame(true);
  
    resetGame(
      settings.playerColor,
      settings.trainingMode
    );
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

  const topIdentity: "player" | "opponent" =
  topColor === playerColor
    ? "player"
    : "opponent";
  
  const bottomIdentity: "player" | "opponent" =
    bottomColor === playerColor
      ? "player"
      : "opponent";
  
  const displayedPlayerRating =
    getDisplayedRating(
      estimatedPlayerRating
    );

    const engineStatus:
    | "ready"
    | "thinking"
    | "error" =
    opponentAnalysisError
      ? "error"
      : opponentStatus === "thinking" ||
          opponentStatus === "starting"
        ? "thinking"
        : "ready";

  const canUndoPlayerMove =
    game.history().some(
      (_, index) =>
        getMoveColor(index) === playerColor
    );

  useEffect(() => {
    if (
      !completedGame ||
      !matchSummary 
    ) {
      return;
    }
  
    if (
      storedGameIdRef.current ===
      completedGame.id
    ) {
      return;
    }
  
    const storedGame = createStoredGame({
      id: completedGame.id,
  
      playedAt:
        completedGame.completedAt,
  
      playerColor,
      trainingMode,
  
      result: getStoredGameResult(
        completedGame.result,
        playerColor
      ),
  
      ratingBefore:
        gameStartRatingRef.current,
  
      ratingAfter:
        estimatedPlayerRating,
  
      // matchSummary.player already represents
      // whichever side the human played.
      accuracy:
        matchSummary.player.accuracy,
  
      averageCentipawnLoss:
        matchSummary.player
          .averageCentipawnLoss,
  
      moveCount:
          completedGame.moves.filter(
            (move) =>
              move.playedBy === playerColor
          ).length,
  
      moveTiers: {
        diamond:
          matchSummary.player
            .tierCounts.diamond,
  
        platinum:
          matchSummary.player
            .tierCounts.platinum,
  
        gold:
          matchSummary.player
            .tierCounts.gold,
  
        silver:
          matchSummary.player
            .tierCounts.silver,
  
        bronze:
          matchSummary.player
            .tierCounts.bronze,
  
        steel:
          matchSummary.player
            .tierCounts.steel,
  
        wood:
          matchSummary.player
            .tierCounts.wood,
      },
    });
  
    setPlayerProfile(
      (currentProfile) => {
        const updatedProfile =
          addStoredGame(
            currentProfile,
            storedGame
          );
  
        saveProfile(updatedProfile);
  
        return updatedProfile;
      }
    );
  
    storedGameIdRef.current =
      completedGame.id;
  }, [
    completedGame,
    matchSummary,
    playerColor,
    trainingMode,
    estimatedPlayerRating,
  ]);

  const postGamePlayerResult:
  | "victory"
  | "defeat"
  | "draw"
  | null =
  completedGame === null
    ? null
    : completedGame.result === "draw"
      ? "draw"
      : completedGame.result === playerColor
        ? "victory"
        : "defeat";

  const postGameRatingChange =
  completedGame
    ? estimatedPlayerRating -
      gameStartRatingRef.current
    : 0;

  const formattedRatingChange =
  postGameRatingChange > 0
    ? `+${postGameRatingChange}`
    : postGameRatingChange < 0
      ? `${postGameRatingChange}`
      : "±0";

  const postGameResultLabel =
  postGamePlayerResult === "victory"
    ? "VICTORY"
    : postGamePlayerResult === "defeat"
      ? "DEFEAT"
      : postGamePlayerResult === "draw"
        ? "DRAW"
        : null;

  const postGameChessResult =
  completedGame?.result === "white"
    ? "WHITE WINS"
    : completedGame?.result === "black"
      ? "BLACK WINS"
      : completedGame?.result === "draw"
        ? "DRAW"
        : null;

  //Display Profile Page FINAL BEFORE RETURN
  if (appPage === "profile") {
    return (
      <ProfilePage
        profile={playerProfile}
        accentTheme={
          userPreferences.accentTheme
        }
        boardTheme={userPreferences.boardTheme}
        pieceSet={
          userPreferences.pieceSet
        }
        onAccentThemeChange={
          handleAccentThemeChange
        }

        onPieceSetChange={(pieceSet) => {
          setUserPreferences((current) => ({
            ...current,
            pieceSet,
          }));
        }}
        onBoardThemeChange={(boardTheme) => {
          setUserPreferences((current) => ({
            ...current,
            boardTheme,
          }));
        }}
        onBackToGame={() =>
          setAppPage("game")
        }
        onResetProgress={
          handleResetProgress
        }
      />
    );
  }

  // Display the application.
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <h1>ADAPTIVE CHESS TRAINER</h1>

          {/* <p>Train Smarter - Play Stronger</p> */}
        </div>

        <button
          type="button"
          className="profile-nav-button"
          onClick={() =>
            setAppPage("profile")
          }
          aria-label="Player profile"
          data-tooltip="PLAYER PROFILE"
        >
          <UserRound
            size={21}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>
      </header>

      <main className="game-layout">
        <div className="game-board-column">
        <section className="board-section">
          <div className="game-board-area">
            <BoardIdentity
              type={topIdentity}
              playerRating={
                displayedPlayerRating
              }
              engineStatus={
                engineStatus
              }
            />

            <ChessBoard
              position={
                displayedBoardPosition
              }
              orientation={
                boardOrientation
              }
              boardTheme={userPreferences.boardTheme}
              pieceSet={userPreferences.pieceSet}
              onMove={
                isReviewMode
                  ? blockReviewMove
                  : makeMove
              }
              arrows={
                reviewArrows
              }
            />

            <BoardIdentity
              type={bottomIdentity}
              playerRating={
                displayedPlayerRating
              }
              engineStatus={
                engineStatus
              }
            />
          </div>
        </section>
        {completedGame &&
          isReviewMode &&
          isReviewComplete && (
            <section className="board-evaluation">

              <div className="analysis-section-heading">
                <span>Evaluation</span>

                <span>
                  White + / Black −
                </span>
              </div>

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
                  className="review-navigation__button"
                  onClick={reviewStart}
                  disabled={selectedReviewPly <= 1}
                  aria-label="First move"
                  data-tooltip="FIRST MOVE"
                >
                  <ChevronsLeft
                    size={19}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="review-navigation__button"
                  onClick={reviewPrevious}
                  disabled={selectedReviewPly <= 1}
                  aria-label="Previous move"
                  data-tooltip="PREVIOUS MOVE"
                >
                  <ChevronLeft
                    size={19}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>

                <div className="review-navigation__position">
                  <span aria-live="polite">
                    MOVE {selectedReviewPly} /{" "}
                    {completedGame.moves.length}
                  </span>

                  <small>
                    ← / → TO NAVIGATE
                  </small>
                </div>

                <button
                  type="button"
                  className="review-navigation__button"
                  onClick={reviewNext}
                  disabled={
                    selectedReviewPly ===
                    completedGame.moves.length
                  }
                  aria-label="Next move"
                  data-tooltip="NEXT MOVE"
                >
                  <ChevronRight
                    size={19}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="review-navigation__button"
                  onClick={reviewEnd}
                  disabled={
                    selectedReviewPly ===
                    completedGame.moves.length
                  }
                  aria-label="Last move"
                  data-tooltip="LAST MOVE"
                >
                  <ChevronsRight
                    size={19}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>

              </div>

            </section>
          )}
        </div>
        <div className="game-sidebar">
        <GamePanel
          status={currentGameStatus}
          statusTone={gameStatusTone}
          trainingMode={trainingMode}

          onUndo={undoMove}
          undoDisabled={
            isReviewMode ||
            !canUndoPlayerMove
          }

          onNewGame={requestNewGame}
          onFlipBoard={flipBoard}

          onAnalyze={handleAnalyzeGame}

          showAnalyze={
            completedGame !== null &&
            (
              !isReviewMode ||
              isReviewAnalyzing ||
              reviewError !== null
            )
          }

          postGameResult={
            postGameResultLabel &&
            postGameChessResult
              ? {
                  label: postGameResultLabel,
                  ratingChange:
                    formattedRatingChange,
                  chessResult:
                    postGameChessResult,
                }
              : null
          }

          isAnalysisLoading={
            isReviewMode &&
            isReviewAnalyzing
          }

          isAnalysisMode={
            isReviewMode &&
            isReviewComplete
          }

          analysisError={
            reviewError !== null
          }
        />
        {completedGame && isReviewMode &&(
          <section className="post-game-review">
            <div className="analysis-header">
              <span className="analysis-eyebrow">
                POST-GAME REVIEW
              </span>

              <h2>Game Analysis</h2>

              <span className="analysis-perspective">
                Evaluation · White Perspective
              </span>
            </div>
            {matchSummary && (
              <div className="game-summary">
                <div className="game-summary-main">
              
                  <div className="analysis-stat">
                    <span>Accuracy</span>
              
                    <strong>
                      {matchSummary.player.accuracy !== null
                        ? `${matchSummary.player.accuracy.toFixed(1)}%`
                        : "N/A"}
                    </strong>
                  </div>
              
                  <div className="analysis-stat">
                    <span>Avg CPL</span>
              
                    <strong>
                      {matchSummary.player.averageCentipawnLoss !== null
                        ? matchSummary.player.averageCentipawnLoss.toFixed(1)
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <details className="tier-summary">
                  <summary className="tier-summary__toggle">

                    <span>Move Quality</span>

                    <span className="tier-summary__toggle-right">
                      {matchSummary.player.gradableMoves} graded

                      <ChevronDown
                        className="tier-summary__chevron"
                        size={17}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </span>

                  </summary>

                  <div className="tier-summary-list">

                    {MOVE_TIERS.map((tier) => (
                      <div
                        className={
                          `tier-summary-row ` +
                          `tier-summary-${tier}`
                        }
                        key={tier}
                      >
                        <span className="tier-summary-row__name">
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
                </details>
              </div>
            )}


            {selectedAnalyzedMove && (
              <div className="review-move-details">
                <div className="review-move-header">
                <div>
                  <span className="review-move-label">
                    MOVE {selectedAnalyzedMove.ply} ·{" "}
                    {selectedAnalyzedMove.playedBy === "white"
                      ? "WHITE"
                      : "BLACK"}
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
                  <span
                    className="review-move-value review-move-value--played"
                    data-tooltip="PLAYED MOVE"
                    tabIndex={0}
                  >
                    {selectedAnalyzedMove.uci}
                  </span>

                  <span
                    className="review-move-value review-move-value--best"
                    data-tooltip="BEST MOVE"
                    tabIndex={0}
                  >
                    {selectedAnalyzedMove.bestMoveUci ?? "Unavailable"}
                  </span>

                  <div className="review-eval-stat">
                    <span>
                      {selectedAnalyzedMove.qualitySource === "mate"
                        ? "EVAL"
                        : "CPL"}
                    </span>

                    <strong>
                      {selectedAnalyzedMove.qualitySource === "centipawn" &&
                      selectedAnalyzedMove.centipawnLoss !== null
                        ? selectedAnalyzedMove.centipawnLoss.toFixed(1)
                        : selectedAnalyzedMove.qualitySource === "mate"
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
        </div>
      </main>
      <NewGameDialog
        open={isNewGameDialogOpen}
        initialPlayerColor={playerColor}
        initialTrainingMode={trainingMode}
        dismissible={hasStartedFirstGame}
        onClose={() =>
          setIsNewGameDialogOpen(false)
        }
        onStartGame={handleStartNewGame}
      />
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