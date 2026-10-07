import type {
    AccentTheme,
    BoardTheme,
    PieceSet,
    UserPreferences,
  } from "./types";
  
  const PREFERENCES_STORAGE_KEY =
    "adaptive-chess-trainer-preferences";
  
  const PREFERENCES_VERSION = 1;

  export const DEFAULT_PIECE_SET: PieceSet =
  "classic";

const VALID_PIECE_SETS: PieceSet[] = [
  "classic",
  "modern",
  "minimal",
];
  
  export const DEFAULT_ACCENT_THEME: AccentTheme =
    "purple";

    export const DEFAULT_BOARD_THEME: BoardTheme =
    "purple";
  
  const VALID_BOARD_THEMES: BoardTheme[] = [
    "grey",
    "bamboo",
    "green",
    "purple",
  ];
  
  const VALID_ACCENT_THEMES: AccentTheme[] = [
    "pink",
    "white",
    "purple",
    "teal",
    "orange",
  ];
  
  export function createDefaultPreferences(): UserPreferences {
    return {
      version: PREFERENCES_VERSION,
      accentTheme: DEFAULT_ACCENT_THEME,
      boardTheme: DEFAULT_BOARD_THEME,
      pieceSet: DEFAULT_PIECE_SET,
    };
  }

  function isPieceSet(
    value: unknown
  ): value is PieceSet {
    return (
      typeof value === "string" &&
      VALID_PIECE_SETS.includes(
        value as PieceSet
      )
    );
  }
  
  function isAccentTheme(
    value: unknown
  ): value is AccentTheme {
    return (
      typeof value === "string" &&
      VALID_ACCENT_THEMES.includes(
        value as AccentTheme
      )
    );
  }

  function isBoardTheme(
    value: unknown
  ): value is BoardTheme {
    return (
      typeof value === "string" &&
      VALID_BOARD_THEMES.includes(
        value as BoardTheme
      )
    );
  }
  
  function isValidPreferences(
    value: unknown
  ): value is UserPreferences {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      return false;
    }
  
    const preferences =
      value as Partial<UserPreferences>;
  
    return (
      preferences.version ===
        PREFERENCES_VERSION &&
      isAccentTheme(preferences.accentTheme) &&
      isBoardTheme(preferences.boardTheme) &&
      isPieceSet(preferences.pieceSet)
    );
  }
  
  export function loadPreferences(): UserPreferences {
    const storedValue = localStorage.getItem(
      PREFERENCES_STORAGE_KEY
    );
  
    if (!storedValue) {
      return createDefaultPreferences();
    }
  
    try {
      const parsed: unknown =
        JSON.parse(storedValue);
  
      if (
        typeof parsed !== "object" ||
        parsed === null
      ) {
        return createDefaultPreferences();
      }
  
      const stored =
        parsed as Partial<UserPreferences>;
  
      // Migrate preferences saved before board
      // themes were introduced.
      if (
        stored.version ===
          PREFERENCES_VERSION &&
        isAccentTheme(stored.accentTheme)
      ) {
        const migrated: UserPreferences = {
          version: PREFERENCES_VERSION,
      
          accentTheme:
            stored.accentTheme,
      
          boardTheme:
            isBoardTheme(stored.boardTheme)
              ? stored.boardTheme
              : DEFAULT_BOARD_THEME,
      
          pieceSet:
            isPieceSet(stored.pieceSet)
              ? stored.pieceSet
              : DEFAULT_PIECE_SET,
        };
      
        savePreferences(migrated);
      
        return migrated;
      }
  
      if (!isValidPreferences(parsed)) {
        return createDefaultPreferences();
      }
  
      return parsed;
    } catch {
      return createDefaultPreferences();
    }
  }
  
  export function savePreferences(
    preferences: UserPreferences
  ): void {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  }