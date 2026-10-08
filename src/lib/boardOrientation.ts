export type BoardColor = "white" | "black";

export type BoardParticipant = {
  color: BoardColor;
  role: "player" | "opponent";
};

export type BoardParticipants = {
  top: BoardParticipant;
  bottom: BoardParticipant;
};

/**
 * Maps the visual board sides to the participants sitting there.
 * Orientation chooses which color is on top. playerColor decides
 * whether that color is the human or the adaptive opponent.
 */
export function getBoardParticipants(
  playerColor: BoardColor,
  orientation: BoardColor
): BoardParticipants {
  const topColor: BoardColor =
    orientation === "white" ? "black" : "white";
  const bottomColor: BoardColor =
    orientation === "white" ? "white" : "black";

  return {
    top: {
      color: topColor,
      role:
        topColor === playerColor
          ? "player"
          : "opponent",
    },
    bottom: {
      color: bottomColor,
      role:
        bottomColor === playerColor
          ? "player"
          : "opponent",
    },
  };
}
