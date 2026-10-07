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
  BoardTheme,
  PieceSet,
} from "../lib/preferences/types";

import {
  BOARD_THEMES,
} from "../lib/preferences/boardThemes";

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
  boardTheme: BoardTheme;
  pieceSet: PieceSet;

  onAccentThemeChange: (
    theme: AccentTheme
  ) => void;

  onBoardThemeChange: (
    theme: BoardTheme
  ) => void;

  onPieceSetChange: (
    pieceSet: PieceSet
  ) => void;

  onBackToGame: () => void;
  onResetProgress: () => void;
};

function ProfilePage({
  profile,
  accentTheme,
  boardTheme,
  pieceSet,
  onBoardThemeChange,
  onPieceSetChange,
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
              Personalize your trainer's accent color and board theme.
            </p>
          </div>
        </div>

        <h3 className="appearance-label">
          Accent Color
        </h3>

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

        <h3 className="appearance-label">
          Board Theme
        </h3>

        <div className="board-theme-picker">
          {Object.entries(BOARD_THEMES).map(
            ([id, colors]) => {
              const themeId = id as BoardTheme;
              const isSelected =
                boardTheme === themeId;

              const label =
                themeId.charAt(0).toUpperCase() +
                themeId.slice(1);

              return (
                <button
                  key={themeId}
                  type="button"
                  className={
                    isSelected
                      ? "board-theme-option board-theme-option--selected"
                      : "board-theme-option"
                  }
                  onClick={() =>
                    onBoardThemeChange(themeId)
                  }
                  aria-pressed={isSelected}
                >
                  <span
                    className="board-theme-option__swatch"
                    aria-hidden="true"
                  >
                    <span
                      style={{
                        backgroundColor:
                          colors.light,
                      }}
                    />
                    <span
                      style={{
                        backgroundColor:
                          colors.dark,
                      }}
                    />
                    <span
                      style={{
                        backgroundColor:
                          colors.dark,
                      }}
                    />
                    <span
                      style={{
                        backgroundColor:
                          colors.light,
                      }}
                    />
                  </span>

                  <span>{label}</span>
                </button>
              );
            }
          )}
        </div>

        <h3 className="appearance-label">
          Piece Set
        </h3>

        <div className="piece-set-picker">
          {(
            [
              {
                id: "classic",
                label: "Classic",
              },
              {
                id: "modern",
                label: "Modern",
              },
              {
                id: "minimal",
                label: "Minimal",
              },
            ] as const
          ).map((option) => {
            const isSelected =
              pieceSet === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={
                  isSelected
                    ? "piece-set-option piece-set-option--selected"
                    : "piece-set-option"
                }
                onClick={() =>
                  onPieceSetChange(option.id)
                }
                aria-pressed={isSelected}
              >
                <span>{option.label}</span>
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