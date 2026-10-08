import { useState, useEffect, useRef, useCallback} from "react";
import { Chess, type Square } from "chess.js";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";
import PromotionDialog from "./components/PromotionDialog";
import { applyMove, isLegalMove, requiresPromotion, undoLastMove, isUndoAllowed, getGameStatus as getChessGameStatus } from "./lib/chessGame";
import { parseUciMove } from "./engine/uci";
import { useMoveAnalysis } from "./hooks/useMoveAnalysis";
import {
  createMoveAnalysisRequestId,
  resolveMoveAnalysisUpdate,
  type ExpectedMoveAnalysis,
} from "./lib/moveAnalysisRequest";
import { useOpponentAnalysis,} from "./hooks/useOpponentAnalysis";
import { createOpponentCandidates, } from "./lib/opponentCandidateAnalysis";
import { chooseAdaptiveOpponentMove, } from "./lib/opponentDecision";
import type { TrainingMode } from "./lib/trainingDifficulty";
import { createOpponentConfig } from "./lib/trainingDifficulty";
import { updateOpponentForm, } from "./lib/opponentForm";
import { getDisplayedRating } from "./lib/displayRating";
import { getBoardParticipants } from "./lib/boardOrientation";
import {
  getCapturedPiecesByColor,
  getCapturedPiecesFromSans,
} from "./lib/capturedPieces";
import BoardInfoRow from "./components/BoardInfoRow";
import "./App.css";
import { devLog } from "./lib/devLogger";
import NewGameDialog, { type NewGameSettings, } from "./components/NewGameDialog";
import ProfilePage from "./pages/ProfilePage";
type AppPage = "game" | "profile";
import { loadProfile, saveProfile, createDefaultProfile } from "./lib/profile/profileStorage";
import { getStoredGameResult, } from "./lib/profile/createStoredGame";
import type { PlayerProfile, StoredGame } from "./lib/profile/types";
import {
  createUnreviewedStoredGame,
  enrichStoredGame,
  insertCompletedGame,
  isHistoryStorageReady,
} from "./lib/profile/storedGameHistory";
import { getCheckmateWinner, } from "./lib/postGame/gameResult";
import { applyAccentTheme } from "./lib/preferences/applyAccentTheme";
import { loadPreferences, savePreferences } from "./lib/preferences/preferencesStorage";
import type { AccentTheme } from "./lib/preferences/types";
import { UserRound, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown, } from "lucide-react";
import AuthDialog from "./components/auth/AuthDialog";
import PasswordRecoveryDialog from "./components/auth/PasswordRecoveryDialog";
import ChangePasswordDialog from "./components/auth/ChangePasswordDialog";
import { loadPlayerStorage } from "./lib/supabase/accountStorage";
import { getGuestImportEligibility } from "./lib/profile/guestMigration";

//PostGame
import { buildGameRecord } from "./lib/postGame/buildGameRecord";
import { createPersistentGameId } from "./lib/persistentGameId";
import type { CompletedGameRecord, GameResult } from "./lib/postGame/types";
import { usePostGameAnalysis } from "./hooks/usePostGameAnalysis";
import { getReviewFen } from "./lib/postGame/reviewNavigation";
import { buildAnalyzedMoves } from "./lib/postGame/buildAnalyzedMoves";
import { createReviewArrows } from "./lib/postGame/reviewArrows";
import { calculateMatchSummary } from "./lib/postGame/matchSummary";
import { createEvaluationTimeline } from "./lib/postGame/evaluationTimeline";
import EvaluationTimeline from "./components/EvaluationTimeline";

// Supabase
import { getAuthState, subscribeToAuthChanges, signOut } from "./lib/supabase/auth";
import type { User } from "@supabase/supabase-js";
import { loadCloudProfile, saveCloudPreferences, saveCloudProfile } from "./lib/supabase/storage";
import { profileSaveQueue, preferencesSaveQueue } from "./lib/supabase/saveQueues";
import { importGuestProgress } from "./lib/supabase/guestImport";

