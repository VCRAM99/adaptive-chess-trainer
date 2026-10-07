
import type { BoardTheme } from "./types";

type BoardColors = {
  light: string;
  dark: string;
};

export const BOARD_THEMES: Record<BoardTheme, BoardColors> = {
  grey: {
    light: "#D1D5DB",
    dark: "#6B7280",
  },
  bamboo: {
    light: "#F2DEB3",
    dark: "#C49A61",
  },
  green: {
    light: "#EEEED2",
    dark: "#769656",
  },
  purple: {
    light: "#E9DDF5",
    dark: "#9274B8",
  },
};

