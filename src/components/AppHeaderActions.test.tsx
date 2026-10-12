// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppHeaderActions from "./AppHeaderActions";

describe("AppHeaderActions", () => {
  afterEach(() => {
    cleanup();
  });

  it("links Learn More to the discover page for a guest", () => {
    render(
      <AppHeaderActions
        showSignIn
        onSignIn={vi.fn()}
        onOpenProfile={vi.fn()}
        profileButton={<span>Profile</span>}
      />,
    );

    const learnMore = screen.getByRole("link", { name: "Learn More" });

    expect(learnMore.getAttribute("href")).toBe("/discover");
    expect(screen.getByRole("button", { name: "Sign In / Create Account" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Player profile" })).toBeTruthy();
  });

  it("keeps Learn More available when the user is signed in", () => {
    render(
      <AppHeaderActions
        showSignIn={false}
        onSignIn={vi.fn()}
        onOpenProfile={vi.fn()}
        profileButton={<span>Profile</span>}
      />,
    );

    expect(screen.getByRole("link", { name: "Learn More" }).getAttribute("href")).toBe("/discover");
    expect(screen.queryByRole("button", { name: "Sign In / Create Account" })).toBeNull();
  });
});
