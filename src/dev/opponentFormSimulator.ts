import {
    updateOpponentForm,
  } from "../lib/opponentForm";
  
  export type OpponentFormGameResult = {
    finalForm: number;
    averageForm: number;
    minimumForm: number;
    maximumForm: number;
    boundaryHits: number;
  };
  
  export type OpponentFormSimulationSummary = {
    games: number;
    movesPerGame: number;
    averageFinalForm: number;
    averageAbsoluteFinalForm: number;
    averageFormAcrossMoves: number;
    averageMinimumForm: number;
    averageMaximumForm: number;
    averageBoundaryHits: number;
  };
  
  export function simulateOpponentFormGame(
    moves = 40
  ): OpponentFormGameResult {
    let form = 0;
  
    const forms: number[] = [];
  
    let boundaryHits = 0;
  
    for (
      let move = 0;
      move < moves;
      move += 1
    ) {
      form =
        updateOpponentForm(form);
  
      forms.push(form);
  
      if (
        form === 50 ||
        form === -50
      ) {
        boundaryHits += 1;
      }
    }
  
    const total =
      forms.reduce(
        (sum, value) =>
          sum + value,
        0
      );
  
    return {
      finalForm:
        form,
  
      averageForm:
        total / forms.length,
  
      minimumForm:
        Math.min(...forms),
  
      maximumForm:
        Math.max(...forms),
  
      boundaryHits,
    };
  }
  
  
  export function simulateOpponentFormGames(
    games = 10_000,
    movesPerGame = 40
  ): OpponentFormSimulationSummary {
    const results: OpponentFormGameResult[] =
      [];
  
    for (
      let game = 0;
      game < games;
      game += 1
    ) {
      results.push(
        simulateOpponentFormGame(
          movesPerGame
        )
      );
    }
  
    const average = (
      values: number[]
    ) =>
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / values.length;
  
    return {
      games,
  
      movesPerGame,
  
      averageFinalForm:
        average(
          results.map(
            (result) =>
              result.finalForm
          )
        ),
  
      averageAbsoluteFinalForm:
        average(
          results.map(
            (result) =>
              Math.abs(
                result.finalForm
              )
          )
        ),
  
      averageFormAcrossMoves:
        average(
          results.map(
            (result) =>
              result.averageForm
          )
        ),
  
      averageMinimumForm:
        average(
          results.map(
            (result) =>
              result.minimumForm
          )
        ),
  
      averageMaximumForm:
        average(
          results.map(
            (result) =>
              result.maximumForm
          )
        ),
  
      averageBoundaryHits:
        average(
          results.map(
            (result) =>
              result.boundaryHits
          )
        ),
    };
  }
  
  
  export function runOpponentFormSimulation() {
    const gameLengths = [
      20,
      40,
      60,
      80,
    ];
  
    const results =
      gameLengths.map(
        (movesPerGame) =>
          simulateOpponentFormGames(
            10_000,
            movesPerGame
          )
      );
  
    console.log(
      "Opponent form simulation:"
    );
  
    console.table(
      results.map(
        (result) => ({
          moves:
            result.movesPerGame,
  
          avgFinal:
            Number(
              result.averageFinalForm
                .toFixed(1)
            ),
  
          avgAbsFinal:
            Number(
              result
                .averageAbsoluteFinalForm
                .toFixed(1)
            ),
  
          avgAcrossMoves:
            Number(
              result.averageFormAcrossMoves
                .toFixed(1)
            ),
  
          avgMin:
            Number(
              result.averageMinimumForm
                .toFixed(1)
            ),
  
          avgMax:
            Number(
              result.averageMaximumForm
                .toFixed(1)
            ),
  
          avgBoundaryHits:
            Number(
              result.averageBoundaryHits
                .toFixed(2)
            ),
        })
      )
    );
  
    return results;
  }