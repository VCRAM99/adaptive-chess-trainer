// @vitest-environment jsdom

import {
    beforeEach,
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    createDefaultPreferences,
    loadPreferences,
    savePreferences,
  } from "./preferencesStorage";
  
  describe("preferencesStorage", () => {
    beforeEach(() => {
      localStorage.clear();
    });
  
    it("creates Purple as the default accent", () => {
      const preferences =
        createDefaultPreferences();
  
      expect(
        preferences.accentTheme
      ).toBe("purple");
    });
  
    it("loads default preferences when nothing is stored", () => {
      const preferences =
        loadPreferences();
  
      expect(
        preferences.accentTheme
      ).toBe("purple");
    });
  
    it("saves and loads an accent preference", () => {
      const preferences =
        createDefaultPreferences();
  
      savePreferences({
        ...preferences,
        accentTheme: "teal",
      });
  
      expect(
        loadPreferences().accentTheme
      ).toBe("teal");
    });
  
    it("falls back to defaults for invalid stored data", () => {
      localStorage.setItem(
        "adaptive-chess-trainer-preferences",
        JSON.stringify({
          version: 1,
          accentTheme: "invalid-theme",
        })
      );
  
      expect(
        loadPreferences().accentTheme
      ).toBe("purple");
    });
  
    it("falls back to defaults for malformed JSON", () => {
      localStorage.setItem(
        "adaptive-chess-trainer-preferences",
        "{not-valid-json"
      );
  
      expect(
        loadPreferences().accentTheme
      ).toBe("purple");
    });
  });