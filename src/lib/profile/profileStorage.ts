import type {
    PlayerProfile,
    StoredGame,
  } from "./types";
  
  const PROFILE_STORAGE_KEY =
    "adaptive-chess-trainer-profile";
  
  const PROFILE_VERSION = 1;
  
  const INITIAL_ESTIMATED_RATING = 700;
  
  export function createDefaultProfile(): PlayerProfile {
    const now = new Date().toISOString();
  
    return {
      version: PROFILE_VERSION,
      createdAt: now,
      lastPlayedAt: null,
  
      estimatedRating: INITIAL_ESTIMATED_RATING,
      bestRating: INITIAL_ESTIMATED_RATING,
  
      games: [],
    };
  }
  
  export function saveProfile(
    profile: PlayerProfile
  ): void {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(profile)
    );
  }
  
  export function loadProfile(): PlayerProfile {
    const storedValue = localStorage.getItem(
      PROFILE_STORAGE_KEY
    );
  
    if (!storedValue) {
      return createDefaultProfile();
    }
  
    try {
      const parsed: unknown =
        JSON.parse(storedValue);
  
      const profile = parseStoredProfile(parsed);

      if (!profile) {
        return createDefaultProfile();
      }

      return profile;
    } catch {
      return createDefaultProfile();
    }
  }
  
  export function addStoredGame(
    profile: PlayerProfile,
    game: StoredGame
  ): PlayerProfile {
    // Prevent the same completed game from
    // accidentally being recorded twice.
    if (
      profile.games.some(
        (storedGame) =>
          storedGame.id === game.id
      )
    ) {
      return profile;
    }
  
    return {
      ...profile,
  
      lastPlayedAt: game.playedAt,
  
      estimatedRating:
        game.ratingAfter,
  
      bestRating: Math.max(
        profile.bestRating,
        game.ratingAfter
      ),
  
      games: [
        ...profile.games,
        game,
      ],
    };
  }
  
  export function parseStoredProfile(
    value: unknown
  ): PlayerProfile | null {
    return isValidProfile(value) ? value : null;
  }

  export function isValidProfile(
    value: unknown
  ): value is PlayerProfile {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      return false;
    }
  
    const profile =
      value as Partial<PlayerProfile>;
  
    return (
      profile.version === PROFILE_VERSION &&
      typeof profile.createdAt === "string" &&
      (
        profile.lastPlayedAt === null ||
        typeof profile.lastPlayedAt ===
          "string"
      ) &&
      typeof profile.estimatedRating ===
        "number" &&
      Number.isFinite(
        profile.estimatedRating
      ) &&
      typeof profile.bestRating ===
        "number" &&
      Number.isFinite(profile.bestRating) &&
      Array.isArray(profile.games) &&
      profile.games.every(isValidStoredGame)
    );
  }

  function isValidStoredGame(
    value: unknown
  ): value is StoredGame {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      return false;
    }
  
    const game =
      value as Partial<StoredGame>;
  
    const validColor =
      game.playerColor === "white" ||
      game.playerColor === "black";
  
    const validMode =
      game.trainingMode === "easy" ||
      game.trainingMode === "medium" ||
      game.trainingMode === "hard";
  
    const validResult =
      game.result === "win" ||
      game.result === "loss" ||
      game.result === "draw";
  
    const validAccuracy =
      game.accuracy === null ||
      (
        typeof game.accuracy === "number" &&
        Number.isFinite(game.accuracy)
      );
  
    const validCpl =
      game.averageCentipawnLoss === null ||
      (
        typeof game.averageCentipawnLoss ===
          "number" &&
        Number.isFinite(
          game.averageCentipawnLoss
        )
      );
  
    return (
      typeof game.id === "string" &&
      typeof game.playedAt === "string" &&
      validColor &&
      validMode &&
      validResult &&
      typeof game.ratingBefore ===
        "number" &&
      Number.isFinite(game.ratingBefore) &&
      typeof game.ratingAfter ===
        "number" &&
      Number.isFinite(game.ratingAfter) &&
      validAccuracy &&
      typeof game.moveCount === "number" &&
      Number.isFinite(game.moveCount) &&
      validCpl &&
      isValidMoveTiers(game.moveTiers)
    );
  }
  
  function isValidMoveTiers(
    value: unknown
  ): boolean {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      return false;
    }
  
    const tiers = value as Record<
      string,
      unknown
    >;
  
    const names = [
      "diamond",
      "platinum",
      "gold",
      "silver",
      "bronze",
      "steel",
      "wood",
    ];
  
    return names.every(
      (name) =>
        typeof tiers[name] === "number" &&
        Number.isFinite(tiers[name])
    );
  }

  export function resetProfile(): PlayerProfile {
    const newProfile =
      createDefaultProfile();
  
    saveProfile(newProfile);
  
    return newProfile;
  }