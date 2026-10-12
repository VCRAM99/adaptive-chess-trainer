import { useMemo, useState, type ReactNode } from "react";

import AboutSection from "../components/profile/AboutSection";
import CareerStatistics from "../components/profile/CareerStatistics";
import DifficultyFilter from "../components/profile/DifficultyFilter";
import MoveQualityStatistics from "../components/profile/MoveQualityStatistics";
import RecentGames from "../components/profile/RecentGames";
import ProgressSection from "../components/profile/ProgressSection";
import ResetProgressDialog from "../components/profile/ResetProgressDialog";
import PerformanceByMode from "../components/profile/PerformanceByMode";
import { ACCENT_THEMES } from "../lib/preferences/accentThemes";

import { ArrowLeft, UserRound } from "lucide-react";

import type { User } from "@supabase/supabase-js";

import type { AccentTheme, BoardTheme, ColorScheme, PieceSet } from "../lib/preferences/types";

import { BOARD_THEMES } from "../lib/preferences/boardThemes";

import {
  calculateCareerStatistics,
  DEFAULT_DIFFICULTY_FILTER,
  type DifficultyFilter as DifficultyFilterValue,
} from "../lib/profile/statistics";

import type { PlayerProfile } from "../lib/profile/types";

import { getDisplayedRating } from "../lib/displayRating";
import Dialog from "../components/ui/Dialog";

type ProfilePageProps = {
  profile: PlayerProfile;

  accentTheme: AccentTheme;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  colorScheme: ColorScheme;

  currentUser: User | null;
  isAuthLoading: boolean;

  onAccentThemeChange: (theme: AccentTheme) => void;
  onColorSchemeChange: (colorScheme: ColorScheme) => void;

  onBoardThemeChange: (theme: BoardTheme) => void;

  onPieceSetChange: (pieceSet: PieceSet) => void;

  onBackToGame: () => void;
  onOpenAuthDialog: () => void;
  onResetProgress: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;

  onImportGuestProgress: () => Promise<boolean>;
  isGuestImporting: boolean;
  guestImportError: string | null;
  canImportGuestProgress: boolean;
  guestImportGameCount: number;
  guestImportRating: number | null;
  persistenceNotice?: ReactNode;
};

