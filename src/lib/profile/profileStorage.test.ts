// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  addStoredGame,
  createDefaultProfile,
  loadProfile,
  saveProfile,
  resetProfile,
} from "./profileStorage";

import type { StoredGame } from "./types";

function createTestGame(overrides: Partial<StoredGame> = {}): StoredGame {
  return {
    id: "game-1",
    playedAt: "2026-10-05T12:00:00.000Z",

    playerColor: "white",
    trainingMode: "medium",

    result: "win",

    ratingBefore: 700,
    ratingAfter: 720,

    accuracy: 87.5,

    moveCount: 32,

    averageCentipawnLoss: 41,

    moveTiers: {
      diamond: 3,
      platinum: 5,
      gold: 8,
      silver: 6,
      bronze: 3,
      steel: 1,
      wood: 0,
    },

    ...overrides,
  };
}

describe("profileStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("resets the stored profile to a fresh default profile", () => {
    const profile = createDefaultProfile();

    const modifiedProfile = {
      ...profile,
      estimatedRating: 950,
      bestRating: 1000,
      lastPlayedAt: "2026-10-06T12:00:00.000Z",
    };

    saveProfile(modifiedProfile);

    const reset = resetProfile();

    const loaded = loadProfile();

    expect(reset.estimatedRating).toBe(700);

    expect(reset.bestRating).toBe(700);

    expect(reset.games).toEqual([]);

    expect(reset.lastPlayedAt).toBeNull();

    expect(loaded.estimatedRating).toBe(700);

    expect(loaded.bestRating).toBe(700);

    expect(loaded.games).toEqual([]);
  });

  it("creates the default profile", () => {
    const profile = createDefaultProfile();

    expect(profile.version).toBe(1);
    expect(profile.estimatedRating).toBe(700);
    expect(profile.bestRating).toBe(700);
    expect(profile.games).toEqual([]);
  });

  it("loads the default profile when storage is empty", () => {
    const profile = loadProfile();

    expect(profile.estimatedRating).toBe(700);

    expect(profile.games).toEqual([]);
  });

  it("saves and loads a profile", () => {
    const profile = createDefaultProfile();

    const updatedProfile = {
      ...profile,
      estimatedRating: 850,
      bestRating: 900,
    };

    saveProfile(updatedProfile);

    expect(loadProfile()).toEqual(updatedProfile);
  });

  it("returns a default profile for corrupted JSON", () => {
    localStorage.setItem("adaptive-chess-trainer-profile", "{broken-json");

    const profile = loadProfile();

    expect(profile.estimatedRating).toBe(700);

    expect(profile.games).toEqual([]);
  });

  it("adds a completed game", () => {
    const profile = createDefaultProfile();

    const game = createTestGame();

    const updated = addStoredGame(profile, game);

    expect(updated.games).toHaveLength(1);

    expect(updated.games[0]).toEqual(game);

    expect(updated.estimatedRating).toBe(720);

    expect(updated.bestRating).toBe(720);
  });

  it("does not store the same game twice", () => {
    const profile = createDefaultProfile();

    const game = createTestGame();

    const first = addStoredGame(profile, game);

    const second = addStoredGame(first, game);

    expect(second.games).toHaveLength(1);
  });

  it("preserves the highest rating", () => {
    const profile = {
      ...createDefaultProfile(),
      estimatedRating: 900,
      bestRating: 950,
    };

    const game = createTestGame({
      ratingBefore: 900,
      ratingAfter: 880,
    });

    const updated = addStoredGame(profile, game);

    expect(updated.estimatedRating).toBe(880);

    expect(updated.bestRating).toBe(950);
  });
  it("preserves player accuracy in a stored game", () => {
    const profile = createDefaultProfile();

    const game = createTestGame({
      playerColor: "black",
      accuracy: 91.7,
    });

    const updated = addStoredGame(profile, game);

    saveProfile(updated);

    const loaded = loadProfile();

    expect(loaded.games).toHaveLength(1);

    expect(loaded.games[0].playerColor).toBe("black");

    expect(loaded.games[0].accuracy).toBe(91.7);
  });
});
