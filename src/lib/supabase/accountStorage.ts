
import type { PlayerProfile } from "../profile/types";
import type { UserPreferences } from "../preferences/types";

import {
  createDefaultProfile,
  loadProfile,
} from "../profile/profileStorage";

import {
  createDefaultPreferences,
  loadPreferences,
} from "../preferences/preferencesStorage";

import {
  loadCloudProfile,
  loadCloudPreferences,
} from "./storage";

export type PlayerStorageData = {
  profile: PlayerProfile;
  preferences: UserPreferences;
  profileRevision: number | null;
};

/**
 * Guest sessions read and write local storage only.
 * An authenticated load uses the cloud row when it exists.
 * A missing row starts at revision 0. Invalid cloud JSON
 * throws, so it is not replaced with an empty default.
 */
export async function loadPlayerStorage(
  userId: string | null
): Promise<PlayerStorageData> {
  if (!userId) {
    return {
      profile: loadProfile(),
      preferences: loadPreferences(),
      profileRevision: null,
    };
  }

  const [cloudProfile, cloudPreferences] =
    await Promise.all([
      loadCloudProfile(userId),
      loadCloudPreferences(userId),
    ]);

  return {
    profile:
      cloudProfile?.profile ??
      createDefaultProfile(),

    preferences:
      cloudPreferences ??
      createDefaultPreferences(),

    profileRevision:
      cloudProfile?.revision ?? 0,
  };
}