function ProfilePage({
  profile,
  accentTheme,
  boardTheme,
  pieceSet,
  colorScheme,
  currentUser,
  isAuthLoading,
  onBoardThemeChange,
  onPieceSetChange,
  onAccentThemeChange,
  onColorSchemeChange,
  onBackToGame,
  onOpenAuthDialog,
  onResetProgress,
  onChangePassword,
  onSignOut,
  onImportGuestProgress,
  isGuestImporting,
  guestImportError,
  canImportGuestProgress,
  guestImportGameCount,
  guestImportRating,
  persistenceNotice,
}: ProfilePageProps) {
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilterValue>(DEFAULT_DIFFICULTY_FILTER);

  const statistics = useMemo(
    () => calculateCareerStatistics(profile.games, difficultyFilter),
    [profile.games, difficultyFilter],
  );
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isGuestImportDialogOpen, setIsGuestImportDialogOpen] = useState(false);

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div className="profile-header__identity">
          <div className="profile-header__icon">
            <UserRound size={22} />
          </div>

          <div>
            <p className="profile-eyebrow">ADAPTIVE CHESS TRAINER</p>

            <h1>Player Profile</h1>

            <p className="profile-account-name">
              {isAuthLoading
                ? "Loading..."
                : currentUser?.user_metadata?.display_name ||
                  currentUser?.user_metadata?.full_name ||
                  currentUser?.email ||
                  "Guest"}
            </p>
          </div>
        </div>

        <div className="profile-header__actions">
          {!isAuthLoading && !currentUser && (
            <button type="button" className="auth-nav-button" onClick={onOpenAuthDialog}>
              Sign In / Create Account
            </button>
          )}

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
        </div>
      </header>

      {persistenceNotice}

      <div className="profile-dashboard">
        <DifficultyFilter value={difficultyFilter} onChange={setDifficultyFilter} />

        <CareerStatistics
          statistics={statistics}
          currentRating={getDisplayedRating(profile.estimatedRating)}
          bestRating={getDisplayedRating(profile.bestRating)}
        />

        <MoveQualityStatistics moveTiers={statistics.moveTiers} />
      </div>
      <PerformanceByMode games={profile.games} />

      <ProgressSection games={profile.games} difficultyFilter={difficultyFilter} />
      <RecentGames games={profile.games} difficultyFilter={difficultyFilter} />
      <section className="profile-section profile-appearance">
        <div className="profile-section-heading">
          <div>
            <h2>Appearance</h2>
            <p>Personalize your trainer's interface, accent color, and board.</p>
          </div>
        </div>

        <h3 className="appearance-label" id="interface-theme-label">
          Interface
        </h3>

        <div className="piece-set-picker" role="group" aria-labelledby="interface-theme-label">
          {(
            [
              { id: "system", label: "System" },
              { id: "light", label: "Light" },
              { id: "dark", label: "Dark" },
            ] as const
          ).map((option) => {
            const isSelected = colorScheme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={
                  isSelected ? "piece-set-option piece-set-option--selected" : "piece-set-option"
                }
                onClick={() => onColorSchemeChange(option.id)}
                aria-pressed={isSelected}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <h3 className="appearance-label">Accent Color</h3>

        <div className="accent-picker">
          {Object.values(ACCENT_THEMES).map((theme) => {
            const isSelected = accentTheme === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                className={isSelected ? "accent-option accent-option--selected" : "accent-option"}
                onClick={() => onAccentThemeChange(theme.id)}
                aria-pressed={isSelected}
              >
                <span
                  className="accent-option__swatch"
                  style={{
                    backgroundColor: `rgb(${theme.rgb})`,
                  }}
                />

                <span>{theme.label}</span>
              </button>
            );
          })}
        </div>

        <h3 className="appearance-label">Board Theme</h3>

        <div className="board-theme-picker">
          {Object.entries(BOARD_THEMES).map(([id, colors]) => {
            const themeId = id as BoardTheme;
            const isSelected = boardTheme === themeId;

            const label = themeId.charAt(0).toUpperCase() + themeId.slice(1);

            return (
              <button
                key={themeId}
                type="button"
                className={
                  isSelected
                    ? "board-theme-option board-theme-option--selected"
                    : "board-theme-option"
                }
                onClick={() => onBoardThemeChange(themeId)}
                aria-pressed={isSelected}
              >
                <span className="board-theme-option__swatch" aria-hidden="true">
                  <span
                    style={{
                      backgroundColor: colors.light,
                    }}
                  />
                  <span
                    style={{
                      backgroundColor: colors.dark,
                    }}
                  />
                  <span
                    style={{
                      backgroundColor: colors.dark,
                    }}
                  />
                  <span
                    style={{
                      backgroundColor: colors.light,
                    }}
                  />
                </span>

                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <h3 className="appearance-label">Piece Set</h3>

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
            const isSelected = pieceSet === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={
                  isSelected ? "piece-set-option piece-set-option--selected" : "piece-set-option"
                }
                onClick={() => onPieceSetChange(option.id)}
                aria-pressed={isSelected}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <AboutSection />
      <section className="profile-data-management">
        <div>
          <h2>Data Management</h2>

          <p>Manage your account and saved chess progress.</p>
        </div>

        <div className="profile-data-management__actions">
          {currentUser?.identities?.some((identity) => identity.provider === "email") && (
            <button type="button" className="change-password-button" onClick={onChangePassword}>
              Change Password
            </button>
          )}
          {currentUser && (
            <button
              type="button"
              className="sign-out-button"
              onClick={onSignOut}
              disabled={isGuestImporting}
            >
              Sign Out
            </button>
          )}

          {currentUser && (
            <button
              type="button"
              className="import-guest-button"
              disabled={!canImportGuestProgress || isGuestImporting || isAuthLoading}
              onClick={() => setIsGuestImportDialogOpen(true)}
            >
              {isGuestImporting ? "Importing..." : "Import Guest Progress"}
            </button>
          )}

          <button
            type="button"
            className="reset-progress-button"
            onClick={() => setIsResetDialogOpen(true)}
            disabled={isGuestImporting}
          >
            Reset Progress
          </button>
        </div>

        {isGuestImportDialogOpen && currentUser && (
          <Dialog
            open={true}
            title="Import Guest Progress?"
            description="Copy your saved guest chess progress into this account."
            onClose={() => {
              if (!isGuestImporting) {
                setIsGuestImportDialogOpen(false);
              }
            }}
          >
            <div className="reset-dialog-content">
              <div className="guest-import-summary">
                <div className="guest-import-summary__item">
                  <span>Guest Rating</span>
                  <strong>{guestImportRating ?? "—"} Elo</strong>
                </div>

                <div className="guest-import-summary__item">
                  <span>Saved Games</span>
                  <strong>{guestImportGameCount}</strong>
                </div>
              </div>

              <p className="guest-import-note">
                Your original guest progress will remain saved in this browser.
              </p>

              {guestImportError && (
                <p role="alert" className="profile-error">
                  {guestImportError}
                </p>
              )}

              <div className="reset-dialog-actions">
                <button
                  type="button"
                  className="reset-cancel-button"
                  disabled={isGuestImporting}
                  onClick={() => setIsGuestImportDialogOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="reset-confirm-button"
                  disabled={!canImportGuestProgress || isGuestImporting}
                  onClick={async () => {
                    const succeeded = await onImportGuestProgress();

                    if (succeeded) {
                      setIsGuestImportDialogOpen(false);
                    }
                  }}
                >
                  {isGuestImporting ? "Importing..." : "Import Progress"}
                </button>
              </div>
            </div>
          </Dialog>
        )}
      </section>
      {isResetDialogOpen && (
        <ResetProgressDialog
          onCancel={() => setIsResetDialogOpen(false)}
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
