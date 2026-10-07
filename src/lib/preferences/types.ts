export type AccentTheme =
  | "pink"
  | "white"
  | "purple"
  | "teal"
  | "orange";

export type BoardTheme =
  | "grey"
  | "bamboo"
  | "green"
  | "purple";

  export type PieceSet =
  | "classic"
  | "modern"
  | "minimal";

export type UserPreferences = {
  version: 1;
  accentTheme: AccentTheme;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
};