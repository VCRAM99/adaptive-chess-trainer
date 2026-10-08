
import type { PlayerProfile } from "../profile/types";

import {
  createDefaultProfile,
  loadProfile,
} from "../profile/profileStorage";

import {
  getGuestImportEligibility,
} from "../profile/guestMigration";

import { loadCloudProfile } from "./storage";
import { profileSaveQueue } from "./saveQueues";
import { supabase } from "./client";

/**
 * Imports local guest progress into an empty
 * authenticated account.
 *
 * The original guest profile is preserved.
 */
export async function importGuestProgress(
  userId: string
): Promise<PlayerProfile> {
  return profileSaveQueue.enqueue(async () => {
    const { data, error: authError } =
      await supabase.auth.getUser();

    if (authError || data.user?.id !== userId) {
      throw new Error(
        "Your account session changed. Please sign in again."
      );
    }

    const guestProfile = loadProfile();

    const accountSnapshot =
    await loadCloudProfile(userId);
  
  const accountProfile =
    accountSnapshot?.profile ??
    createDefaultProfile();

    const eligibility = getGuestImportEligibility(
      guestProfile,
      accountProfile
    );

    if (!eligibility.eligible) {
      throw new Error(
        eligibility.reason === "no-guest-progress"
          ? "There is no guest progress to import."
          : "This account already has progress."
      );
    }

    const { error } = await supabase.rpc(
      "import_guest_profile",
      {
        incoming_profile: guestProfile,
      }
    );

    if (error) {
      throw error;
    }

    return guestProfile;
  });
}
