import { describe, expect, it } from "vitest";

import { appRedirectUrl, publicAssetUrl } from "./basePath";

const STOCKFISH_WORKER = "stockfish/stockfish-19-lite-single.js";

describe("publicAssetUrl", () => {
  it("resolves public assets from the domain root", () => {
    expect(publicAssetUrl(STOCKFISH_WORKER, "/")).toBe("/stockfish/stockfish-19-lite-single.js");
    expect(publicAssetUrl("/pieces/modern/wK.svg", "/")).toBe("/pieces/modern/wK.svg");
    expect(publicAssetUrl("favicon.png", "/")).toBe("/favicon.png");
    expect(publicAssetUrl("images/chess-trainer-logo.png", "/")).toBe(
      "/images/chess-trainer-logo.png",
    );
  });

  it("inserts a slash when the base path has none", () => {
    expect(publicAssetUrl(STOCKFISH_WORKER, "/preview")).toBe(
      "/preview/stockfish/stockfish-19-lite-single.js",
    );
  });
});

describe("appRedirectUrl", () => {
  it("returns the trainer path on localhost", () => {
    expect(appRedirectUrl("http://127.0.0.1:5173")).toBe("http://127.0.0.1:5173/app");
    expect(appRedirectUrl("http://localhost:5173")).toBe("http://localhost:5173/app");
  });

  it("returns the trainer path on the production host without hardcoding it", () => {
    expect(appRedirectUrl("https://chess.varunsr.com")).toBe("https://chess.varunsr.com/app");
  });
});
