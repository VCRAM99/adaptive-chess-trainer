import type { CareerStatistics as CareerStatisticsData } from "../../lib/profile/statistics";

type CareerStatisticsProps = {
  statistics: CareerStatisticsData;
  currentRating: number;
  bestRating: number;
};

function formatNumber(value: number | null, suffix = ""): string {
  if (value === null) return "N/A";

  return `${value.toFixed(1)}${suffix}`;
}

function CareerStatistics({ statistics, currentRating, bestRating }: CareerStatisticsProps) {
  return (
    <section className="career-statistics">
      <div className="profile-section-heading">
        <div>
          <h2>Career Overview</h2>
          <p>Your progress and performance over time.</p>
        </div>
      </div>

      <div className="career-overview-grid">
        <div className="career-stat-card">
          <span>Current Rating</span>
          <strong className="career-rating-current">{currentRating}</strong>
        </div>

        <div className="career-stat-card">
          <span>Peak Rating</span>
          <strong>{bestRating}</strong>
        </div>

        <div className="career-stat-card">
          <span>Games Played</span>
          <strong>{statistics.gamesPlayed}</strong>
        </div>

        <div className="career-stat-card">
          <span>Win Rate</span>
          <strong>{formatNumber(statistics.winRate, "%")}</strong>
        </div>
      </div>

      <div className="career-record-section">
        <h3>Career Record</h3>

        <div className="career-record-grid">
          <div className="career-record-win">
            <strong>{statistics.wins}</strong>
            <span>Wins</span>
          </div>

          <div className="career-record-draw">
            <strong>{statistics.draws}</strong>
            <span>Draws</span>
          </div>

          <div className="career-record-loss">
            <strong>{statistics.losses}</strong>
            <span>Losses</span>
          </div>
        </div>
      </div>

      <div className="career-performance-section">
        <h3>Performance Statistics</h3>

        <div className="career-performance-grid">
          <div className="career-stat-card">
            <span>Average Accuracy</span>
            <strong>{formatNumber(statistics.averageAccuracy, "%")}</strong>
          </div>

          <div className="career-stat-card">
            <span>Average CPL</span>
            <strong>{formatNumber(statistics.averageCentipawnLoss)}</strong>
          </div>

          <div className="career-stat-card">
            <span>White Record</span>
            <strong>
              {statistics.whiteWins}-{statistics.whiteDraws}-{statistics.whiteLosses}
            </strong>
          </div>

          <div className="career-stat-card">
            <span>Black Record</span>
            <strong>
              {statistics.blackWins}-{statistics.blackDraws}-{statistics.blackLosses}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CareerStatistics;
