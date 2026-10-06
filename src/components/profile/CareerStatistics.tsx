import type {
    CareerStatistics as CareerStatisticsData,
  } from "../../lib/profile/statistics";
  
  type CareerStatisticsProps = {
    statistics: CareerStatisticsData;
    currentRating: number;
    bestRating: number;
  };
  
  function formatNumber(
    value: number | null,
    suffix = ""
  ): string {
    if (value === null) {
      return "N/A";
    }
  
    return `${value.toFixed(1)}${suffix}`;
  }
  
  function CareerStatistics({
    statistics,
    currentRating,
    bestRating,
  }: CareerStatisticsProps) {
    return (
      <section className="career-statistics">
        <h2>Career Statistics</h2>
  
        <div className="career-stat-grid">
          <div>
            <span>Current Skill</span>
            <strong>{currentRating}</strong>
          </div>
  
          <div>
            <span>Best Skill</span>
            <strong>{bestRating}</strong>
          </div>
  
          <div>
            <span>Games Played</span>
            <strong>
              {statistics.gamesPlayed}
            </strong>
          </div>
  
          <div>
            <span>Win Rate</span>
            <strong>
              {formatNumber(
                statistics.winRate,
                "%"
              )}
            </strong>
          </div>
  
          <div>
            <span>Wins</span>
            <strong>
              {statistics.wins}
            </strong>
          </div>
  
          <div>
            <span>Draws</span>
            <strong>
              {statistics.draws}
            </strong>
          </div>
  
          <div>
            <span>Losses</span>
            <strong>
              {statistics.losses}
            </strong>
          </div>
  
          <div>
            <span>Average Accuracy</span>
            <strong>
              {formatNumber(
                statistics.averageAccuracy,
                "%"
              )}
            </strong>
          </div>
  
          <div>
            <span>Average CPL</span>
            <strong>
              {formatNumber(
                statistics
                  .averageCentipawnLoss
              )}
            </strong>
          </div>
  
          <div>
            <span>White Record</span>
            <strong>
              {statistics.whiteWins}-
              {statistics.whiteDraws}-
              {statistics.whiteLosses}
            </strong>
          </div>
  
          <div>
            <span>Black Record</span>
            <strong>
              {statistics.blackWins}-
              {statistics.blackDraws}-
              {statistics.blackLosses}
            </strong>
          </div>
        </div>
      </section>
    );
  }
  
  export default CareerStatistics;