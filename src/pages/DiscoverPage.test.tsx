// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DiscoverPage from "./DiscoverPage";

const GITHUB_URL = "https://github.com/VCRAM99/adaptive-chess-trainer";

describe("DiscoverPage", () => {
  afterEach(() => {
    cleanup();
    document.documentElement.dataset.colorScheme = "";
    document.documentElement.style.colorScheme = "";
  });

  it("renders the marketing sections and primary destinations", () => {
    render(<DiscoverPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Train smarter. Play stronger." }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Built to adapt to you." })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Static opponents don't grow with you." }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Every move informs the next." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Powered by Stockfish" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Meet Destrier." })).toBeTruthy();
    expect(screen.getByText("Coming Soon")).toBeTruthy();

    const playLinks = screen.getAllByRole("link", { name: "Play Now" });

    expect(playLinks.length).toBeGreaterThan(0);
    for (const link of playLinks) {
      expect(link.getAttribute("href")).toBe("/");
    }

    const githubLinks = screen.getAllByRole("link", { name: "GitHub" });

    expect(githubLinks.length).toBeGreaterThan(0);
    for (const link of githubLinks) {
      expect(link.getAttribute("href")).toBe(GITHUB_URL);
    }

    expect(screen.getByRole("link", { name: "Open the trainer" }).getAttribute("href")).toBe("/");

    const portfolio = screen.getByRole("link", { name: "Varun Ramanathan" });

    expect(portfolio.getAttribute("href")).toBe("https://varunsr.com");
    expect(portfolio.getAttribute("target")).toBe("_blank");
    expect(portfolio.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("links the sticky navigation to page sections", () => {
    render(<DiscoverPage />);

    const nav = screen.getByRole("navigation", { name: "Page sections" });

    expect(nav.querySelector('a[href="#features"]')).toBeTruthy();
    expect(nav.querySelector('a[href="#why"]')).toBeTruthy();
    expect(nav.querySelector('a[href="#system"]')).toBeTruthy();
    expect(nav.querySelector('a[href="#destrier"]')).toBeTruthy();
    expect(document.querySelector("#features")).toBeTruthy();
    expect(document.querySelector("#why")).toBeTruthy();
    expect(document.querySelector("#system")).toBeTruthy();
    expect(document.querySelector("#destrier")).toBeTruthy();
  });

  it("stays dark without changing the saved application appearance", () => {
    document.documentElement.dataset.colorScheme = "light";
    document.documentElement.style.colorScheme = "light";
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<DiscoverPage />);

    expect(document.querySelector(".discover")?.getAttribute("data-marketing-theme")).toBe("dark");
    expect(document.documentElement.dataset.colorScheme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(setItem).not.toHaveBeenCalled();

    setItem.mockRestore();
  });
});
