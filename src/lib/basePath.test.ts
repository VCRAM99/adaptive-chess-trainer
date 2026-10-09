import { describe, expect, it } from "vitest";

import { appRedirectUrl, publicAssetUrl } from "./basePath";

const STOCKFISH_WORKER = "stockfish/stockfish-19-lite-single.js";

describe("publicAssetUrl", () => {
  it("keeps local development assets at the domain root", () => {
    expect(publicAssetUrl(STOCKFISH_WORKER, "/")).toBe("/stockfish/stockfish-19-lite-single.js");
    expect(publicAssetUrl("/pieces/modern/wK.svg", "/")).toBe("/pieces/modern/wK.svg");
    expect(publicAssetUrl("favicon.png", "/")).toBe("/favicon.png");
  });

  it("prefixes production assets with the chess app base path", () => {
    const base = "/chesstrainer/app/";

    expect(publicAssetUrl(STOCKFISH_WORKER, base)).toBe(
      "/chesstrainer/app/stockfish/stockfish-19-lite-single.js",
    );
    expect(publicAssetUrl("pieces/minimal/bQ.svg", base)).toBe(
      "/chesstrainer/app/pieces/minimal/bQ.svg",
    );
    expect(publicAssetUrl("images/chess-trainer-logo.png", base)).toBe(
      "/chesstrainer/app/images/chess-trainer-logo.png",
    );
  });

  it("inserts a slash when the base path has none", () => {
    expect(publicAssetUrl(STOCKFISH_WORKER, "/chesstrainer/app")).toBe(
      "/chesstrainer/app/stockfish/stockfish-19-lite-single.js",
    );
  });
});

describe("appRedirectUrl", () => {
  it("returns localhost for local development", () => {
    expect(appRedirectUrl("http://127.0.0.1:5173", "/")).toBe("http://127.0.0.1:5173/");
    expect(appRedirectUrl("http://localhost:5173", "/")).toBe("http://localhost:5173/");
  });

  it("returns the production app path without hardcoding a host", () => {
    expect(appRedirectUrl("https://varunsr.com", "/chesstrainer/app/")).toBe(
      "https://varunsr.com/chesstrainer/app/",
    );
  });
});
