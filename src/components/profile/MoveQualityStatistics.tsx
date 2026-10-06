import type {
    StoredMoveTiers,
  } from "../../lib/profile/types";
  
  type MoveQualityStatisticsProps = {
    moveTiers: StoredMoveTiers;
  };
  
  const MOVE_TIERS = [
    "diamond",
    "platinum",
    "gold",
    "silver",
    "bronze",
    "steel",
    "wood",
  ] as const;
  
  function formatTierName(
    tier: (typeof MOVE_TIERS)[number]
  ): string {
    return (
      tier.charAt(0).toUpperCase() +
      tier.slice(1)
    );
  }
  
  function MoveQualityStatistics({
    moveTiers,
  }: MoveQualityStatisticsProps) {
    const totalMoves =
      MOVE_TIERS.reduce(
        (total, tier) =>
          total + moveTiers[tier],
        0
      );
  
    return (
      <section className="profile-move-quality">
        <div className="profile-section-heading">
          <div>
            <h2>Move Quality</h2>
  
            <p>
              Your graded moves across the
              selected difficulties.
            </p>
          </div>
  
          <span>
            {totalMoves} graded moves
          </span>
        </div>
  
        <div className="profile-tier-grid">
          {MOVE_TIERS.map((tier) => {
            const count =
              moveTiers[tier];
  
            const percentage =
              totalMoves > 0
                ? (count / totalMoves) * 100
                : 0;
  
            return (
              <div
                key={tier}
                className={
                  `profile-tier-card ` +
                  `profile-tier-${tier}`
                }
              >
                <span>
                  {formatTierName(tier)}
                </span>
  
                <strong>{count}</strong>
  
                <small>
                  {percentage.toFixed(1)}%
                </small>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
  
  export default MoveQualityStatistics;