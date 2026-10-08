import { useMemo } from "react";

import type { StoredGame } from "../../lib/profile/types";

import { calculateCareerStatistics, type DifficultyFilter } from "../../lib/profile/statistics";

type PerformanceByModeProps = {
  games: StoredGame[];
};

const MODES = [
  {
    id: "easy",
    label: "Casual",
  },
  {
    id: "medium",
    label: "Echo",
  },
  {
    id: "hard",
    label: "Train",
  },
] as const;

function PerformanceByMode({ games }: PerformanceByModeProps) {
  const modeStatistics = useMemo(
    () =>
      MODES.map((mode) => {
        const filter: DifficultyFilter = {
          easy: mode.id === "easy",
          medium: mode.id === "medium",
          hard: mode.id === "hard",
        };

        return {
          ...mode,
          statistics: calculateCareerStatistics(games, filter),
        };
      }),
    [games],
  );

  return (
    <section className="performance-by-mode">
      <div className="profile-section-heading">
        <div>
          <h2>Performance by Mode</h2>
          <p>Compare your results across training difficulties.</p>
        </div>
      </div>

      <div className="performance-mode-grid">
        {modeStatistics.map((mode) => (
          <article
            key={mode.id}
            className={`performance-mode-card ` + `performance-mode-${mode.id}`}
          >
            <div className="performance-mode-heading">
              <span className="performance-mode-dot" />
              <h3>{mode.label}</h3>
            </div>

            <strong className="performance-mode-rate">
              {mode.statistics.winRate !== null ? `${mode.statistics.winRate.toFixed(1)}%` : "N/A"}
            </strong>

            <span className="performance-mode-rate-label">Win Rate</span>

            <div className="performance-mode-record">
              <span>{mode.statistics.gamesPlayed} Games</span>

              <span>{mode.statistics.wins} Wins</span>

              <span>{mode.statistics.draws} Draws</span>

              <span>{mode.statistics.losses} Losses</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PerformanceByMode;
