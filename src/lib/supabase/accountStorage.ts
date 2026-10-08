
import type { PlayerProfile } from "../profile/types";
import type { UserPreferences } from "../preferences/types";

import {
  createDefaultProfile,
  loadProfile,
  saveProfile,
} from "../profile/profileStorage";

import {
  createDefaultPreferences,
  loadPreferences,
  savePreferences,
} from "../preferences/preferencesStorage";

import {
  loadCloudProfile,
  loadCloudPreferences,
  saveCloudProfile,
  saveCloudPreferences,
} from "./storage";

export type PlayerStorageData = {
  profile: PlayerProfile;
  preferences: UserPreferences;
  profileRevision: number | null;
};

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

export async function savePlayerStorage(
  userId: string | null,
  data: PlayerStorageData
): Promise<void> {
  if (!userId) {
    saveProfile(data.profile);
    savePreferences(data.preferences);
    return;
  }

  if (data.profileRevision === null) {
    throw new Error(
      "Cloud profile revision is missing."
    );
  }

  await Promise.all([
    saveCloudProfile(
      userId,
      data.profile,
      data.profileRevision
    ),
    saveCloudPreferences(
      userId,
      data.preferences
    ),
  ]);
}
