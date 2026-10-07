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
import PerformanceByMode from "../components/profile/PerformanceByMode";
import {
  ACCENT_THEMES,
} from "../lib/preferences/accentThemes";

import { ArrowLeft, UserRound } from "lucide-react";

import type {
  AccentTheme,
} from "../lib/preferences/types";

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

  accentTheme: AccentTheme;

  onAccentThemeChange: (
    theme: AccentTheme
  ) => void;

  onBackToGame: () => void;
  onResetProgress: () => void;
};

function ProfilePage({
  profile,
  accentTheme,
  onAccentThemeChange,
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
        <div className="profile-header__identity">
          <div className="profile-header__icon">
            <UserRound size={22} />
          </div>

          <div>
            <p className="profile-eyebrow">
              ADAPTIVE CHESS TRAINER
            </p>

            <h1>Player Profile</h1>

          </div>
        </div>

        <button
          type="button"
          className="profile-nav-button"
          onClick={onBackToGame}
          aria-label="Back to Game"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="profile-nav-tooltip" role="tooltip">
            BACK TO GAME
          </span>
        </button>
      </header>

      <div className="profile-dashboard">
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
      </div>
      <PerformanceByMode games={profile.games} />

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
      <section className="profile-section profile-appearance">
        <div className="profile-section-heading">
          <div>
            <h2>Appearance</h2>
            <p>
              Personalize your trainer's accent color.
            </p>
          </div>
        </div>

        <div className="accent-picker">
          {Object.values(
            ACCENT_THEMES
          ).map((theme) => {
            const isSelected =
              accentTheme === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                className={
                  isSelected
                    ? "accent-option accent-option--selected"
                    : "accent-option"
                }
                onClick={() =>
                  onAccentThemeChange(theme.id)
                }
                aria-pressed={isSelected}
              >
                <span
                  className="accent-option__swatch"
                  style={{
                    backgroundColor:
                      `rgb(${theme.rgb})`,
                  }}
                />

                <span>
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
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