export type ReviewArrow = {
    from: string;
    to: string;
    color: string;
  };
  
  function uciToArrow(
    uci: string | null,
    color: string
  ): ReviewArrow | null {
    if (!uci || uci.length < 4) {
      return null;
    }
  
    return {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      color,
    };
  }
  
  export function createReviewArrows(
    playedMoveUci: string,
    bestMoveUci: string | null
  ): ReviewArrow[] {
    const playedArrow = uciToArrow(
      playedMoveUci,
      "#3b82f6"
    );
  
    const bestArrow = uciToArrow(
      bestMoveUci,
      "#22c55e"
    );
  
    const arrows: ReviewArrow[] = [];
  
    if (playedArrow) {
      arrows.push(playedArrow);
    }
  
    if (
      bestArrow &&
      bestMoveUci?.toLowerCase() !==
        playedMoveUci.toLowerCase()
    ) {
      arrows.push(bestArrow);
    }
  
    return arrows;
  }