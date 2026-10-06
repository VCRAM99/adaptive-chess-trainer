import type {
    AnalyzedMove,
  } from "./types";

  import { isForcedMove } from "./forcedMove";
  
  import type {
    ReviewedPosition,
  } from "../../hooks/usePostGameAnalysis";
  
  import {
    calculateMoveQuality,
  } from "./calculateMoveQuality";
  
  import {
    classifyMove,
  } from "./classifyMove";
  
  export function buildAnalyzedMoves(
    reviews: ReviewedPosition[]
  ): AnalyzedMove[] {
    return reviews.map((review) => {
      const { position, before, after } =
        review;
  
      const quality = calculateMoveQuality(
        before,
        after,
        position.fenBefore,
        position.fenAfter,
        position.playedBy
      );

      const forced = isForcedMove(
        position.fenBefore
      );
  
      return {
        ply: position.ply,
        san: position.san,
        uci: position.playedMoveUci,
        fenBefore: position.fenBefore,
        fenAfter: position.fenAfter,
        playedBy: position.playedBy,
      
        centipawnLoss: quality.centipawnLoss,
      
        tier:
          quality.centipawnLoss === null
            ? null
            : forced
              ? "diamond"
              : classifyMove(
                  quality.centipawnLoss
                ),
      
        bestMoveUci: quality.bestMoveUci,
        qualitySource: quality.qualitySource,
      
        isForcedMove: forced,
      };
    });
  }