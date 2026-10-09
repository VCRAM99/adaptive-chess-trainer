import type { StoredGame, StoredMoveTiers } from "./types";

export type DifficultyFilter = {
  easy: boolean;
  medium: boolean;
  hard: boolean;
};

export type CareerStatistics = {
  gamesPlayed: number;

  wins: number;
  losses: number;
  draws: number;

  winRate: number | null;

  averageAccuracy: number | null;
  averageCentipawnLoss: number | null;

  whiteGames: number;
  whiteWins: number;
  whiteLosses: number;
  whiteDraws: number;

  blackGames: number;
  blackWins: number;
  blackLosses: number;
  blackDraws: number;

  moveTiers: StoredMoveTiers;
};

export const DEFAULT_DIFFICULTY_FILTER: DifficultyFilter = {
  easy: true,
  medium: true,
  hard: true,
};

function createEmptyTierCounts(): StoredMoveTiers {
  return {
    diamond: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
    steel: 0,
    wood: 0,
  };
}

export function filterGamesByDifficulty(
  games: StoredGame[],
  filter: DifficultyFilter,
): StoredGame[] {
  return games.filter((game) => {
    return filter[game.trainingMode];
  });
}

export function calculateCareerStatistics(
  games: StoredGame[],
  filter: DifficultyFilter = DEFAULT_DIFFICULTY_FILTER,
): CareerStatistics {
  const filteredGames = filterGamesByDifficulty(games, filter);

  const wins = filteredGames.filter((game) => game.result === "win").length;

  const losses = filteredGames.filter((game) => game.result === "loss").length;

  const draws = filteredGames.filter((game) => game.result === "draw").length;

  const gamesWithAccuracy = filteredGames.filter((game) => game.accuracy !== null);

  const gamesWithCpl = filteredGames.filter((game) => game.averageCentipawnLoss !== null);

  const averageAccuracy =
    gamesWithAccuracy.length > 0
      ? gamesWithAccuracy.reduce((total, game) => total + (game.accuracy ?? 0), 0) /
        gamesWithAccuracy.length
      : null;

  const averageCentipawnLoss =
    gamesWithCpl.length > 0
      ? gamesWithCpl.reduce((total, game) => total + (game.averageCentipawnLoss ?? 0), 0) /
        gamesWithCpl.length
      : null;

  const whiteGames = filteredGames.filter((game) => game.playerColor === "white");

  const blackGames = filteredGames.filter((game) => game.playerColor === "black");

  const moveTiers = createEmptyTierCounts();

  for (const game of filteredGames) {
    moveTiers.diamond += game.moveTiers.diamond;

    moveTiers.platinum += game.moveTiers.platinum;

    moveTiers.gold += game.moveTiers.gold;

    moveTiers.silver += game.moveTiers.silver;

    moveTiers.bronze += game.moveTiers.bronze;

    moveTiers.steel += game.moveTiers.steel;

    moveTiers.wood += game.moveTiers.wood;
  }

  return {
    gamesPlayed: filteredGames.length,

    wins,
    losses,
    draws,

    winRate: filteredGames.length > 0 ? (wins / filteredGames.length) * 100 : null,

    averageAccuracy,
    averageCentipawnLoss,

    whiteGames: whiteGames.length,

    whiteWins: whiteGames.filter((game) => game.result === "win").length,

    whiteLosses: whiteGames.filter((game) => game.result === "loss").length,

    whiteDraws: whiteGames.filter((game) => game.result === "draw").length,

    blackGames: blackGames.length,

    blackWins: blackGames.filter((game) => game.result === "win").length,

    blackLosses: blackGames.filter((game) => game.result === "loss").length,

    blackDraws: blackGames.filter((game) => game.result === "draw").length,

    moveTiers,
  };
}
