export type MoveTier = "diamond" | "platinum" | "gold" | "silver" | "bronze" | "steel" | "wood";

export type GameResult = "white" | "black" | "draw";

export type GameMoveRecord = {
  ply: number;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  playedBy: "white" | "black";
};

export type CompletedGameRecord = {
  id: string;
  startedAt: string;
  completedAt: string;
  result: GameResult;
  moves: GameMoveRecord[];
};

export type AnalyzedMove = GameMoveRecord & {
  centipawnLoss: number | null;
  tier: MoveTier | null;
  bestMoveUci: string | null;
  qualitySource: "centipawn" | "mate" | "unavailable";
  isForcedMove: boolean;
};
