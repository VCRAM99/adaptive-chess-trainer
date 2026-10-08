import type { PlayerProfile } from "./types";
import { createDefaultProfile } from "./profileStorage";

export type GuestImportEligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason: "no-guest-progress" | "account-not-empty";
    };

/**
 * A profile has meaningful progress if it has
 * recorded games or its rating differs from
 * the default starting rating.
 */
export function hasMeaningfulProgress(profile: PlayerProfile): boolean {
  const defaultProfile = createDefaultProfile();

  return (
    profile.games.length > 0 ||
    profile.estimatedRating !== defaultProfile.estimatedRating ||
    profile.bestRating !== defaultProfile.bestRating
  );
}

/**
 * Guest progress may only be imported into
 * an account with no existing progress.
 */
export function getGuestImportEligibility(
  guestProfile: PlayerProfile,
  accountProfile: PlayerProfile,
): GuestImportEligibility {
  if (!hasMeaningfulProgress(guestProfile)) {
    return {
      eligible: false,
      reason: "no-guest-progress",
    };
  }

  if (hasMeaningfulProgress(accountProfile)) {
    return {
      eligible: false,
      reason: "account-not-empty",
    };
  }

  return { eligible: true };
}
