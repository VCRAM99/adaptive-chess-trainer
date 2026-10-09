// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { publicAssetUrl } from "../../lib/basePath";
import AboutSection from "./AboutSection";

describe("AboutSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("links licensing documents through the public base path", () => {
    render(<AboutSection />);

    expect(screen.getByRole("heading", { name: "About" })).toBeTruthy();
    expect(screen.getByText(/Adaptive Chess Trainer is a browser chess application/)).toBeTruthy();

    expect(
      screen.getByRole("link", { name: "Stockfish.js GNU GPLv3 license" }).getAttribute("href"),
    ).toBe(publicAssetUrl("licenses/stockfish-GPL-3.0.txt"));
    expect(
      screen.getByRole("link", { name: "Corresponding Stockfish.js source" }).getAttribute("href"),
    ).toBe(publicAssetUrl("licenses/stockfish-corresponding-source.md"));
    expect(screen.getByRole("link", { name: "Third-party licenses" }).getAttribute("href")).toBe(
      publicAssetUrl("licenses/THIRD_PARTY_LICENSES.md"),
    );
  });
});
