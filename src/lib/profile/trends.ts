import type {
    StoredGame,
  } from "./types";
  
  import type {
    DifficultyFilter,
  } from "./statistics";
  
  import {
    getDisplayedRating,
  } from "../displayRating";
  
  export type TrendPoint = {
    gameNumber: number;
    gameId: string;
    playedAt: string;
    value: number;
  };
  
  function sortGamesOldestFirst(
    games: StoredGame[]
  ): StoredGame[] {
    return games.toSorted(
      (a, b) =>
        new Date(a.playedAt).getTime() -
        new Date(b.playedAt).getTime()
    );
  }
  
  /*
   * Estimated Skill
   *
   * Important:
   * This intentionally ignores the difficulty filter.
   *
   * Rating is one continuous career timeline, so removing
   * Easy/Medium/Hard games would distort the history.
   */
  export function getRatingTrend(
    games: StoredGame[]
  ): TrendPoint[] {
    const sortedGames =
      sortGamesOldestFirst(games);
  
    return sortedGames.map(
      (game, index) => ({
        gameNumber: index + 1,
        gameId: game.id,
        playedAt: game.playedAt,
        value: getDisplayedRating(
          game.ratingAfter
        ),
      })
    );
  }
  
  /*
   * Accuracy
   *
   * Respects the existing Games Included filter.
   * Games without an accuracy value are skipped.
   */
  export function getAccuracyTrend(
    games: StoredGame[],
    filter: DifficultyFilter
  ): TrendPoint[] {
    const filteredGames =
      games.filter(
        (game) =>
          filter[game.trainingMode]
      );
  
    const sortedGames =
      sortGamesOldestFirst(
        filteredGames
      );
  
    return sortedGames
      .filter(
        (game) =>
          game.accuracy !== null
      )
      .map((game, index) => ({
        gameNumber: index + 1,
        gameId: game.id,
        playedAt: game.playedAt,
        value: game.accuracy as number,
      }));
  }
  
  /*
   * Average Centipawn Loss
   *
   * Also respects Games Included.
   * Games without a CPL value are skipped.
   */
  export function getCplTrend(
    games: StoredGame[],
    filter: DifficultyFilter
  ): TrendPoint[] {
    const filteredGames =
      games.filter(
        (game) =>
          filter[game.trainingMode]
      );
  
    const sortedGames =
      sortGamesOldestFirst(
        filteredGames
      );
  
    return sortedGames
      .filter(
        (game) =>
          game.averageCentipawnLoss !==
          null
      )
      .map((game, index) => ({
        gameNumber: index + 1,
        gameId: game.id,
        playedAt: game.playedAt,
        value:
          game.averageCentipawnLoss as number,
      }));
  }