// Types for the player color and player color choice.
type PlayerColor = "white" | "black";
// Types for the promotion piece and pending promotion.
type PromotionPiece = "q" | "r" | "b" | "n";
type PendingPromotion = {
  from: Square;   
  to: Square;
};

type StorageStatus =
  | "loading"
  | "guest"
  | "account"
  | "error";

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
  const persistentGameIdRef = useRef(createPersistentGameId());
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

  const [isGuestImporting, setIsGuestImporting] =
  useState(false);

const [guestImportError, setGuestImportError] =
  useState<string | null>(null);

  const [storageStatus, setStorageStatus] =
  useState<StorageStatus>("loading");

  const loadedStorageUserRef =
  useRef<string | null | undefined>(
    undefined
  );

  
  const lastPersistedProfileRef = useRef<{
    userId: string | null;
    serializedProfile: string;
  } | null>(null);

  const cloudProfileRevisionRef = useRef<{
    userId: string;
    revision: number;
  } | null>(null);
  const skipNextProfileSaveRef = useRef(false);

  const [loadedStorageUserId, setLoadedStorageUserId] =
  useState<string | null | undefined>(undefined);

  const [
    userPreferences,
    setUserPreferences,
  ] = useState(() => loadPreferences());

  const [currentUser, setCurrentUser] =
  useState<User | null>(null);

  const [isAuthLoading, setIsAuthLoading] =
  useState(true);

  const [isAuthDialogOpen, setIsAuthDialogOpen] =
  useState(false);

  const currentUserId = currentUser?.id ?? null;

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false);
  }, []);

  const [isPasswordRecoveryOpen, setIsPasswordRecoveryOpen] =
  useState(false);

  const closeChangePasswordDialog = useCallback(() => {
    setIsChangePasswordOpen(false);
  }, []);

  const [
    isChangePasswordOpen,
    setIsChangePasswordOpen,
  ] = useState(false);

  const [
    isNewGameDialogOpen,
    setIsNewGameDialogOpen,
  ] = useState(true);

  const [
    hasStartedFirstGame,
    setHasStartedFirstGame,
  ] = useState(false);

  const gameOwnerRef =
  useRef<string | null | undefined>(undefined);

  const authUserIdRef = useRef<string | null | undefined>(undefined);

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
    latestAnalysis,
    analyzePlayerMove,
    cancelAnalysis: cancelMoveAnalysis,
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
  const analysisSequenceRef = useRef(0);
  const expectedMoveAnalysisRef =
    useRef<ExpectedMoveAnalysis | null>(null);


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
  const [completedStoredGame, setCompletedStoredGame] =
    useState<StoredGame | null>(null);
  const completedGameOwnerRef = useRef<string | null>(null);
  const discardedGameIdsRef = useRef(new Set<string>());
  const activeReviewGameIdRef = useRef<string | null>(null);

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
    terminalFen:
      opponentTerminalFen,
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
    : pendingOpponentFen &&
      opponentTerminalFen !== pendingOpponentFen
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
      
  const guestProfileForImport = loadProfile();

  const guestImportEligibility =
    currentUserId &&
    storageStatus === "account" &&
    loadedStorageUserId === currentUserId
      ? getGuestImportEligibility(
          guestProfileForImport,
          playerProfile
        )
      : { eligible: false as const };
  // Analyze the opponent position with the
  // full-strength objective analysis engine.
  useEffect(() => {
    if (
      !pendingOpponentFen ||
      !opponentAnalysisReady ||
      opponentAnalysisRunning ||
      opponentTerminalFen === pendingOpponentFen
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
    opponentTerminalFen,
    analyzeOpponentPosition,
  ]);

  useEffect(() => {
    applyAccentTheme(userPreferences.accentTheme);
  }, [userPreferences.accentTheme]);
  
  useEffect(() => {
    if (
      storageStatus === "loading" ||
      storageStatus === "error" ||
      loadedStorageUserId === undefined ||
      loadedStorageUserId !== currentUserId
    ) {
      return;
    }
  
    if (loadedStorageUserId === null) {
      savePreferences(userPreferences);
      return;
    }
  
    const userId = loadedStorageUserId;
    const preferencesToSave = userPreferences;
    
    void preferencesSaveQueue
      .enqueue(() =>
        saveCloudPreferences(
          userId,
          preferencesToSave
        )
      )
      .catch((error) => {
        console.error(
          "Failed to save cloud preferences:",
          error
        );
      });
  }, [
    userPreferences,
    storageStatus,
    loadedStorageUserId,
    currentUserId,
  ]);



  useEffect(() => {
    let isMounted = true;
  
    void getAuthState()
      .then(({ user }) => {
        if (!isMounted) return;
  
        const nextUserId = user?.id ?? null;
  
        if (
          authUserIdRef.current !== undefined &&
          authUserIdRef.current !== nextUserId
        ) {
          gameOwnerRef.current = undefined;
        }
  
        authUserIdRef.current = nextUserId;
        setCurrentUser(user);
        setIsAuthLoading(false);
      })
      .catch((error) => {
        console.error(
          "Failed to load authentication state:",
          error
        );
  
        if (isMounted) {
          setIsAuthLoading(false);
        }
      });
  
    const unsubscribe = subscribeToAuthChanges(
      ({ user, event }) => {
        if (!isMounted) return;
  
        const nextUserId = user?.id ?? null;
  
        if (
          authUserIdRef.current !== undefined &&
          authUserIdRef.current !== nextUserId
        ) {
          gameOwnerRef.current = undefined;
        }
  
        authUserIdRef.current = nextUserId;
        setCurrentUser(user);
        setIsAuthLoading(false);
  
        if (event === "PASSWORD_RECOVERY") {
          setIsAuthDialogOpen(false);
          setIsPasswordRecoveryOpen(true);
        }
      }
    );
  
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  

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
    if (isAuthLoading) {
      return;
    }
  
    let cancelled = false;
  
    async function loadActiveStorage() {
      setStorageStatus("loading");
      setLoadedStorageUserId(undefined);
      loadedStorageUserRef.current = undefined;
  
      try {
        const { profile, preferences, profileRevision } =
          await loadPlayerStorage(currentUserId);
  
        if (cancelled) return;

        cloudProfileRevisionRef.current =
          currentUserId !== null &&
          profileRevision !== null
            ? {
                userId: currentUserId,
                revision: profileRevision,
              }
            : null;

        lastPersistedProfileRef.current = {
          userId: currentUserId,
          serializedProfile: JSON.stringify(profile),
        };
  
        skipNextProfileSaveRef.current = true;

        setPlayerProfile(profile);
        skipNextProfileSaveRef.current = true;
        setUserPreferences(preferences);
        setEstimatedPlayerRating(profile.estimatedRating);
  
        resetGame(
          playerColor,
          trainingMode,
          profile.estimatedRating
        );

        gameOwnerRef.current = currentUserId;
  
        setIsNewGameDialogOpen(true);
  
        loadedStorageUserRef.current = currentUserId;
        setLoadedStorageUserId(currentUserId);
  
        setStorageStatus(
          currentUserId ? "account" : "guest"
        );
      } catch (error) {
        if (cancelled) return;
  
        console.error("Failed to load player storage:", error);
        setStorageStatus("error");
      }
    }
  
    void loadActiveStorage();
  
    return () => {
      cancelled = true;
    };
  }, [currentUserId, isAuthLoading]);

  useEffect(() => {
    const update = resolveMoveAnalysisUpdate({
      delivered: latestAnalysis,
      expected: expectedMoveAnalysisRef.current,
      pendingOpponentFen,
      estimatedRating: estimatedPlayerRating,
      lastRatedRequestId: lastRatedMoveRef.current,
      opponentTargetSkill: pendingOpponentSkill,
    });

    if (!update.accepted) {
      return;
    }

    lastRatedMoveRef.current = update.lastRatedRequestId;

    if (update.estimatedRating !== estimatedPlayerRating) {
      setEstimatedPlayerRating(update.estimatedRating);
    }

    if (
      update.opponentTargetSkill !==
      pendingOpponentSkill
    ) {
      setPendingOpponentSkill(update.opponentTargetSkill);
    }
  }, [
    latestAnalysis,
    pendingOpponentFen,
    estimatedPlayerRating,
    pendingOpponentSkill,
  ]);

  useEffect(() => {
    if (isAuthLoading) return;
  
    if (
      storageStatus !== "guest" &&
      storageStatus !== "account"
    ) {
      return;
    }
  
    if (
      loadedStorageUserId === undefined ||
      loadedStorageUserId !== currentUserId
    ) {
      return;
    }

    if (skipNextProfileSaveRef.current) {
      skipNextProfileSaveRef.current = false;
      return;
    }
  
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
        estimatedRating: estimatedPlayerRating,
        bestRating: Math.max(
          currentProfile.bestRating,
          estimatedPlayerRating
        ),
      };
  
      return updatedProfile;
    });
  }, [
    estimatedPlayerRating,
    storageStatus,
    loadedStorageUserId,
    currentUserId,
    isAuthLoading,
    completedGame,
    matchSummary,
    playerColor,
    trainingMode,
  ]);


  //profile save effect


  useEffect(() => {
    if (
      isAuthLoading ||
      (storageStatus !== "guest" &&
        storageStatus !== "account") ||
      loadedStorageUserId === undefined ||
      loadedStorageUserId !== currentUserId
    ) {
      return;
    }
  
    const userId = loadedStorageUserId;
    const serializedProfile = JSON.stringify(playerProfile);
  
    if (
      lastPersistedProfileRef.current?.userId === userId &&
      lastPersistedProfileRef.current.serializedProfile ===
        serializedProfile
    ) {
      return;
    }
  
    if (userId === null) {
      saveProfile(playerProfile);
  
      lastPersistedProfileRef.current = {
        userId: null,
        serializedProfile,
      };
  
      return;
    }
  
    const profileToSave = playerProfile;
  
    void profileSaveQueue
      .enqueue(async () => {
        const revisionState =
          cloudProfileRevisionRef.current;
  
        if (
          !revisionState ||
          revisionState.userId !== userId ||
          authUserIdRef.current !== userId
        ) {
          return;
        }
  
        const newRevision = await saveCloudProfile(
          userId,
          profileToSave,
          revisionState.revision
        );
  
        cloudProfileRevisionRef.current = {
          userId,
          revision: newRevision,
        };
  
        lastPersistedProfileRef.current = {
          userId,
          serializedProfile,
        };
      })
      .catch((error) => {
        console.error(
          "Failed to save cloud profile:",
          error
        );
      });
  }, [
    playerProfile,
    storageStatus,
    loadedStorageUserId,
    currentUserId,
    isAuthLoading,
  ]);
  
  
  //game save effect
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
        persistentGameIdRef.current,
        gameStartedAtRef.current,
        new Date().toISOString(),
        result
      );
  
      completedGameIdRef.current =
        gameIdRef.current;

      const storedGame = createUnreviewedStoredGame({
        id: record.id,
        playedAt: record.completedAt,
        playerColor,
        trainingMode,
        result: getStoredGameResult(
          record.result,
          playerColor
        ),
        ratingBefore: gameStartRatingRef.current,
        ratingAfter: estimatedPlayerRating,
        moveCount: record.moves.filter(
          (move) => move.playedBy === playerColor
        ).length,
      });

      completedGameOwnerRef.current =
        gameOwnerRef.current ?? null;
      setCompletedStoredGame(storedGame);
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


