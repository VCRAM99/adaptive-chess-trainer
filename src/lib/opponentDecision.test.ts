import { describe, expect, it } from "vitest";

import type { OpponentCandidate } from "./opponentMove";

import { chooseAdaptiveOpponentMove } from "./opponentDecision";

function candidate(
  move: string,
  centipawnLoss: number,
  mate: number | null = null,
): OpponentCandidate {
  return {
    rank: 1,
    move,
    evaluation: 0,
    centipawnLoss,
    mate,
  };
}

function tacticalCandidate(
  rank: number,
  centipawnLoss: number,
  evaluation: number,
): OpponentCandidate {
  return {
    rank,
    move: `move-${rank}`,
    evaluation,
    centipawnLoss,
    mate: null,
  };
}

describe("chooseAdaptiveOpponentMove", () => {
  it("returns no move when no candidates exist", () => {
    const result = chooseAdaptiveOpponentMove([], {
      targetSkill: 1200,
      opponentForm: 0,
      randomValue1: 0.5,
    });

    expect(result.candidate).toBeNull();

    expect(result.bypassedSelection).toBe(false);
  });

  it("bypasses selection when only one candidate exists", () => {
    const onlyMove = candidate("e1e2", 0);

    const result = chooseAdaptiveOpponentMove([onlyMove], {
      targetSkill: 1200,
      opponentForm: 0,
      randomValue1: 0.5,
    });

    expect(result.candidate).toEqual(onlyMove);

    expect(result.bypassedSelection).toBe(true);
  });

  it("chooses a winning mate instead of using normal weighted selection", () => {
    const input = [candidate("normal", 0), candidate("mate", 0, 2), candidate("mistake", 100)];

    const result = chooseAdaptiveOpponentMove(input, {
      targetSkill: 600,
      opponentForm: 0,
      randomValue1: 0.999,
    });

    expect(result.candidate?.move).toBe("mate");

    expect(result.bypassedSelection).toBe(true);
  });

  it("does not select a catastrophic candidate when safe alternatives exist", () => {
    const input = [candidate("best", 0), candidate("good", 20), candidate("catastrophic", 900)];

    const result = chooseAdaptiveOpponentMove(input, {
      targetSkill: 600,
      opponentForm: 0,
      randomValue1: 0.999999,
    });

    expect(result.candidate?.move).not.toBe("catastrophic");

    expect(result.bypassedSelection).toBe(false);
  });

  it("selects from the safe candidate pool during normal play", () => {
    const input = [
      candidate("excellent", 0),
      candidate("good", 20),
      candidate("inaccuracy", 50),
      candidate("mistake", 120),
    ];

    const result = chooseAdaptiveOpponentMove(input, {
      targetSkill: 1200,
      opponentForm: 0,
    });

    expect(result.candidate).not.toBeNull();

    expect(input).toContainEqual(result.candidate);

    expect(result.bypassedSelection).toBe(false);
  });

  it("chooses the shortest available winning mate", () => {
    const input = [candidate("mate5", 0, 5), candidate("mate2", 0, 2), candidate("mate4", 0, 4)];

    const result = chooseAdaptiveOpponentMove(input, {
      targetSkill: 1200,
      opponentForm: 0,
      randomValue1: 0.5,
    });

    expect(result.candidate?.move).toBe("mate2");

    expect(result.bypassedSelection).toBe(true);
  });
});

describe("tactical opponent decisions", () => {
  const tacticalCandidates = [
    tacticalCandidate(1, 0, 250),
    tacticalCandidate(2, 180, 70),
    tacticalCandidate(3, 240, 10),
  ];

  it("restricts the candidate pool when the tactic is recognized", () => {
    const decision = chooseAdaptiveOpponentMove(tacticalCandidates, {
      targetSkill: 1200,
      opponentForm: 0,
      randomValue1: 1,
      randomValue2: 0.25,
      tacticalRandomValue: 0,
    });

    expect(decision.candidate?.centipawnLoss).toBeLessThanOrEqual(40);
  });

  it("does not force tactical recognition when recognition fails", () => {
    const decision = chooseAdaptiveOpponentMove(tacticalCandidates, {
      targetSkill: 400,
      opponentForm: 0,
      randomValue1: 1,
      randomValue2: 0.25,
      tacticalRandomValue: 1,
    });

    expect(decision.candidate).not.toBeNull();

    expect(decision.bypassedSelection).toBe(false);
  });

  it("keeps normal positions on the ordinary selection path", () => {
    const normalCandidates = [
      tacticalCandidate(1, 0, 50),
      tacticalCandidate(2, 40, 10),
      tacticalCandidate(3, 80, -30),
    ];

    const decision = chooseAdaptiveOpponentMove(normalCandidates, {
      targetSkill: 1200,
      opponentForm: 0,
      randomValue1: 1,
      randomValue2: 0.25,
      tacticalRandomValue: 0,
    });

    expect(decision.candidate).not.toBeNull();

    expect(decision.bypassedSelection).toBe(false);
  });

  it("keeps winning mate bypass above tactical handling", () => {
    const candidates: OpponentCandidate[] = [
      {
        rank: 1,
        move: "mate-3",
        evaluation: 100000,
        centipawnLoss: 0,
        mate: 3,
      },
      {
        rank: 2,
        move: "mate-5",
        evaluation: 100000,
        centipawnLoss: 0,
        mate: 5,
      },
      {
        rank: 3,
        move: "other",
        evaluation: 500,
        centipawnLoss: 200,
        mate: null,
      },
    ];

    const decision = chooseAdaptiveOpponentMove(candidates, {
      targetSkill: 400,
      opponentForm: 0,
      randomValue1: 1,
      randomValue2: 0.25,
      tacticalRandomValue: 1,
    });

    expect(decision.candidate?.move).toBe("mate-3");

    expect(decision.bypassedSelection).toBe(true);
  });
});
