import { Chess } from "chess.js";
import {
  describe,
  expect,
  it,
} from "vitest";

import { isForcedMove } from "./forcedMove";

describe("isForcedMove", () => {
  it("returns false in the starting position", () => {
    const game = new Chess();

    expect(
      isForcedMove(game.fen())
    ).toBe(false);
  });
  it("detects a position with exactly one legal move", () => {
    const game = new Chess(
      "7k/5K2/8/6Q1/8/8/8/8 b - - 0 1"
    );
  
    expect(game.moves()).toEqual(["Kh7"]);
    expect(isForcedMove(game.fen())).toBe(true);
  });
});