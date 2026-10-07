import { useEffect, useState } from "react";

import ChessBoard from "./ChessBoard";

import type {
  BoardTheme,
  PieceSet,
} from "../lib/preferences/types";

import {
  compareReviewMove,
} from "../lib/postGame/reviewMoveComparison";

import type {
  CompletedGameRecord,
  AnalyzedMove,
} from "../lib/postGame/types";

import {
  getReviewMoveLabel,
} from "../lib/postGame/reviewMoveLabel";

import {
  clampReviewPly,
  getNextReviewPly,
  getPreviousReviewPly,
  getReviewFen,
} from "../lib/postGame/reviewNavigation";

type PostGameReviewProps = {
  game: CompletedGameRecord;
  analyzedMoves: AnalyzedMove[];
  orientation: "white" | "black";
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
};

function formatTier(
  tier: AnalyzedMove["tier"]
): string {
  if (!tier) {
    return "Unavailable";
  }

  return (
    tier.charAt(0).toUpperCase() +
    tier.slice(1)
  );
}

function PostGameReview({
  game,
  analyzedMoves,
  orientation,
  boardTheme, 
  pieceSet,
}: PostGameReviewProps) {
  const totalMoves = game.moves.length;

  const [selectedPly, setSelectedPly] =
    useState(totalMoves);


    useEffect(() => {
      setSelectedPly(totalMoves);
    }, [game.id, totalMoves]);

  const safePly = clampReviewPly(
    selectedPly,
    totalMoves
  );

  const selectedMove =
  safePly === 0
    ? null
    : analyzedMoves[safePly - 1] ?? null;

  const position =
    selectedMove
      ? selectedMove.fenBefore
      : getReviewFen(game, 0);

  const moveComparison =
    selectedMove
      ? compareReviewMove(
          selectedMove.uci,
          selectedMove.bestMoveUci
        )
      : "unavailable";

    function previous() {
      setSelectedPly((current) =>
        getPreviousReviewPly(
          current,
          totalMoves
        )
      );
    }

    function next() {
      setSelectedPly((current) =>
        getNextReviewPly(
          current,
          totalMoves
        )
      );
    }

    function goToStart() {
      setSelectedPly(0);
    }
    
    function goToEnd() {
      setSelectedPly(totalMoves);
    }

  function blockReviewMove() {
    return false;
  }

  function selectMove(ply: number) {
    setSelectedPly(
      clampReviewPly(
        ply,
        totalMoves
      )
    );
  
  }

  return (
    <section className="post-game-review">
      <h2>Post-Game Review</h2>

      <p>
        Result: {game.result}
      </p>

      {position && (
        <ChessBoard
          position={position}
          orientation={orientation}
          boardTheme={boardTheme}
          pieceSet={pieceSet}
          onMove={blockReviewMove}
        />
      )}

      <div className="review-navigation">
        <button
          type="button"
          onClick={goToStart}
          disabled={safePly === 0}
        >
          Start
        </button>

        <button
          type="button"
          onClick={previous}
          disabled={safePly === 0}
        >
          Previous
        </button>

        <span aria-live="polite">
          {safePly === 0
            ? "Starting position"
            : `${safePly} / ${totalMoves}`}
        </span>

        <button
          type="button"
          onClick={next}
          disabled={safePly === totalMoves}
        >
          Next
        </button>

        <button
          type="button"
          onClick={goToEnd}
          disabled={safePly === totalMoves}
        >
          End
        </button>
      </div>

      <div className="review-move-history">
        <h3>Moves</h3>

        <div className="review-move-list">
          {analyzedMoves.map((move) => (
            <button
              key={move.ply}
              type="button"
              onClick={() =>
                selectMove(move.ply)
              }
              aria-pressed={
                safePly === move.ply
              }
            >
              {getReviewMoveLabel(move)}
              {" — "}
              {formatTier(move.tier)}
            </button>
          ))}
        </div>
      </div>

      {safePly === 0 && (
        <div className="review-move-details">
          <h3>Starting Position</h3>
        </div>
      )}

      {selectedMove && (
        
        <div className="review-move-details">
          <h3>
            {getReviewMoveLabel(selectedMove)}
          </h3>
          <p>
            Position before this move
          </p>

          <div
            className={
              selectedMove.tier
                ? `review-tier review-tier-${selectedMove.tier}`
                : "review-tier"
            }
          >
            {formatTier(selectedMove.tier)}
          </div>

          <p>
            Centipawn loss:{" "}
            {selectedMove.centipawnLoss ??
              "Unavailable"}
          </p>

          <div className="review-move-comparison">
            <p>
              Played move:{" "}
              <strong>
                {selectedMove.uci}
              </strong>
            </p>

            <p>
              Best move:{" "}
              <strong>
                {selectedMove.bestMoveUci ??
                  "Unavailable"}
              </strong>
            </p>

            {moveComparison === "best" && (
              <p>
                You played Stockfish's top move.
              </p>
            )}

            {moveComparison === "different" && (
              <p>
                Stockfish preferred a different move.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default PostGameReview;