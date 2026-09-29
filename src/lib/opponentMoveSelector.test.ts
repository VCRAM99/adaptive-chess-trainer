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
    getCentipawnLossSpread,
    getCentipawnLossWeight,
    getTargetCentipawnLoss,
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
    it("prefers higher CPL at lower skill", () => {
      const lowSkillTarget =
        getTargetCentipawnLoss(600);
    
      const highSkillTarget =
        getTargetCentipawnLoss(2200);
    
      expect(
        lowSkillTarget
      ).toBeGreaterThan(
        highSkillTarget
      );
    });
    it("moves the preferred CPL toward zero as skill increases", () => {
      expect(
        getTargetCentipawnLoss(400)
      ).toBeCloseTo(100);
    
      expect(
        getTargetCentipawnLoss(2400)
      ).toBeCloseTo(0);
    
      expect(
        getTargetCentipawnLoss(1200)
      ).toBeCloseTo(60);
    });
    it("uses a wider CPL spread at lower skill", () => {
      const lowSkillSpread =
        getCentipawnLossSpread(600);
    
      const highSkillSpread =
        getCentipawnLossSpread(2200);
    
      expect(
        lowSkillSpread
      ).toBeGreaterThan(
        highSkillSpread
      );
    });
    it("clamps CPL curve settings outside the supported skill range", () => {
      expect(
        getTargetCentipawnLoss(100)
      ).toBeCloseTo(
        getTargetCentipawnLoss(400)
      );
    
      expect(
        getTargetCentipawnLoss(3000)
      ).toBeCloseTo(
        getTargetCentipawnLoss(2400)
      );
    
      expect(
        getCentipawnLossSpread(100)
      ).toBeCloseTo(
        getCentipawnLossSpread(400)
      );
    
      expect(
        getCentipawnLossSpread(3000)
      ).toBeCloseTo(
        getCentipawnLossSpread(2400)
      );
    });
    it("gives more weight to CPL near the preferred loss", () => {
      const targetSkill = 1200;
    
      const preferredLoss =
        getTargetCentipawnLoss(
          targetSkill
        );
    
      const preferredWeight =
        getCentipawnLossWeight(
          preferredLoss,
          targetSkill
        );
    
      const perfectWeight =
        getCentipawnLossWeight(
          0,
          targetSkill
        );
    
      const largeErrorWeight =
        getCentipawnLossWeight(
          180,
          targetSkill
        );
    
      expect(
        preferredWeight
      ).toBeGreaterThan(
        perfectWeight
      );
    
      expect(
        preferredWeight
      ).toBeGreaterThan(
        largeErrorWeight
      );
    });
    it("does not create a weight cliff at quality boundaries", () => {
      const weightAt10 =
        getCentipawnLossWeight(
          10,
          1200
        );
    
      const weightAt11 =
        getCentipawnLossWeight(
          11,
          1200
        );
    
      expect(
        Math.abs(
          weightAt10 -
          weightAt11
        )
      ).toBeLessThan(0.02);
    });

    it("gives perfect moves more weight as skill increases", () => {
      const lowSkillWeight =
        getCentipawnLossWeight(
          0,
          600
        );
    
      const highSkillWeight =
        getCentipawnLossWeight(
          0,
          2200
        );
    
      expect(
        highSkillWeight
      ).toBeGreaterThan(
        lowSkillWeight
      );
    });
    it("gives large errors less weight as skill increases", () => {
      const lowSkillWeight =
        getCentipawnLossWeight(
          150,
          600
        );
    
      const highSkillWeight =
        getCentipawnLossWeight(
          150,
          2200
        );
    
      expect(
        highSkillWeight
      ).toBeLessThan(
        lowSkillWeight
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