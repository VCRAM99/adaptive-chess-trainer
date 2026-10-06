import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    StoredGame,
  } from "./types";
  
  import {
    calculateCareerStatistics,
    DEFAULT_DIFFICULTY_FILTER,
    filterGamesByDifficulty,
  } from "./statistics";
  
  function createGame(
    overrides: Partial<StoredGame> = {}
  ): StoredGame {
    return {
      id: "game",
      playedAt:
        "2026-10-06T12:00:00.000Z",
  
      playerColor: "white",
      trainingMode: "medium",
  
      result: "win",
  
      ratingBefore: 700,
      ratingAfter: 710,
  
      accuracy: 80,
      averageCentipawnLoss: 50,
  
      moveCount: 20,
  
      moveTiers: {
        diamond: 1,
        platinum: 2,
        gold: 3,
        silver: 4,
        bronze: 2,
        steel: 1,
        wood: 0,
      },
  
      ...overrides,
    };
  }
  
  describe(
    "calculateCareerStatistics",
    () => {
      it("returns empty statistics for no games", () => {
        const stats =
          calculateCareerStatistics([]);
  
        expect(stats.gamesPlayed).toBe(0);
        expect(stats.wins).toBe(0);
        expect(stats.losses).toBe(0);
        expect(stats.draws).toBe(0);
  
        expect(stats.winRate).toBeNull();
  
        expect(
          stats.averageAccuracy
        ).toBeNull();
  
        expect(
          stats.averageCentipawnLoss
        ).toBeNull();
      });
  
      it("calculates overall results", () => {
        const games = [
          createGame({
            id: "1",
            result: "win",
          }),
  
          createGame({
            id: "2",
            result: "loss",
          }),
  
          createGame({
            id: "3",
            result: "draw",
          }),
  
          createGame({
            id: "4",
            result: "win",
          }),
        ];
  
        const stats =
          calculateCareerStatistics(games);
  
        expect(stats.gamesPlayed).toBe(4);
        expect(stats.wins).toBe(2);
        expect(stats.losses).toBe(1);
        expect(stats.draws).toBe(1);
        expect(stats.winRate).toBe(50);
      });
  
      it("calculates average accuracy and CPL", () => {
        const games = [
          createGame({
            id: "1",
            accuracy: 80,
            averageCentipawnLoss: 60,
          }),
  
          createGame({
            id: "2",
            accuracy: 90,
            averageCentipawnLoss: 40,
          }),
        ];
  
        const stats =
          calculateCareerStatistics(games);
  
        expect(
          stats.averageAccuracy
        ).toBe(85);
  
        expect(
          stats.averageCentipawnLoss
        ).toBe(50);
      });
  
      it("ignores unavailable accuracy and CPL", () => {
        const games = [
          createGame({
            id: "1",
            accuracy: 80,
            averageCentipawnLoss: 40,
          }),
  
          createGame({
            id: "2",
            accuracy: null,
            averageCentipawnLoss: null,
          }),
        ];
  
        const stats =
          calculateCareerStatistics(games);
  
        expect(
          stats.averageAccuracy
        ).toBe(80);
  
        expect(
          stats.averageCentipawnLoss
        ).toBe(40);
      });
  
      it("calculates White and Black records", () => {
        const games = [
          createGame({
            id: "1",
            playerColor: "white",
            result: "win",
          }),
  
          createGame({
            id: "2",
            playerColor: "white",
            result: "loss",
          }),
  
          createGame({
            id: "3",
            playerColor: "black",
            result: "win",
          }),
  
          createGame({
            id: "4",
            playerColor: "black",
            result: "draw",
          }),
        ];
  
        const stats =
          calculateCareerStatistics(games);
  
        expect(stats.whiteGames).toBe(2);
        expect(stats.whiteWins).toBe(1);
        expect(stats.whiteLosses).toBe(1);
        expect(stats.whiteDraws).toBe(0);
  
        expect(stats.blackGames).toBe(2);
        expect(stats.blackWins).toBe(1);
        expect(stats.blackLosses).toBe(0);
        expect(stats.blackDraws).toBe(1);
      });
  
      it("adds move tier totals", () => {
        const games = [
          createGame({
            id: "1",
          }),
  
          createGame({
            id: "2",
          }),
        ];
  
        const stats =
          calculateCareerStatistics(games);
  
        expect(
          stats.moveTiers.diamond
        ).toBe(2);
  
        expect(
          stats.moveTiers.platinum
        ).toBe(4);
  
        expect(
          stats.moveTiers.gold
        ).toBe(6);
  
        expect(
          stats.moveTiers.wood
        ).toBe(0);
      });
    }
  );
  
  describe(
    "filterGamesByDifficulty",
    () => {
      const games = [
        createGame({
          id: "easy",
          trainingMode: "easy",
        }),
  
        createGame({
          id: "medium",
          trainingMode: "medium",
        }),
  
        createGame({
          id: "hard",
          trainingMode: "hard",
        }),
      ];
  
      it("includes all difficulties by default", () => {
        const filtered =
          filterGamesByDifficulty(
            games,
            DEFAULT_DIFFICULTY_FILTER
          );
  
        expect(filtered).toHaveLength(3);
      });
  
      it("can select one difficulty", () => {
        const filtered =
          filterGamesByDifficulty(
            games,
            {
              easy: false,
              medium: true,
              hard: false,
            }
          );
  
        expect(filtered).toHaveLength(1);
  
        expect(
          filtered[0].trainingMode
        ).toBe("medium");
      });
  
      it("can select multiple difficulties", () => {
        const filtered =
          filterGamesByDifficulty(
            games,
            {
              easy: true,
              medium: false,
              hard: true,
            }
          );
  
        expect(filtered).toHaveLength(2);
  
        expect(
          filtered.map(
            (game) =>
              game.trainingMode
          )
        ).toEqual([
          "easy",
          "hard",
        ]);
      });
    }
  );