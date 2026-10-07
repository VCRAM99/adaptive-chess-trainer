import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import type {
    StoredGame,
  } from "../../lib/profile/types";
  
  import type {
    DifficultyFilter,
  } from "../../lib/profile/statistics";
  
  import {
    getRecentGames,
  } from "../../lib/profile/recentGames";
  
  import {
    getDisplayedRating,
  } from "../../lib/displayRating";
  
  type RecentGamesProps = {
    games: StoredGame[];
    difficultyFilter: DifficultyFilter;
  };
  
  const INITIAL_GAME_LIMIT = 10;
  const GAME_LIMIT_INCREMENT = 10;
  
  function capitalize(
    value: string
  ): string {
    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    );
  }
  
  function formatRatingChange(
    ratingBefore: number,
    ratingAfter: number
  ): string {
    const before =
      getDisplayedRating(ratingBefore);
  
    const after =
      getDisplayedRating(ratingAfter);
  
    const difference = after - before;
  
    if (difference > 0) {
      return `+${difference}`;
    }
  
    return `${difference}`;
  }
  
  function formatDate(
    playedAt: string
  ): string {
    return new Intl.DateTimeFormat(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(new Date(playedAt));
  }

  function formatTrainingMode(
    mode: StoredGame["trainingMode"]
  ): string {
    switch (mode) {
      case "easy":
        return "Casual";
  
      case "medium":
        return "Echo";
  
      case "hard":
        return "Train";
    }
  }
  
  function RecentGames({
    games,
    difficultyFilter,
  }: RecentGamesProps) {
    const [
      visibleGameCount,
      setVisibleGameCount,
    ] = useState(INITIAL_GAME_LIMIT);
  
    const filteredGames = useMemo(
      () =>
        getRecentGames(
          games,
          difficultyFilter
        ),
      [
        games,
        difficultyFilter,
      ]
    );
  
    // When the difficulty selection changes,
    // return to the initial 10-game view.
    useEffect(() => {
      setVisibleGameCount(
        INITIAL_GAME_LIMIT
      );
    }, [difficultyFilter]);
  
    const visibleGames =
      filteredGames.slice(
        0,
        visibleGameCount
      );
  
    const hasMoreGames =
      visibleGameCount <
      filteredGames.length;
  
    if (games.length === 0) {
      return (
        <section className="recent-games">
          <h2>Recent Games</h2>
  
          <p className="recent-games-empty">
            No completed games yet. Finish a
            game to start building your
            history.
          </p>
        </section>
      );
    }
  
    if (filteredGames.length === 0) {
      return (
        <section className="recent-games">
          <h2>Recent Games</h2>
  
          <p className="recent-games-empty">
            No games match the selected
            difficulties.
          </p>
        </section>
      );
    }
  
    return (
      <section className="recent-games">
        <div className="profile-section-heading">
          <div>
            <h2>Recent Games</h2>
  
            <p>
              Your latest games across the
              selected difficulties.
            </p>
          </div>
  
          <span>
            {filteredGames.length}{" "}
            {filteredGames.length === 1
              ? "game"
              : "games"}
          </span>
        </div>
  
        <div className="recent-games-list">
          {visibleGames.map((game) => {
  
            return (
              <article
                  key={game.id}
                  className={`recent-game-card recent-game-${game.result}`}
                >
                  <div className="recent-game-result">
                    <strong>
                      {game.result === "win"
                        ? "VICTORY"
                        : game.result === "loss"
                          ? "DEFEAT"
                          : "DRAW"}
                    </strong>

                    <span
                      className={`recent-game-rating-change ${
                        game.ratingAfter > game.ratingBefore
                          ? "recent-game-rating-positive"
                          : game.ratingAfter < game.ratingBefore
                            ? "recent-game-rating-negative"
                            : ""
                      }`}
                    >
                      {formatRatingChange(
                        game.ratingBefore,
                        game.ratingAfter
                      )}{" "}
                      Elo
                    </span>
                  </div>

                  <div className="recent-game-details">
                    <strong>
                      {capitalize(game.playerColor)}
                      {" · "}
                      {formatTrainingMode(game.trainingMode)}
                    </strong>

                    <span>
                      Accuracy{" "}
                      {game.accuracy !== null
                        ? `${game.accuracy.toFixed(1)}%`
                        : "N/A"}
                      {" · "}
                      {game.moveCount}{" "}
                      {game.moveCount === 1
                        ? "move"
                        : "moves"}
                    </span>
                  </div>

                  <time dateTime={game.playedAt}>
                    {formatDate(game.playedAt)}
                  </time>
                </article>
            );
          })}
        </div>
  
        {hasMoreGames && (
          <button
            type="button"
            className="recent-games-more"
            onClick={() =>
              setVisibleGameCount(
                (current) =>
                  current +
                  GAME_LIMIT_INCREMENT
              )
            }
          >
            Show More
          </button>
        )}
      </section>
    );
  }
  
  export default RecentGames;