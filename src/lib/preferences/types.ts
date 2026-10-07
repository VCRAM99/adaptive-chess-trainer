export type AccentTheme =
  | "pink"
  | "white"
  | "purple"
  | "teal"
  | "orange";

export type UserPreferences = {
  version: 1;
  accentTheme: AccentTheme;
};