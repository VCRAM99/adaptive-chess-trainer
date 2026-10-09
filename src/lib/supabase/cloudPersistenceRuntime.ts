import type { PlayerProfile } from "../profile/types";
import type { UserPreferences } from "../preferences/types";
import { supabase } from "./client";
import {
  createPreferencesCloudSaver,
  createProfileCloudSaver,
  type CloudPersistenceNotice,
  type ConfirmedConflict,
  type DiscardedCloudConflict,
  type SavedCloudProfile,
} from "./cloudPersistence";
import { preferencesSaveQueue, profileSaveQueue } from "./saveQueues";
import { loadCloudProfile, saveCloudPreferences, saveCloudProfile } from "./storage";

export type CloudPersistenceUpdate = {
  notice: CloudPersistenceNotice | null;
  profileSaved?: SavedCloudProfile;
};

const listeners = new Set<(update: CloudPersistenceUpdate) => void>();

let profileNotice: CloudPersistenceNotice | null = null;
let preferencesNotice: CloudPersistenceNotice | null = null;

function mergedNotice(): CloudPersistenceNotice | null {
  const rank = {
    conflict: 3,
    error: 2,
    pending: 1,
  };
  const notices = [profileNotice, preferencesNotice].filter(
    (notice): notice is CloudPersistenceNotice => notice !== null,
  );

  notices.sort((left, right) => rank[right.tone] - rank[left.tone]);

  return notices[0] ?? null;
}

function publish(profileSaved?: SavedCloudProfile) {
  const update = {
    notice: mergedNotice(),
    profileSaved,
  };

  for (const listener of listeners) {
    listener(update);
  }
}

async function getSessionUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user?.id ?? null;
}

const profileSaver = createProfileCloudSaver({
  enqueue: profileSaveQueue.enqueue,
  saveProfile: saveCloudProfile,
  loadProfile: loadCloudProfile,
  getSessionUserId,
  onChange(update) {
    profileNotice = update.notice;
    publish(update.saved);
  },
});

const preferencesSaver = createPreferencesCloudSaver({
  enqueue: preferencesSaveQueue.enqueue,
  savePreferences: saveCloudPreferences,
  getSessionUserId,
  onChange(notice) {
    preferencesNotice = notice;
    publish();
  },
});

export function requestProfileCloudSave(input: {
  userId: string;
  profile: PlayerProfile;
  expectedRevision: number;
  baseSerialized: string | null;
}): void {
  profileSaver.requestSave(input);
}

export function requestPreferencesCloudSave(input: {
  userId: string;
  preferences: UserPreferences;
}): void {
  preferencesSaver.requestSave(input);
}

export function cancelPendingCloudSaves(): void {
  profileSaver.cancel();
  preferencesSaver.cancel();
}

export function retryPendingCloudSaves(): void {
  profileSaver.retry();
  preferencesSaver.retry();
}

export function uploadConflictingLocalProfile(expected: ConfirmedConflict): boolean {
  return profileSaver.uploadLocal(expected);
}

export function discardConflictingLocalProfile(
  expected: ConfirmedConflict,
): DiscardedCloudConflict | null {
  return profileSaver.useServerProfile(expected);
}

export function getProfileConflict(): ConfirmedConflict | null {
  return profileSaver.conflictSnapshot();
}

export function hasPendingCloudWork(): boolean {
  return profileSaver.hasPending() || preferencesSaver.hasPending();
}

export function subscribeCloudPersistence(
  listener: (update: CloudPersistenceUpdate) => void,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
