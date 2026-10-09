import type { StoredGame } from "./types";

import type { DifficultyFilter } from "./statistics";

export function getRecentGames(games: StoredGame[], filter: DifficultyFilter): StoredGame[] {
  return games
    .filter((game) => filter[game.trainingMode])
    .toSorted((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
}
