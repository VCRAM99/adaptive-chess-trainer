import type { PlayerProfile } from "../profile/types";
import { parseStoredProfile } from "../profile/profileStorage";
import type { UserPreferences } from "../preferences/types";
import { parseStoredPreferences } from "../preferences/preferencesStorage";
import { InvalidCloudDataError } from "./cloudErrors";
import { supabase } from "./client";

type CloudProfileRow = {
  user_id: string;
  profile_data: unknown;
  revision: unknown;
  updated_at: string;
};

export type CloudProfileSnapshot = {
  profile: PlayerProfile;
  revision: number;
};

type CloudPreferencesRow = {
  user_id: string;
  preferences_data: unknown;
  updated_at: string;
};

function isRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

async function requireSessionUser(userId: string): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || authData.user?.id !== userId) {
    throw new Error("Cannot save profile: account session changed.");
  }
}

/**
 * Load the signed-in player's saved profile.
 *
 * Returns null when the user has not saved a cloud profile yet.
 * Invalid JSON throws so the caller does not replace it with a
 * default profile and save that default back.
 */
export async function loadCloudProfile(userId: string): Promise<CloudProfileSnapshot | null> {
  const { data, error } = await supabase
    .from("player_profiles")
    .select("user_id, profile_data, revision, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const row = data as CloudProfileRow;

  if (row.user_id !== userId) {
    throw new Error("Cloud profile does not belong to this account.");
  }

  const profile = parseStoredProfile(row.profile_data);

  if (!profile || !isRevision(row.revision)) {
    throw new InvalidCloudDataError("profile");
  }

  return {
    profile,
    revision: row.revision,
  };
}

/**
 * Save the player's complete profile.
 *
 * `save_player_profile` writes the caller's row only when
 * `expected_revision` matches the stored revision, then returns
 * the new revision. A mismatch is an error and must not be
 * treated as a successful save.
 */
export async function saveCloudProfile(
  userId: string,
  profile: PlayerProfile,
  expectedRevision: number,
): Promise<number> {
  await requireSessionUser(userId);

  if (!parseStoredProfile(profile)) {
    throw new InvalidCloudDataError("profile");
  }

  const { data, error } = await supabase.rpc("save_player_profile", {
    incoming_profile: profile,
    expected_revision: expectedRevision,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "number") {
    throw new Error("Supabase did not return a profile revision.");
  }

  return data;
}

/**
 * Load the signed-in player's preferences.
 *
 * Returns null when no row exists. Invalid JSON throws instead
 * of being replaced with defaults.
 */
export async function loadCloudPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("user_id, preferences_data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const row = data as CloudPreferencesRow;

  if (row.user_id !== userId) {
    throw new Error("Cloud preferences do not belong to this account.");
  }

  const preferences = parseStoredPreferences(row.preferences_data);

  if (!preferences) {
    throw new InvalidCloudDataError("preferences");
  }

  return preferences;
}

/**
 * Save the player's preferences.
 *
 * The session must still belong to `userId` before the row is written.
 */
export async function saveCloudPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || authData.user?.id !== userId) {
    throw new Error("Cannot save preferences: account session changed.");
  }

  if (!parseStoredPreferences(preferences)) {
    throw new InvalidCloudDataError("preferences");
  }

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      preferences_data: preferences,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw error;
  }
}
