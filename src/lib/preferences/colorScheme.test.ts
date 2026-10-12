// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { applyColorScheme, colorSchemeFromStoredJson, resolveColorScheme } from "./colorScheme";

function mockPrefersLight(initial: boolean) {
  const state = { matches: initial };
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  vi.stubGlobal("matchMedia", (query: string) => {
    expect(query).toBe("(prefers-color-scheme: light)");

    return {
      get matches() {
        return state.matches;
      },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    };
  });

  return {
    change(next: boolean) {
      state.matches = next;
      listeners.forEach((listener) => {
        listener({ matches: next } as MediaQueryListEvent);
      });
    },
  };
}

describe("colorSchemeFromStoredJson", () => {
  it("defaults when preferences are missing or invalid", () => {
    expect(colorSchemeFromStoredJson(null)).toBe("system");
    expect(colorSchemeFromStoredJson("{")).toBe("system");
    expect(colorSchemeFromStoredJson(JSON.stringify({ colorScheme: "sepia" }))).toBe("system");
  });

  it("reads a stored scheme", () => {
    expect(colorSchemeFromStoredJson(JSON.stringify({ colorScheme: "light" }))).toBe("light");
  });
});

describe("resolveColorScheme", () => {
  it("follows the system only for the system preference", () => {
    expect(resolveColorScheme("system", true)).toBe("light");
    expect(resolveColorScheme("system", false)).toBe("dark");
    expect(resolveColorScheme("light", false)).toBe("light");
    expect(resolveColorScheme("dark", true)).toBe("dark");
  });
});

describe("applyColorScheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.colorScheme;
    document.documentElement.style.colorScheme = "";
  });

  it("updates when the operating system theme changes in system mode", () => {
    const media = mockPrefersLight(false);

    const stop = applyColorScheme("system");

    expect(document.documentElement.dataset.colorScheme).toBe("dark");

    media.change(true);

    expect(document.documentElement.dataset.colorScheme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");

    stop();
    media.change(false);

    expect(document.documentElement.dataset.colorScheme).toBe("light");
  });

  it("keeps a manual override when the operating system theme changes", () => {
    const media = mockPrefersLight(true);

    const stop = applyColorScheme("dark");

    expect(document.documentElement.dataset.colorScheme).toBe("dark");

    media.change(false);

    expect(document.documentElement.dataset.colorScheme).toBe("dark");

    stop();
  });
});
