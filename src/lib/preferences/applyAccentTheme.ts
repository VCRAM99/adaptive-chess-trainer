import { ACCENT_THEMES } from "./accentThemes";

import type { AccentTheme } from "./types";

export function applyAccentTheme(theme: AccentTheme): void {
  const definition = ACCENT_THEMES[theme];

  document.documentElement.style.setProperty("--accent-rgb", definition.rgb);

  document.documentElement.dataset.accent = theme;
}
