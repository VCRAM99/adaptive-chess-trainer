import {
  createOpponentCandidates,
} from "../lib/opponentCandidateAnalysis";

import {
  getOpponentPositionContext,
  type OpponentPositionContextResult,
  type OpponentPositionContext,
} from "../lib/opponentPositionContext";

import {
  simulateSkillRange,
} from "./opponentStrengthSimulator";

import {
  analyzePosition,
} from "./realPositionStrengthSimulation";


import {
  simulateOpponentFormEffect,
} from "./opponentStrengthSimulator";

type TestPosition = {
  name: string;
  fen: string;
};


const TEST_POSITIONS: TestPosition[] = [
  {
    name: "Opening",
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  },
  {
    name: "Developing",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 3 3",
  },
  {
    name: "Developed",
    fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 5",
  },
];


type PositionSimulationRow = {
  position: string;
  context: OpponentPositionContext;
  skill: number;
  averageCpl: number;
  medianCpl: number;
  excellentPercent: number;
  goodPercent: number;
  inaccuracyPercent: number;
  mistakePercent: number;
  blunderPercent: number;
};


type PositionContextRow = {
  position: string;
  positionContext: OpponentPositionContextResult;
};


export async function runMultiPositionStrengthSimulation() {
  const rows: PositionSimulationRow[] = [];
  const contextRows: PositionContextRow[] = [];

  let openingCandidates:
  ReturnType<typeof createOpponentCandidates> = [];

  const contextComparisonRows: {
    context: OpponentPositionContext;
    skill: number;
    averageCpl: number;
    medianCpl: number;
  }[] = [];

  for (const position of TEST_POSITIONS) {
    console.log(
      `Analyzing ${position.name}...`
    );

    const analysis =
      await analyzePosition(
        position.fen
      );

    const candidates =
      createOpponentCandidates(
        analysis.candidates,
        "black",
        "black"
      );

      //temporary simulation of the opponent strength in multiple positions.  
      if (position.name === "Opening") {
        openingCandidates = candidates;
        const contexts: OpponentPositionContext[] = [
          "forced",
          "limited",
          "flexible",
          "wide",
        ];
      
        for (const context of contexts) {
          const contextResults =
            simulateSkillRange(
              candidates,
              10_000,
              "contextual-desired-cpl",
              context
            );
      
          for (const result of contextResults) {
            contextComparisonRows.push({
              context,
              skill: result.targetSkill,
              averageCpl:
                result.averageCpl,
              medianCpl:
                result.medianCpl,
            });
          }
        }
      }

    // 5.12C:
    // Measure the decision context of this
    // real position without changing gameplay.
    const positionContext =
      getOpponentPositionContext(
        candidates
      );

    contextRows.push({
      position: position.name,
      positionContext,
    });

    const results =
    simulateSkillRange(
      candidates,
      10_000,
      "contextual-desired-cpl",
      positionContext.context
    );

    for (const result of results) {
      rows.push({
        position:
          position.name,

        context:
          positionContext.context,  

        skill:
          result.targetSkill,

        averageCpl:
          result.averageCpl,

        medianCpl:
          result.medianCpl,

        excellentPercent:
          result.excellentPercent,

        goodPercent:
          result.goodPercent,

        inaccuracyPercent:
          result.inaccuracyPercent,

        mistakePercent:
          result.mistakePercent,

        blunderPercent:
          result.blunderPercent,
      });
    }
  }


  console.log(
    "Position context summary:"
  );

  console.table(
    contextRows.map((row) => ({
      position:
        row.position,

      context:
        row.positionContext.context,

      candidates:
        row.positionContext
          .candidateCount,

      plausible:
        row.positionContext
          .plausibleCandidateCount,

      bestAlternativeCpl:
        row.positionContext
          .bestAlternativeLoss,
    }))
  );


  console.log(
    "Per-position strength simulation:"
  );

  console.table(
    rows.map((row) => ({
      position:
        row.position,

      context:
        row.context,

      skill:
        row.skill,

      avgCpl:
        Number(
          row.averageCpl.toFixed(1)
        ),

      medianCpl:
        row.medianCpl,

      excellent:
        Number(
          row.excellentPercent.toFixed(1)
        ),

      good:
        Number(
          row.goodPercent.toFixed(1)
        ),

      inaccuracy:
        Number(
          row.inaccuracyPercent.toFixed(1)
        ),

      mistake:
        Number(
          row.mistakePercent.toFixed(1)
        ),

      blunder:
        Number(
          row.blunderPercent.toFixed(1)
        ),
    }))
  );


  const skills =
    Array.from(
      new Set(
        rows.map(
          (row) => row.skill
        )
      )
    ).sort(
      (a, b) => a - b
    );


  const summary =
    skills.map((skill) => {
      const skillRows =
        rows.filter(
          (row) =>
            row.skill === skill
        );

      const values =
        skillRows.map(
          (row) =>
            row.averageCpl
        );

      const average =
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / values.length;

      const minimum =
        Math.min(...values);

      const maximum =
        Math.max(...values);

      return {
        skill,

        avgAcrossPositions:
          Number(
            average.toFixed(1)
          ),

        lowestPositionAvg:
          Number(
            minimum.toFixed(1)
          ),

        highestPositionAvg:
          Number(
            maximum.toFixed(1)
          ),

        range:
          Number(
            (
              maximum -
              minimum
            ).toFixed(1)
          ),
      };
    });

    if (openingCandidates.length === 0) {
      console.warn(
        "Opening candidates were not available for form simulation."
      );
    } else {

    const formValues = [
      -50,
      -30,
      -15,
      0,
      15,
      30,
      50,
    ];
    
    const formResults =
      formValues.map((form) =>
        simulateOpponentFormEffect(
          openingCandidates,
          1200,
          "wide",
          form
        )
      );
    
    console.log(
      "Opponent form effect at target skill 1200:"
    );
    
    console.table(
      formResults.map(
        (result) => ({
          form:
            result.form,
    
          effectiveSkill:
            result.effectiveSkill,
    
          averageCpl:
            Number(
              result.averageCpl
                .toFixed(1)
            ),
    
          medianCpl:
            result.medianCpl,
        })
      )
    );

    }

    //temporary logging of the cross-position strength summary.
  console.log(
    "Cross-position strength summary:"
  );

  console.table(summary);

  //temporary logging of the same-position context comparison.
  console.log(
    "Same-position context comparison:"
  );
  
  console.table(
    contextComparisonRows.map(
      (row) => ({
        context:
          row.context,
  
        skill:
          row.skill,
  
        avgCpl:
          Number(
            row.averageCpl.toFixed(1)
          ),
  
        medianCpl:
          row.medianCpl,
      })
    )
  );

  return rows;
}