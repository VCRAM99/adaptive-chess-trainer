import { useMemo, useState } from "react";

import type { StoredGame } from "../../lib/profile/types";

import type { DifficultyFilter } from "../../lib/profile/statistics";

import { getAccuracyTrend, getCplTrend, getRatingTrend } from "../../lib/profile/trends";

import TrendChart from "./TrendChart";

type ProgressSectionProps = {
  games: StoredGame[];
  difficultyFilter: DifficultyFilter;
};

type ProgressMetric = "rating" | "accuracy" | "cpl";

const METRICS: {
  id: ProgressMetric;
  label: string;
}[] = [
  {
    id: "rating",
    label: "Rating",
  },
  {
    id: "accuracy",
    label: "Accuracy",
  },
  {
    id: "cpl",
    label: "Avg CPL",
  },
];

function ProgressSection({ games, difficultyFilter }: ProgressSectionProps) {
  const [selectedMetric, setSelectedMetric] = useState<ProgressMetric>("rating");

  const ratingPoints = useMemo(() => getRatingTrend(games), [games]);

  const accuracyPoints = useMemo(
    () => getAccuracyTrend(games, difficultyFilter),
    [games, difficultyFilter],
  );

  const cplPoints = useMemo(() => getCplTrend(games, difficultyFilter), [games, difficultyFilter]);

  const selectedPoints =
    selectedMetric === "rating"
      ? ratingPoints
      : selectedMetric === "accuracy"
        ? accuracyPoints
        : cplPoints;

  const averageValue =
    selectedPoints.length > 0
      ? selectedPoints.reduce((total, point) => total + point.value, 0) / selectedPoints.length
      : null;

  const currentRating =
    ratingPoints.length > 0 ? ratingPoints[ratingPoints.length - 1].value : null;

  const peakRating =
    ratingPoints.length > 0 ? Math.max(...ratingPoints.map((point) => point.value)) : null;

  return (
    <section className="profile-progress">
      <div className="profile-section-heading">
        <div>
          <h2>Performance Trends</h2>

          <p>Track how your play changes across completed games.</p>
        </div>
      </div>

      <div className="progress-metric-selector" role="group" aria-label="Progress metric">
        {METRICS.map((metric) => (
          <button
            key={metric.id}
            type="button"
            className={
              selectedMetric === metric.id
                ? "progress-metric-button progress-metric-button-active"
                : "progress-metric-button"
            }
            aria-pressed={selectedMetric === metric.id}
            onClick={() => setSelectedMetric(metric.id)}
          >
            {metric.label}
          </button>
        ))}
      </div>

      <div className="progress-summary">
        {selectedMetric === "rating" && (
          <>
            <div>
              <span>Current Skill</span>

              <strong>{currentRating !== null ? Math.round(currentRating) : "N/A"}</strong>
            </div>

            <div>
              <span>Peak Skill</span>

              <strong>{peakRating !== null ? Math.round(peakRating) : "N/A"}</strong>
            </div>
          </>
        )}

        {selectedMetric === "accuracy" && (
          <div>
            <span>Average Accuracy</span>

            <strong>{averageValue !== null ? `${averageValue.toFixed(1)}%` : "N/A"}</strong>
          </div>
        )}

        {selectedMetric === "cpl" && (
          <>
            <div>
              <span>Average CPL</span>

              <strong>{averageValue !== null ? averageValue.toFixed(1) : "N/A"}</strong>
            </div>

            <div>
              <span>Goal</span>

              <strong>Lower is better</strong>
            </div>
          </>
        )}
      </div>

      <div className="progress-chart-container">
        <TrendChart
          points={selectedPoints}
          valueSuffix={selectedMetric === "accuracy" ? "%" : ""}
          lowerIsBetter={selectedMetric === "cpl"}
        />
      </div>

      <p className="progress-filter-note">
        {selectedMetric === "rating"
          ? "Rating progression includes all completed games."
          : "This graph uses the difficulties selected in Games Included."}
      </p>
    </section>
  );
}

export default ProgressSection;
