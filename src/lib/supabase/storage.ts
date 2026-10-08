
import type {
    PlayerProfile,
  } from "../profile/types";
  import type {
    UserPreferences,
  } from "../preferences/types";
  import { supabase } from "./client";
  
  type CloudProfileRow = {
    user_id: string;
    profile_data: PlayerProfile;
    revision: number;
    updated_at: string;
  };

  export type CloudProfileSnapshot = {
    profile: PlayerProfile;
    revision: number;
  };
  
  type CloudPreferencesRow = {
    user_id: string;
    preferences_data: UserPreferences;
    updated_at: string;
  };
  
  /**
   * Load the signed-in player's saved profile.
   *
   * Returns null when the user has not saved
   * a cloud profile yet.
   */

  export async function loadCloudProfile(
    userId: string
  ): Promise<CloudProfileSnapshot | null> {
    const { data, error } = await supabase
      .from("player_profiles")
      .select("user_id, profile_data, revision, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
  
    if (error) {
      throw error;
    }
  
    if (!data) {
      return null;
    }
  
    const row = data as CloudProfileRow;
  
    return {
      profile: row.profile_data,
      revision: row.revision,
    };
  }
  
  
  /**
   * Save the player's complete profile.
   *
   * Upsert creates a row if it doesn't exist
   * or updates the existing row.
   */


  export async function saveCloudProfile(
    userId: string,
    profile: PlayerProfile,
    expectedRevision: number
  ): Promise<number> {
    const { data: authData, error: authError } =
      await supabase.auth.getUser();
  
    if (
      authError ||
      authData.user?.id !== userId
    ) {
      throw new Error(
        "Cannot save profile: account session changed."
      );
    }
  
    const { data, error } = await supabase.rpc(
      "save_player_profile",
      {
        incoming_profile: profile,
        expected_revision: expectedRevision,
      }
    );
  
    if (error) {
      throw error;
    }
  
    if (typeof data !== "number") {
      throw new Error(
        "Supabase did not return a profile revision."
      );
    }
  
    return data;
  }
  
  
  
  /**
   * Load the signed-in player's preferences.
   */
  export async function loadCloudPreferences(
    userId: string
  ): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from("user_preferences")
      .select(
        "user_id, preferences_data, updated_at"
      )
      .eq("user_id", userId)
      .maybeSingle();
  
    if (error) {
      throw error;
    }
  
    if (!data) {
      return null;
    }
  
    const row = data as CloudPreferencesRow;
  
    return row.preferences_data;
  }
  
  /**
   * Save the player's preferences.
   */
  export async function saveCloudPreferences(
    userId: string,
    preferences: UserPreferences
  ): Promise<void> {
    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          preferences_data: preferences,
        },
        {
          onConflict: "user_id",
        }
      );
  
    if (error) {
      throw error;
    }
  }
  