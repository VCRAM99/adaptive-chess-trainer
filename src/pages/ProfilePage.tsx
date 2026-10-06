import {
  useMemo,
  useState,
} from "react";

import CareerStatistics from "../components/profile/CareerStatistics";
import DifficultyFilter from "../components/profile/DifficultyFilter";
import MoveQualityStatistics from "../components/profile/MoveQualityStatistics";
import RecentGames from "../components/profile/RecentGames";
import ProgressSection from "../components/profile/ProgressSection";
import ResetProgressDialog from "../components/profile/ResetProgressDialog";

import {
  calculateCareerStatistics,
  DEFAULT_DIFFICULTY_FILTER,
} from "../lib/profile/statistics";

import type {
  DifficultyFilter as DifficultyFilterValue,
} from "../lib/profile/statistics";

import type {
  PlayerProfile,
} from "../lib/profile/types";

import {
  getDisplayedRating,
} from "../lib/displayRating";

type ProfilePageProps = {
  profile: PlayerProfile;
  onBackToGame: () => void;
  onResetProgress: () => void;
};

function ProfilePage({
  profile,
  onBackToGame,
  onResetProgress,
}: ProfilePageProps) {
  const [
    difficultyFilter,
    setDifficultyFilter,
  ] =
    useState<DifficultyFilterValue>(
      DEFAULT_DIFFICULTY_FILTER
    );

  const statistics = useMemo(
    () =>
      calculateCareerStatistics(
        profile.games,
        difficultyFilter
      ),
    [
      profile.games,
      difficultyFilter,
    ]
  );
  const [
    isResetDialogOpen,
    setIsResetDialogOpen,
  ] = useState(false);

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <p className="profile-eyebrow">
            Adaptive Chess Trainer
          </p>

          <h1>Player Profile</h1>
        </div>

        <button
          type="button"
          className="profile-nav-button"
          onClick={onBackToGame}
          aria-label="Back to game"
          title="Back to game"
        >
          ♟
        </button>
      </header>

      <DifficultyFilter
        value={difficultyFilter}
        onChange={setDifficultyFilter}
      />

      <CareerStatistics
        statistics={statistics}
        currentRating={getDisplayedRating(
          profile.estimatedRating
        )}
        bestRating={getDisplayedRating(
          profile.bestRating
        )}
      />
      <MoveQualityStatistics
        moveTiers={statistics.moveTiers}
      />
      <ProgressSection
        games={profile.games}
        difficultyFilter={
          difficultyFilter
        }
      />
      <RecentGames
        games={profile.games}
        difficultyFilter={
          difficultyFilter
        }
      />
      <section className="profile-data-management">
        <div>
          <h2>Data Management</h2>

          <p>
            Manage the progress saved locally
            on this device.
          </p>
        </div>

        <button
          type="button"
          className="reset-progress-button"
          onClick={() =>
            setIsResetDialogOpen(true)
          }
        >
          Reset Progress
        </button>
      </section>
      {isResetDialogOpen && (
        <ResetProgressDialog
          onCancel={() =>
            setIsResetDialogOpen(false)
          }
          onConfirm={() => {
            onResetProgress();
            setIsResetDialogOpen(false);
          }}
        />
      )}
    </main>
  );
}

export default ProfilePage;