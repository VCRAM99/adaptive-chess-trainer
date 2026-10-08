// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { GameSummary } from "../lib/postGame/gameSummary";
import type { AnalyzedMove, MoveTier } from "../lib/postGame/types";
import GameAnalysisPanel from "./GameAnalysisPanel";

const tierCounts: GameSummary["tierCounts"] = {
  diamond: 1,
  platinum: 2,
  gold: 3,
  silver: 4,
  bronze: 5,
  steel: 6,
  wood: 7,
};

function createSummary(
  overrides: Partial<GameSummary> = {}
): GameSummary {
  return {
    accuracy: 87.5,
    averageCentipawnLoss: 12.3,
    tierCounts,
    totalPlayerMoves: 28,
    gradableMoves: 28,
    forcedMoves: 1,
    bestMove: null,
    biggestMistake: null,
    ...overrides,
  };
}

function createMove(
  overrides: Partial<AnalyzedMove> = {}
): AnalyzedMove {
  return {
    ply: 7,
    san: "Nf3",
    uci: "g1f3",
    fenBefore: "start",
    fenAfter: "after",
    playedBy: "white",
    centipawnLoss: 14.2,
    tier: "gold",
    bestMoveUci: "e2e4",
    qualitySource: "centipawn",
    isForcedMove: false,
    ...overrides,
  };
}

describe("GameAnalysisPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows accuracy, average centipawn loss, and all seven tiers", () => {
    render(
      <GameAnalysisPanel
        summary={createSummary()}
        selectedMove={null}
      />
    );

    expect(screen.getByText("87.5%")).toBeTruthy();
    expect(screen.getByText("12.3")).toBeTruthy();
    expect(screen.getByText("28 graded")).toBeTruthy();

    const labels = [
      "Diamond",
      "Platinum",
      "Gold",
      "Silver",
      "Bronze",
      "Steel",
      "Wood",
    ];

    for (const [index, label] of labels.entries()) {
      const name = screen.getByText(label);
      expect(name.className).toBe("tier-summary-row__name");
      expect(name.nextElementSibling?.textContent).toBe(
        String(index + 1)
      );
      expect(name.parentElement?.className).toContain(
        `tier-summary-${label.toLowerCase()}`
      );
    }
  });

  it("shows N/A when accuracy and centipawn loss are unavailable", () => {
    render(
      <GameAnalysisPanel
        summary={createSummary({
          accuracy: null,
          averageCentipawnLoss: null,
        })}
        selectedMove={null}
      />
    );

    expect(screen.getAllByText("N/A")).toHaveLength(2);
  });

  it("shows the selected move tier, played move, and best move", () => {
    render(
      <GameAnalysisPanel
        summary={createSummary()}
        selectedMove={createMove()}
      />
    );

    expect(screen.getByText("MOVE 7 · WHITE")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Nf3" })).toBeTruthy();
    expect(
      screen.getByText("Gold", { selector: ".move-tier" }).className
    ).toContain("move-tier-gold");
    expect(screen.getByText("g1f3")).toBeTruthy();
    expect(screen.getByText("e2e4")).toBeTruthy();
    expect(screen.getByText("CPL")).toBeTruthy();
    expect(screen.getByText("14.2")).toBeTruthy();
    expect(screen.queryByText(/Forced move/)).toBeNull();
  });

  it("shows the forced-move note and a mate evaluation", () => {
    render(
      <GameAnalysisPanel
        summary={null}
        selectedMove={createMove({
          playedBy: "black",
          san: "Qh4#",
          uci: "d8h4",
          tier: "diamond" satisfies MoveTier,
          bestMoveUci: null,
          qualitySource: "mate",
          centipawnLoss: null,
          isForcedMove: true,
        })}
      />
    );

    expect(screen.getByText("MOVE 7 · BLACK")).toBeTruthy();
    expect(screen.getByText("Diamond").className).toContain(
      "move-tier-diamond"
    );
    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByText("EVAL")).toBeTruthy();
    expect(screen.getByText("Mate")).toBeTruthy();
    expect(
      screen.getByText("Forced move — excluded from accuracy.")
    ).toBeTruthy();
    expect(screen.queryByText("Accuracy")).toBeNull();
  });

  it("shows only the review heading while analysis is still unavailable", () => {
    render(
      <GameAnalysisPanel summary={null} selectedMove={null} />
    );

    expect(screen.getByText("POST-GAME REVIEW")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Game Analysis" })
    ).toBeTruthy();
    expect(screen.queryByText("Accuracy")).toBeNull();
    expect(screen.queryByText("Move Quality")).toBeNull();
    expect(screen.queryByText(/MOVE /)).toBeNull();
  });

  it("shows N/A when the selected move has no centipawn result", () => {
    render(
      <GameAnalysisPanel
        summary={null}
        selectedMove={createMove({
          tier: null,
          bestMoveUci: null,
          centipawnLoss: null,
          qualitySource: "unavailable",
        })}
      />
    );

    expect(screen.getByText("Unavailable")).toBeTruthy();
    expect(screen.getByText("N/A")).toBeTruthy();
    expect(screen.queryByText("Gold")).toBeNull();
  });
});
