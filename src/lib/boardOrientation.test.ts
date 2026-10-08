import { describe, expect, it } from "vitest";

import { getBoardParticipants } from "./boardOrientation";

describe("board participant orientation", () => {
  it("puts the player on the bottom when the board matches their color", () => {
    expect(
      getBoardParticipants("white", "white")
    ).toEqual({
      top: { color: "black", role: "opponent" },
      bottom: { color: "white", role: "player" },
    });

    expect(
      getBoardParticipants("black", "black")
    ).toEqual({
      top: { color: "white", role: "opponent" },
      bottom: { color: "black", role: "player" },
    });
  });

  it("keeps each participant with their color when the board is flipped", () => {
    expect(
      getBoardParticipants("white", "black")
    ).toEqual({
      top: { color: "white", role: "player" },
      bottom: { color: "black", role: "opponent" },
    });

    expect(
      getBoardParticipants("black", "white")
    ).toEqual({
      top: { color: "black", role: "player" },
      bottom: { color: "white", role: "opponent" },
    });
  });

  it("uses player color rather than treating the bottom side as the player", () => {
    const flipped = getBoardParticipants(
      "white",
      "black"
    );

    expect(flipped.bottom.role).toBe("opponent");
    expect(flipped.bottom.color).toBe("black");
    expect(flipped.top.role).toBe("player");
    expect(flipped.top.color).toBe("white");
  });
});
