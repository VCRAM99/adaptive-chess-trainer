import type { ColorScheme } from "./types";

export type ResolvedColorScheme = "light" | "dark";

const COLOR_SCHEMES: ColorScheme[] = ["system", "light", "dark"];

export function isColorScheme(value: unknown): value is ColorScheme {
  return typeof value === "string" && COLOR_SCHEMES.includes(value as ColorScheme);
}

/** Reads only the interface theme from stored JSON. Missing or invalid values are system. */
export function colorSchemeFromStoredJson(raw: string | null): ColorScheme {
  if (!raw) return "system";

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) return "system";

    const scheme = (parsed as { colorScheme?: unknown }).colorScheme;

    return isColorScheme(scheme) ? scheme : "system";
  } catch {
    return "system";
  }
}

export function resolveColorScheme(
  scheme: ColorScheme,
  prefersLight: boolean,
): ResolvedColorScheme {
  if (scheme === "light" || scheme === "dark") return scheme;

  return prefersLight ? "light" : "dark";
}

export function applyColorScheme(scheme: ColorScheme): () => void {
  const media = window.matchMedia("(prefers-color-scheme: light)");

  const apply = () => {
    const resolved = resolveColorScheme(scheme, media.matches);

    document.documentElement.dataset.colorScheme = resolved;
    document.documentElement.style.colorScheme = resolved;
  };

  apply();

  if (scheme !== "system") return () => undefined;

  media.addEventListener("change", apply);

  return () => {
    media.removeEventListener("change", apply);
  };
}
