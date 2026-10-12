import type { ReactNode } from "react";

type AppHeaderActionsProps = {
  showSignIn: boolean;
  onSignIn: () => void;
  onOpenProfile: () => void;
  profileButton: ReactNode;
};

export default function AppHeaderActions({
  showSignIn,
  onSignIn,
  onOpenProfile,
  profileButton,
}: AppHeaderActionsProps) {
  return (
    <div className="app-header__actions">
      <a className="auth-nav-button" href="/discover">
        Learn More
      </a>

      {showSignIn && (
        <button type="button" className="auth-nav-button" onClick={onSignIn}>
          Sign In / Create Account
        </button>
      )}

      <button
        type="button"
        className="profile-nav-button"
        onClick={onOpenProfile}
        aria-label="Player profile"
        data-tooltip="PLAYER PROFILE"
      >
        {profileButton}
      </button>
    </div>
  );
}
