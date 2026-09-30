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
    chooseOpponentMoveByDesiredCpl,
    sampleDesiredCentipawnLoss,
    selectCandidateNearestCpl,
    sampleContextualDesiredCentipawnLoss,
    sampleFormAdjustedDesiredCentipawnLoss,
    chooseOpponentMoveByFormAdjustedDesiredCpl,
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

  describe(
    "desired-CPL opponent selection",
    () => {
      it(
        "selects the candidate nearest the desired CPL",
        () => {
          const selected =
            selectCandidateNearestCpl(
              candidates,
              35
            );
  
          expect(
            selected?.centipawnLoss
          ).toBe(37);
        }
      );
  
      it(
        "returns null for an empty candidate list",
        () => {
          expect(
            selectCandidateNearestCpl(
              [],
              50
            )
          ).toBeNull();
        }
      );
  
      it(
        "returns the only candidate when one exists",
        () => {
          const onlyCandidate = [
            candidates[0],
          ];
  
          expect(
            chooseOpponentMoveByDesiredCpl(
              onlyCandidate,
              1200,
              0.5,
              0.5
            )
          ).toBe(
            candidates[0]
          );
        }
      );
  
      it(
        "never samples a negative CPL",
        () => {
          const sampled =
            sampleDesiredCentipawnLoss(
              2400,
              0.5,
              0.5
            );
  
          expect(sampled)
            .toBeGreaterThanOrEqual(0);
        }
      );
  
      it(
        "can choose from a normal candidate pool",
        () => {
          const selected =
            chooseOpponentMoveByDesiredCpl(
              candidates,
              1200,
              0.5,
              0.5
            );
  
          expect(candidates)
            .toContain(selected);
        }
      );
    }
  );

  describe(
    "sampleContextualDesiredCentipawnLoss",
    () => {
      it("uses a lower centered target in forced positions", () => {
        const forced =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "forced",
            1,
            0.25
          );
      
        const wide =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "wide",
            1,
            0.25
          );
      
        expect(forced).toBeLessThan(wide);
      });
      
      it("uses a lower centered target in limited positions", () => {
        const limited =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "limited",
            1,
            0.25
          );
      
        const wide =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "wide",
            1,
            0.25
          );
      
        expect(limited).toBeLessThan(wide);
      });
      
      it("uses a lower centered target in flexible positions", () => {
        const flexible =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "flexible",
            1,
            0.25
          );
      
        const wide =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "wide",
            1,
            0.25
          );
      
        expect(flexible).toBeLessThan(wide);
      });
  
      it("preserves the full model for wide positions", () => {
        const contextual =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "wide",
            0.25,
            0.75
          );
  
        const normal =
          sampleDesiredCentipawnLoss(
            1200,
            0.25,
            0.75
          );
  
        expect(contextual).toBeCloseTo(
          normal
        );
      });
  
      it("never returns a negative CPL", () => {
        const result =
          sampleContextualDesiredCentipawnLoss(
            1200,
            "limited",
            0.99,
            0.5
          );
  
        expect(result).toBeGreaterThanOrEqual(
          0
        );
      });
    }
  );

  describe("sampleFormAdjustedDesiredCentipawnLoss", () => {
    it("leaves neutral form unchanged", () => {
      const base =
        sampleContextualDesiredCentipawnLoss(
          1200,
          "wide",
          1,
          0.25
        );
  
      const adjusted =
        sampleFormAdjustedDesiredCentipawnLoss(
          1200,
          "wide",
          0,
          1,
          0.25
        );
  
      expect(adjusted).toBe(base);
    });
  
    it("increases desired loss during weak form", () => {
      const neutral =
        sampleFormAdjustedDesiredCentipawnLoss(
          1200,
          "wide",
          0,
          1,
          0.25
        );
  
      const weak =
        sampleFormAdjustedDesiredCentipawnLoss(
          1200,
          "wide",
          -50,
          1,
          0.25
        );
  
      expect(weak).toBeGreaterThan(neutral);
    });
  
    it("decreases desired loss during strong form", () => {
      const neutral =
        sampleFormAdjustedDesiredCentipawnLoss(
          1200,
          "wide",
          0,
          1,
          0.25
        );
  
      const strong =
        sampleFormAdjustedDesiredCentipawnLoss(
          1200,
          "wide",
          50,
          1,
          0.25
        );
  
      expect(strong).toBeLessThan(neutral);
    });
  
    it("never returns a negative desired loss", () => {
      const result =
        sampleFormAdjustedDesiredCentipawnLoss(
          2400,
          "forced",
          50,
          1,
          0.25
        );
  
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe("chooseOpponentMoveByFormAdjustedDesiredCpl", () => {
    const candidates = [
      {
        rank: 1,
        move: "move-a",
        evaluation: 0,
        centipawnLoss: 0,
        mate: null,
      },
      {
        rank: 2,
        move: "move-b",
        evaluation: 0,
        centipawnLoss: 60,
        mate: null,
      },
      {
        rank: 3,
        move: "move-c",
        evaluation: 0,
        centipawnLoss: 100,
        mate: null,
      },
    ];
  
    it("returns null for an empty candidate list", () => {
      expect(
        chooseOpponentMoveByFormAdjustedDesiredCpl(
          [],
          1200,
          "wide",
          0,
          1,
          0.25
        )
      ).toBeNull();
    });
  
    it("allows form to affect candidate selection", () => {
      const weak =
        chooseOpponentMoveByFormAdjustedDesiredCpl(
          candidates,
          1200,
          "wide",
          -50,
          1,
          0.25
        );
  
      const strong =
        chooseOpponentMoveByFormAdjustedDesiredCpl(
          candidates,
          1200,
          "wide",
          50,
          1,
          0.25
        );
  
      expect(weak).not.toBeNull();
      expect(strong).not.toBeNull();
  
      expect(
        weak!.centipawnLoss
      ).toBeGreaterThanOrEqual(
        strong!.centipawnLoss
      );
    });
  });