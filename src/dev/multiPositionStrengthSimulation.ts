import {
    createOpponentCandidates,
  } from "../lib/opponentCandidateAnalysis";
  
  import {
    simulateSkillRange,
  } from "./opponentStrengthSimulator";
  
  import {
    analyzePosition,
  } from "./realPositionStrengthSimulation";
  
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
    skill: number;
    averageCpl: number;
    medianCpl: number;
    excellentPercent: number;
    goodPercent: number;
    inaccuracyPercent: number;
    mistakePercent: number;
    blunderPercent: number;
  };
  
  export async function runMultiPositionStrengthSimulation() {
    const rows: PositionSimulationRow[] = [];
  
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
  
      const results =
        simulateSkillRange(
          candidates,
          10_000,
          "desired-cpl"
        );
  
      for (const result of results) {
        rows.push({
          position:
            position.name,
  
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
  
    console.table(
      rows.map((row) => ({
        position:
          row.position,
  
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

    console.log(
    "Cross-position strength summary:"
    );

    console.table(summary);
  
    return rows;
  }