import type { AccentTheme } from "./types";

export type AccentThemeDefinition = {
  id: AccentTheme;
  label: string;
  rgb: string;
};

export const ACCENT_THEMES: Record<AccentTheme, AccentThemeDefinition> = {
  pink: {
    id: "pink",
    label: "Pink",
    rgb: "255 115 255",
  },

  white: {
    id: "white",
    label: "White",
    rgb: "255 255 255",
  },

  purple: {
    id: "purple",
    label: "Purple",
    rgb: "148 115 255",
  },

  teal: {
    id: "teal",
    label: "Teal",
    rgb: "0 194 194",
  },

  orange: {
    id: "orange",
    label: "Orange",
    rgb: "222 115 44",
  },
};
