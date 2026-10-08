import { ChevronDown } from "lucide-react";
import type { GameSummary } from "../lib/postGame/gameSummary";
import { formatTierName, MOVE_TIERS } from "../lib/postGame/moveTiers";
import type { AnalyzedMove } from "../lib/postGame/types";

type GameAnalysisPanelProps = {
  summary: GameSummary | null;
  selectedMove: AnalyzedMove | null;
};

export default function GameAnalysisPanel({
  summary,
  selectedMove,
}: GameAnalysisPanelProps) {
  return (
    <section className="post-game-review">
      <div className="analysis-header">
        <span className="analysis-eyebrow">
          POST-GAME REVIEW
        </span>

        <h2>Game Analysis</h2>

        <span className="analysis-perspective">
          Evaluation · White Perspective
        </span>
      </div>
      {summary && (
        <div className="game-summary">
          <div className="game-summary-main">
            <div className="analysis-stat">
              <span>Accuracy</span>

              <strong>
                {summary.accuracy !== null
                  ? `${summary.accuracy.toFixed(1)}%`
                  : "N/A"}
              </strong>
            </div>

            <div className="analysis-stat">
              <span>Avg CPL</span>

              <strong>
                {summary.averageCentipawnLoss !== null
                  ? summary.averageCentipawnLoss.toFixed(1)
                  : "N/A"}
              </strong>
            </div>
          </div>

          <details className="tier-summary">
            <summary className="tier-summary__toggle">
              <span>Move Quality</span>

              <span className="tier-summary__toggle-right">
                {summary.gradableMoves} graded

                <ChevronDown
                  className="tier-summary__chevron"
                  size={17}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
            </summary>

            <div className="tier-summary-list">
              {MOVE_TIERS.map((tier) => (
                <div
                  className={
                    `tier-summary-row ` +
                    `tier-summary-${tier}`
                  }
                  key={tier}
                >
                  <span className="tier-summary-row__name">
                    {formatTierName(tier)}
                  </span>

                  <strong>
                    {summary.tierCounts[tier]}
                  </strong>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {selectedMove && (
        <div className="review-move-details">
          <div className="review-move-header">
            <div>
              <span className="review-move-label">
                MOVE {selectedMove.ply} ·{" "}
                {selectedMove.playedBy === "white"
                  ? "WHITE"
                  : "BLACK"}
              </span>

              <h4>{selectedMove.san}</h4>
            </div>

            {selectedMove.tier && (
              <span
                className={`move-tier move-tier-${selectedMove.tier}`}
              >
                {formatTierName(selectedMove.tier)}
              </span>
            )}
          </div>

          <div className="review-move-stats">
            <span
              className="review-move-value review-move-value--played"
              data-tooltip="PLAYED MOVE"
              tabIndex={0}
            >
              {selectedMove.uci}
            </span>

            <span
              className="review-move-value review-move-value--best"
              data-tooltip="BEST MOVE"
              tabIndex={0}
            >
              {selectedMove.bestMoveUci ?? "Unavailable"}
            </span>

            <div className="review-eval-stat">
              <span>
                {selectedMove.qualitySource === "mate"
                  ? "EVAL"
                  : "CPL"}
              </span>

              <strong>
                {selectedMove.qualitySource === "centipawn" &&
                selectedMove.centipawnLoss !== null
                  ? selectedMove.centipawnLoss.toFixed(1)
                  : selectedMove.qualitySource === "mate"
                    ? "Mate"
                    : "N/A"}
              </strong>
            </div>
          </div>

          {selectedMove.isForcedMove && (
            <p className="review-move-note">
              Forced move — excluded from accuracy.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