//guest import progress

async function handleImportGuestProgress(): Promise<boolean> {
  if (
    !currentUserId ||
    isAuthLoading ||
    storageStatus !== "account" ||
    loadedStorageUserId !== currentUserId ||
    isGuestImporting
  ) {
    return false;
  }

  const importingUserId = currentUserId;

  setIsGuestImporting(true);
  setGuestImportError(null);

  try {
    await importGuestProgress(importingUserId);

    const importedSnapshot =
      await loadCloudProfile(importingUserId);

    if (!importedSnapshot) {
      throw new Error(
        "Imported profile could not be loaded."
      );
    }

    // Don't apply data from a previous account.
    if (
      authUserIdRef.current !== importingUserId ||
      loadedStorageUserRef.current !== importingUserId
    ) {
      return false;
    }

    cloudProfileRevisionRef.current = {
      userId: importingUserId,
      revision: importedSnapshot.revision,
    };

    lastPersistedProfileRef.current = {
      userId: importingUserId,
      serializedProfile: JSON.stringify(
        importedSnapshot.profile
      ),
    };

    setPlayerProfile(importedSnapshot.profile);

    setEstimatedPlayerRating(
      importedSnapshot.profile.estimatedRating
    );

    resetGame(
      playerColor,
      trainingMode,
      importedSnapshot.profile.estimatedRating
    );

    gameOwnerRef.current = importingUserId;

    setIsNewGameDialogOpen(true);

    return true;
  } catch (error) {
    console.error(
      "Failed to import guest progress:",
      error
    );

    setGuestImportError(
      error instanceof Error
        ? error.message
        : "Guest progress could not be imported."
    );

    return false;
  } finally {
    setIsGuestImporting(false);
  }
}



  //Reset the player profile and the estimated player rating.
  function handleResetProgress() {
    if (
      isGuestImporting ||
      storageStatus === "loading" ||
      storageStatus === "error"
    ) {
      return;
    }
    const freshProfile = createDefaultProfile();
    const completedId =
      completedStoredGame?.id ?? completedGame?.id;

    if (completedId) {
      discardedGameIdsRef.current.add(completedId);
    }

    activeReviewGameIdRef.current = null;
    cancelPostGameAnalysis();
    setCompletedStoredGame(null);
    setPlayerProfile(freshProfile);
  
    setEstimatedPlayerRating(
      freshProfile.estimatedRating
    );
  
    gameStartRatingRef.current =
      freshProfile.estimatedRating;
  }

  function startPlayerMoveAnalysis(input: {
    moveNumber: number;
    playerMove: string;
    beforeFen: string;
    afterFen: string;
    legalMoveCount: number;
  }) {
    const requestId = createMoveAnalysisRequestId(
      gameIdRef.current,
      ++analysisSequenceRef.current
    );

    const expected: ExpectedMoveAnalysis = {
      requestId,
      gameGeneration: gameIdRef.current,
      beforeFen: input.beforeFen,
      afterFen: input.afterFen,
      playerColor,
    };

    expectedMoveAnalysisRef.current = expected;

    const started = analyzePlayerMove({
      ...input,
      requestId,
      gameGeneration: gameIdRef.current,
      playerColor,
    });

    if (!started) {
      expectedMoveAnalysisRef.current = null;
    }
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
  
    if (analysisReady) {
      startPlayerMoveAnalysis({
        moveNumber: Math.ceil(
          nextGame.history().length / 2
        ),
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
  
      if (analysisReady) {
        startPlayerMoveAnalysis({
          moveNumber: Math.ceil(
            nextGame.history().length / 2
          ),
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
    activeReviewGameIdRef.current = completedGame.id;
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
    mode: TrainingMode,
    startingRating = estimatedPlayerRating,
  ) {
    cancelOpponentAnalysis();
    cancelPostGameAnalysis();
    cancelMoveAnalysis();
    expectedMoveAnalysisRef.current = null;
    activeReviewGameIdRef.current = null;
    setIsReviewMode(false);
    setSelectedReviewPly(0);

    gameIdRef.current += 1;
    persistentGameIdRef.current = createPersistentGameId();
    gameOwnerRef.current = undefined;

    completedGameIdRef.current = null;
    gameStartedAtRef.current = new Date().toISOString();
    setCompletedGame(null);

    setPendingOpponentFen(null);
    setPendingOpponentLegalMoves(0);

    setPendingOpponentSkill(null);

    handledOpponentFenRef.current = null;
    opponentFormRef.current = 0;

    gameStartRatingRef.current = startingRating;
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
        startingRating
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
    gameOwnerRef.current = currentUserId;
  }

  // Undo the most recent move. 
  function undoMove() {
    if (!isUndoAllowed(game, playerColor, isReviewMode)) {
      return;
    }

    cancelMoveAnalysis();
    expectedMoveAnalysisRef.current = null;
  
    const history = game.history();
  
    cancelOpponentAnalysis();
    cancelPostGameAnalysis();
    activeReviewGameIdRef.current = null;

    if (
      completedStoredGame &&
      !playerProfile.games.some(
        (storedGame) =>
          storedGame.id === completedStoredGame.id
      )
    ) {
      setCompletedStoredGame(null);
    }
  
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
  const boardParticipants = getBoardParticipants(
    playerColor,
    boardOrientation
  );

  const capturedPieces =
    isReviewMode && completedGame
      ? getCapturedPiecesFromSans(
          completedGame.moves
            .slice(
              0,
              Math.max(
                0,
                Math.min(
                  selectedReviewPly,
                  completedGame.moves.length
                )
              )
            )
            .map((move) => move.san)
        )
      : getCapturedPiecesByColor(game);
  
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

  useEffect(() => {
    if (!completedStoredGame) {
      return;
    }

    if (
      !isHistoryStorageReady({
        isAuthLoading,
        storageStatus,
        loadedStorageUserId,
        currentUserId,
      })
    ) {
      return;
    }

    const game = completedStoredGame;
    const historyContext = {
      discardedIds: discardedGameIdsRef.current,
      gameOwnerId: completedGameOwnerRef.current,
      currentOwnerId: currentUserId,
      activeReviewGameId: activeReviewGameIdRef.current,
    };

    setPlayerProfile((currentProfile) =>
      insertCompletedGame(
        currentProfile,
        game,
        historyContext
      )
    );
  }, [
    completedStoredGame,
    isAuthLoading,
    storageStatus,
    loadedStorageUserId,
    currentUserId,
  ]);

  useEffect(() => {
    if (
      !isReviewComplete ||
      !completedGame ||
      !matchSummary ||
      !isHistoryStorageReady({
        isAuthLoading,
        storageStatus,
        loadedStorageUserId,
        currentUserId,
      })
    ) {
      return;
    }

    const gameId = completedGame.id;
    const playerSummary = matchSummary.player;

    setPlayerProfile((currentProfile) =>
      enrichStoredGame(
        currentProfile,
        gameId,
        {
          accuracy: playerSummary.accuracy,
          averageCentipawnLoss:
            playerSummary.averageCentipawnLoss,
          moveTiers: {
            diamond: playerSummary.tierCounts.diamond,
            platinum: playerSummary.tierCounts.platinum,
            gold: playerSummary.tierCounts.gold,
            silver: playerSummary.tierCounts.silver,
            bronze: playerSummary.tierCounts.bronze,
            steel: playerSummary.tierCounts.steel,
            wood: playerSummary.tierCounts.wood,
          },
        },
        {
          discardedIds: discardedGameIdsRef.current,
          gameOwnerId: completedGameOwnerRef.current,
          currentOwnerId: currentUserId,
          activeReviewGameId:
            activeReviewGameIdRef.current,
        }
      )
    );
  }, [
    isReviewComplete,
    completedGame,
    matchSummary,
    isAuthLoading,
    storageStatus,
    loadedStorageUserId,
    currentUserId,
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


  async function handleSignOut() {
    try {
      const { error } = await signOut();
  
      if (error) {
        throw error;
      }
  
      setCurrentUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
      window.alert("Unable to sign out. Please try again.");
    }
  }
  //Display Profile Page FINAL BEFORE RETURN
  if (appPage === "profile") {
    return (
      <>
        <ProfilePage
          profile={playerProfile}
          canImportGuestProgress={
            guestImportEligibility.eligible
          }
          guestImportGameCount={
            guestProfileForImport.games.length
          }
          guestImportRating={
            guestImportEligibility.eligible
              ? guestProfileForImport.estimatedRating
              : null
          }
          currentUser={currentUser}
          isAuthLoading={isAuthLoading}
          accentTheme={userPreferences.accentTheme}
          boardTheme={userPreferences.boardTheme}
          pieceSet={userPreferences.pieceSet}
          onAccentThemeChange={handleAccentThemeChange}
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
          onBackToGame={() => setAppPage("game")}
          onResetProgress={handleResetProgress}
          onImportGuestProgress={handleImportGuestProgress}
          isGuestImporting={isGuestImporting}
          guestImportError={guestImportError}
          onOpenAuthDialog={() =>
            setIsAuthDialogOpen(true)
          }
          onChangePassword={() =>
            setIsChangePasswordOpen(true)
          }
          onSignOut={handleSignOut}
        />
  
        <AuthDialog
          open={isAuthDialogOpen}
          onClose={closeAuthDialog}
        />
  
        <PasswordRecoveryDialog
          open={isPasswordRecoveryOpen}
          onClose={() =>
            setIsPasswordRecoveryOpen(false)
          }
        />
  
        <ChangePasswordDialog
          open={isChangePasswordOpen}
          email={currentUser?.email ?? ""}
          onClose={closeChangePasswordDialog}
        />
      </>
    );
  }

  // Display the application.
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <img
            className="app-header__logo"
            src={`${import.meta.env.BASE_URL}images/chess-trainer-logo.png`}
            alt=""
          />
          <h1>ADAPTIVE CHESS TRAINER</h1>
        </div>

        <div className="app-header__actions">
          {!isAuthLoading && !currentUser && (
            <button
              type="button"
              className="auth-nav-button"
              onClick={() => setIsAuthDialogOpen(true)}
            >
              Sign In / Create Account
            </button>
          )}

          <button
            type="button"
            className="profile-nav-button"
            onClick={() => setAppPage("profile")}
            aria-label="Player profile"
            data-tooltip="PLAYER PROFILE"
          >
            <UserRound
              size={21}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      <main className="game-layout">
        <div className="game-board-column">
        <section className="board-section">
          <div className="game-board-area">
            <BoardInfoRow
              role={boardParticipants.top.role}
              color={boardParticipants.top.color}
              playerRating={displayedPlayerRating}
              engineStatus={engineStatus}
              capturedPieces={
                capturedPieces[
                  boardParticipants.top.color
                ]
              }
              pieceSet={userPreferences.pieceSet}
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

            <BoardInfoRow
              role={boardParticipants.bottom.role}
              color={boardParticipants.bottom.color}
              playerRating={displayedPlayerRating}
              engineStatus={engineStatus}
              capturedPieces={
                capturedPieces[
                  boardParticipants.bottom.color
                ]
              }
              pieceSet={userPreferences.pieceSet}
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
            !isUndoAllowed(game, playerColor, isReviewMode)
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
      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
      />
      <PasswordRecoveryDialog
        open={isPasswordRecoveryOpen}
        onClose={() => setIsPasswordRecoveryOpen(false)}
      />
      <ChangePasswordDialog
        open={isChangePasswordOpen}
        email={currentUser?.email ?? ""}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}

export default App;