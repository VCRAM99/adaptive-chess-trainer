import type {
    AccentTheme,
    UserPreferences,
  } from "./types";
  
  const PREFERENCES_STORAGE_KEY =
    "adaptive-chess-trainer-preferences";
  
  const PREFERENCES_VERSION = 1;
  
  export const DEFAULT_ACCENT_THEME: AccentTheme =
    "purple";
  
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
    };
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
      isAccentTheme(preferences.accentTheme)
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