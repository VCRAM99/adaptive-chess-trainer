import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import type {
    OpponentCandidate,
  } from "./opponentMove";
  
  import {
    chooseOpponentMove,
    getCandidateProbability,
    selectWeightedOpponentMove,
    weightOpponentCandidates,
  } from "./opponentMoveSelector";


  const candidates: OpponentCandidate[] = [
    {
      rank: 1,
      move: "e7e5",
      evaluation: -17,
      centipawnLoss: 0,
      mate: null,
    },
    {
      rank: 2,
      move: "e7e6",
      evaluation: -27,
      centipawnLoss: 10,
      mate: null,
    },
    {
      rank: 3,
      move: "c7c5",
      evaluation: -41,
      centipawnLoss: 24,
      mate: null,
    },
    {
      rank: 4,
      move: "b8c6",
      evaluation: -54,
      centipawnLoss: 37,
      mate: null,
    },
    {
      rank: 5,
      move: "b8a6",
      evaluation: -108,
      centipawnLoss: 91,
      mate: null,
    },
    {
      rank: 6,
      move: "f7f5",
      evaluation: -206,
      centipawnLoss: 189,
      mate: null,
    },
  ];

describe(
"weightOpponentCandidates",
() => {
    it("classifies candidates by CPL", () => {
    const weighted =
        weightOpponentCandidates(
        candidates,
        1200
        );

    expect(
        weighted.map(
        (item) => item.quality
        )
    ).toEqual([
        "excellent",
        "excellent",
        "good",
        "inaccuracy",
        "mistake",
        "blunder",
    ]);
    });
    it("divides category weight across candidates in the same category", () => {
    const weighted =
        weightOpponentCandidates(
        candidates,
        1200
        );
    
    const excellent =
        weighted.filter(
        (item) =>
            item.quality ===
            "excellent"
        );
    
    expect(excellent).toHaveLength(2);
    
    expect(
        excellent[0].weight
    ).toBeCloseTo(
        excellent[1].weight
    );
    });
    it("gives excellent moves more weight at higher skill", () => {
    const low =
        weightOpponentCandidates(
        candidates,
        600
        );
    
    const high =
        weightOpponentCandidates(
        candidates,
        2200
        );
    
    const lowExcellent =
        low
        .filter(
            (item) =>
            item.quality ===
            "excellent"
        )
        .reduce(
            (sum, item) =>
            sum + item.weight,
            0
        );
    
    const highExcellent =
        high
        .filter(
            (item) =>
            item.quality ===
            "excellent"
        )
        .reduce(
            (sum, item) =>
            sum + item.weight,
            0
        );
    
    expect(
        highExcellent
    ).toBeGreaterThan(
        lowExcellent
    );
    });
    it("gives blunders less weight at higher skill", () => {
    const low =
        weightOpponentCandidates(
        candidates,
        600
        );
    
    const high =
        weightOpponentCandidates(
        candidates,
        2200
        );
    
    const lowBlunder =
        low.find(
        (item) =>
            item.quality ===
            "blunder"
        );
    
    const highBlunder =
        high.find(
        (item) =>
            item.quality ===
            "blunder"
        );
    
    expect(
        highBlunder!.weight
    ).toBeLessThan(
        lowBlunder!.weight
    );
    });

    
    
}
);

describe(
    "selectWeightedOpponentMove",
    () => {
      it("returns null for no candidates", () => {
        expect(
          selectWeightedOpponentMove(
            [],
            0.5
          )
        ).toBeNull();
      });
  
      it("selects the first weighted candidate at random value zero", () => {
        const weighted =
          weightOpponentCandidates(
            candidates,
            1200
          );
  
        const selected =
          selectWeightedOpponentMove(
            weighted,
            0
          );
  
        expect(selected).toEqual(
          candidates[0]
        );
      });
    }
  );

  describe(
    "chooseOpponentMove",
    () => {
      it("returns null when no candidates exist", () => {
        expect(
          chooseOpponentMove(
            [],
            1200,
            0.5
          )
        ).toBeNull();
      });
  
      it("chooses from the provided candidates", () => {
        const selected =
          chooseOpponentMove(
            candidates,
            1200,
            0.5
          );
  
        expect(
          candidates
        ).toContainEqual(
          selected
        );
      });
      it("produces probabilities that sum to one", () => {
        const weighted =
          weightOpponentCandidates(
            candidates,
            1200
          );
      
        const totalProbability =
          weighted.reduce(
            (sum, item) =>
              sum +
              getCandidateProbability(
                item,
                weighted
              ),
            0
          );
      
        expect(
          totalProbability
        ).toBeCloseTo(1);
      });
    }
  );