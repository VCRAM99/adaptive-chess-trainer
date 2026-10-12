// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import DiscoverPage from "./DiscoverPage";

describe("DiscoverPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("links to the chess trainer", () => {
    render(<DiscoverPage />);

    expect(screen.getByRole("heading", { name: "Adaptive Chess Trainer" })).toBeTruthy();
    expect(screen.getByText("Discover page coming soon.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Launch App" }).getAttribute("href")).toBe("/app");
  });
});
