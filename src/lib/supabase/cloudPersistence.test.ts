import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultProfile } from "../profile/profileStorage";
import { createDefaultPreferences } from "../preferences/preferencesStorage";
import type { PlayerProfile } from "../profile/types";
import type { UserPreferences } from "../preferences/types";
import {
  CLOUD_CONFLICT_MESSAGE,
  CLOUD_SAVE_ERROR_MESSAGE,
  CLOUD_SAVE_PENDING_MESSAGE,
  CLOUD_SAVE_RETRY_DELAYS_MS,
  CLOUD_SESSION_MESSAGE,
  createImmediateQueue,
  createPreferencesCloudSaver,
  createProfileCloudSaver,
  serializePlayerProfile,
  type CloudPersistenceNotice,
  type SavedCloudProfile,
} from "./cloudPersistence";

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = () => done();
  });

  return { promise, resolve };
}

const transientFailure = new TypeError("Failed to fetch");

const staleRevision = {
  code: "P0001",
  message: "Profile revision conflict: expected revision does not match",
};

function withRating(profile: PlayerProfile, rating: number): PlayerProfile {
  return {
    ...profile,
    estimatedRating: rating,
    bestRating: Math.max(profile.bestRating, rating),
  };
}

describe("cloud profile saves", () => {
  const queue = createImmediateQueue();
  let sessionUserId: string | null;
  let profiles: PlayerProfile[];
  let revisions: number[];
  let saveImpl: (userId: string, profile: PlayerProfile, revision: number) => Promise<number>;
  let loadImpl: () => Promise<{ profile: PlayerProfile; revision: number } | null>;
  let saveCount: number;
  let notices: Array<CloudPersistenceNotice | null>;
  let saved: SavedCloudProfile[];
  let saver: ReturnType<typeof createProfileCloudSaver>;
  let base: PlayerProfile;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    base = createDefaultProfile();
    sessionUserId = "user-1";
    profiles = [];
    revisions = [];
    notices = [];
    saved = [];
    saveCount = 0;
    saveImpl = async (userId, profile, revision) => {
      void userId;
      profiles.push(profile);
      revisions.push(revision);
      return revision + 1;
    };
    loadImpl = async () => null;
    saver = createProfileCloudSaver({
      enqueue: queue.enqueue,
      saveProfile: async (userId, profile, revision) => {
        saveCount += 1;
        return saveImpl(userId, profile, revision);
      },
      loadProfile: async () => loadImpl(),
      getSessionUserId: async () => sessionUserId,
      onChange(update) {
        notices.push(update.notice);
        if (update.saved) {
          saved.push(update.saved);
        }
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function saveProfile(
    profile: PlayerProfile,
    expectedRevision = 1,
    baseProfile: PlayerProfile | null = base,
  ) {
    saver.requestSave({
      userId: "user-1",
      profile,
      expectedRevision,
      baseSerialized: baseProfile ? serializePlayerProfile(baseProfile) : null,
    });
    await saver.whenIdle();
  }

  it("saves once and records the returned revision", async () => {
    const profile = withRating(base, 840);

    await saveProfile(profile, 3);

    expect(saveCount).toBe(1);
    expect(revisions).toEqual([3]);
    expect(saved).toEqual([
      {
        userId: "user-1",
        revision: 4,
        serializedProfile: serializePlayerProfile(profile),
      },
    ]);
    expect(notices.at(-1)).toBeNull();
    expect(saver.pendingProfile()).toBeNull();
  });

  it("retries a transient failure and then saves", async () => {
    let failed = false;
    saveImpl = async (userId, profile, revision) => {
      void userId;
      if (!failed) {
        failed = true;
        throw transientFailure;
      }

      profiles.push(profile);
      revisions.push(revision);
      return revision + 1;
    };

    const profile = withRating(base, 860);
    saver.requestSave({
      userId: "user-1",
      profile,
      expectedRevision: 2,
      baseSerialized: serializePlayerProfile(base),
    });
    await saver.whenIdle();

    expect(saveCount).toBe(1);
    expect(notices.at(-1)?.message).toBe(CLOUD_SAVE_PENDING_MESSAGE);
    expect(saver.pendingProfile()).toEqual(profile);

    await vi.advanceTimersByTimeAsync(CLOUD_SAVE_RETRY_DELAYS_MS[0]);
    await saver.whenIdle();

    expect(saveCount).toBe(2);
    expect(profiles[0]).toEqual(profile);
    expect(saved[0]?.revision).toBe(3);
    expect(saver.pendingProfile()).toBeNull();
  });

  it("stops after the retry limit and reports the unsaved profile", async () => {
    saveImpl = async () => {
      throw transientFailure;
    };
    const profile = withRating(base, 870);

    saver.requestSave({
      userId: "user-1",
      profile,
      expectedRevision: 1,
      baseSerialized: serializePlayerProfile(base),
    });
    await saver.whenIdle();

    for (const delay of CLOUD_SAVE_RETRY_DELAYS_MS) {
      await vi.advanceTimersByTimeAsync(delay);
      await saver.whenIdle();
    }

    await vi.advanceTimersByTimeAsync(30_000);
    await saver.whenIdle();

    expect(saveCount).toBe(CLOUD_SAVE_RETRY_DELAYS_MS.length + 1);
    expect(notices.at(-1)).toMatchObject({
      tone: "error",
      message: CLOUD_SAVE_ERROR_MESSAGE,
    });
    expect(saver.pendingProfile()).toEqual(profile);
    expect(saved).toEqual([]);
  });

  it("lets a newer local profile replace an older retry", async () => {
    let failed = false;
    saveImpl = async (userId, profile, revision) => {
      void userId;
      if (!failed) {
        failed = true;
        throw transientFailure;
      }

      profiles.push(profile);
      revisions.push(revision);
      return revision + 1;
    };
    const older = withRating(base, 810);
    const newer = withRating(base, 910);

    saver.requestSave({
      userId: "user-1",
      profile: older,
      expectedRevision: 1,
      baseSerialized: serializePlayerProfile(base),
    });
    await saver.whenIdle();

    saver.requestSave({
      userId: "user-1",
      profile: newer,
      expectedRevision: 1,
      baseSerialized: serializePlayerProfile(base),
    });
    await saver.whenIdle();
    await vi.advanceTimersByTimeAsync(30_000);
    await saver.whenIdle();

    expect(profiles).toEqual([newer]);
    expect(saved[0]?.serializedProfile).toBe(serializePlayerProfile(newer));
  });

  it("does not apply an older in-flight save over a newer profile", async () => {
    let releaseFirst: (revision: number) => void = () => undefined;
    const started = deferred();
    const older = withRating(base, 820);
    const newer = withRating(base, 920);

    saveImpl = async (userId, profile, revision) => {
      void userId;
      profiles.push(profile);
      revisions.push(revision);

      if (profiles.length === 1) {
        started.resolve();
        return new Promise<number>((resolve) => {
          releaseFirst = resolve;
        });
      }

      return revision + 1;
    };

    saver.requestSave({
      userId: "user-1",
      profile: older,
      expectedRevision: 1,
      baseSerialized: serializePlayerProfile(base),
    });
    await started.promise;

    saver.requestSave({
      userId: "user-1",
      profile: newer,
      expectedRevision: 1,
      baseSerialized: serializePlayerProfile(base),
    });
    releaseFirst(2);
    await saver.whenIdle();

    expect(profiles).toEqual([older, newer]);
    expect(revisions).toEqual([1, 2]);
    expect(saved.map((entry) => entry.serializedProfile)).toEqual([serializePlayerProfile(newer)]);
  });

  it("drops a pending retry on sign-out", async () => {
    saveImpl = async () => {
      throw transientFailure;
    };
    const profile = withRating(base, 830);

    saver.requestSave({
      userId: "user-1",
      profile,
      expectedRevision: 1,
      baseSerialized: serializePlayerProfile(base),
    });
    await saver.whenIdle();
    saver.cancel();
    await vi.advanceTimersByTimeAsync(30_000);
    await saver.whenIdle();

    expect(saveCount).toBe(1);
    expect(saver.pendingProfile()).toBeNull();
    expect(notices.at(-1)).toBeNull();
  });

  it("ignores an in-flight result after an account switch", async () => {
    let releaseFirst: (revision: number) => void = () => undefined;
    const started = deferred();
    const firstAccount = withRating(base, 840);
    const secondAccount = withRating(base, 700);

    saveImpl = async (userId, profile, revision) => {
      profiles.push(profile);
      revisions.push(revision);

      if (userId === "user-1") {
        started.resolve();
        return new Promise<number>((resolve) => {
          releaseFirst = resolve;
        });
      }

      return revision + 1;
    };

    saver.requestSave({
      userId: "user-1",
      profile: firstAccount,
      expectedRevision: 4,
      baseSerialized: serializePlayerProfile(base),
    });
    await started.promise;
    saver.cancel();
    sessionUserId = "user-2";
    saver.requestSave({
      userId: "user-2",
      profile: secondAccount,
      expectedRevision: 0,
      baseSerialized: null,
    });
    releaseFirst(5);
    await saver.whenIdle();

    expect(saved).toEqual([
      {
        userId: "user-2",
        revision: 1,
        serializedProfile: serializePlayerProfile(secondAccount),
      },
    ]);
    expect(saver.pendingProfile()).toBeNull();
  });

  it("does not write a profile for a different signed-in user", async () => {
    sessionUserId = "user-2";
    const profile = withRating(base, 880);

    await saveProfile(profile);

    expect(saveCount).toBe(0);
    expect(saver.pendingProfile()).toEqual(profile);
    expect(notices.at(-1)?.message).toBe(CLOUD_SESSION_MESSAGE);
  });

  it("adopts the server revision when the pending profile is already stored", async () => {
    const profile = withRating(base, 890);
    saveImpl = async () => {
      throw staleRevision;
    };
    loadImpl = async () => ({
      profile,
      revision: 8,
    });

    await saveProfile(profile, 3);

    expect(saveCount).toBe(1);
    expect(saved).toEqual([
      {
        userId: "user-1",
        revision: 8,
        serializedProfile: serializePlayerProfile(profile),
      },
    ]);
  });

  it("retries with the new revision when the server still has the edit base", async () => {
    const local = withRating(base, 900);
    let failed = false;
    saveImpl = async (userId, profile, revision) => {
      void userId;
      if (!failed) {
        failed = true;
        throw staleRevision;
      }

      profiles.push(profile);
      revisions.push(revision);
      return revision + 1;
    };
    loadImpl = async () => ({
      profile: base,
      revision: 6,
    });

    await saveProfile(local, 2, base);

    expect(profiles).toEqual([local]);
    expect(revisions).toEqual([6]);
    expect(saved[0]?.revision).toBe(7);
  });

  it("keeps unsaved local progress when the server profile diverged", async () => {
    const local = withRating(base, 910);
    const server = withRating(base, 640);
    saveImpl = async () => {
      throw staleRevision;
    };
    loadImpl = async () => ({
      profile: server,
      revision: 9,
    });

    await saveProfile(local, 2, base);

    expect(saveCount).toBe(1);
    expect(profiles).toEqual([]);
    expect(saver.pendingProfile()).toEqual(local);
    expect(notices.at(-1)).toMatchObject({
      tone: "conflict",
      message: CLOUD_CONFLICT_MESSAGE,
    });

    const chosen = saver.useServerProfile({
      userId: "user-1",
      serverRevision: 9,
    });

    expect(saveCount).toBe(1);
    expect(chosen).toEqual({
      userId: "user-1",
      profile: server,
      revision: 9,
    });
    expect(saver.pendingProfile()).toBeNull();
  });

  it("uploads the local profile only after the user chooses to", async () => {
    const local = withRating(base, 930);
    const server = withRating(base, 650);
    let failed = false;
    saveImpl = async (userId, profile, revision) => {
      void userId;
      if (!failed) {
        failed = true;
        throw staleRevision;
      }

      profiles.push(profile);
      revisions.push(revision);
      return revision + 1;
    };
    loadImpl = async () => ({
      profile: server,
      revision: 11,
    });

    await saveProfile(local, 4, base);
    expect(profiles).toEqual([]);

    expect(
      saver.uploadLocal({
        userId: "user-1",
        serverRevision: 11,
      }),
    ).toBe(true);
    await saver.whenIdle();

    expect(profiles).toEqual([local]);
    expect(revisions).toEqual([11]);
    expect(saved[0]?.revision).toBe(12);
  });

  it("leaves the conflict in place when upload confirmation is stale", async () => {
    const local = withRating(base, 940);
    const server = withRating(base, 660);
    saveImpl = async () => {
      throw staleRevision;
    };
    loadImpl = async () => ({
      profile: server,
      revision: 5,
    });

    await saveProfile(local, 1, base);
    const callsBefore = saveCount;

    expect(
      saver.uploadLocal({
        userId: "user-2",
        serverRevision: 5,
      }),
    ).toBe(false);
    expect(
      saver.useServerProfile({
        userId: "user-1",
        serverRevision: 4,
      }),
    ).toBeNull();

    expect(saveCount).toBe(callsBefore);
    expect(saver.pendingProfile()).toEqual(local);
    expect(saver.conflictSnapshot()).toEqual({
      userId: "user-1",
      serverRevision: 5,
    });
    expect(notices.at(-1)).toMatchObject({
      tone: "conflict",
      userId: "user-1",
      serverRevision: 5,
    });
  });

  it("does not write a newer server revision that arrives before upload", async () => {
    const local = withRating(base, 950);
    const firstServer = withRating(base, 670);
    const newerServer = withRating(base, 990);
    let loads = 0;
    saveImpl = async () => {
      throw staleRevision;
    };
    loadImpl = async () => {
      loads += 1;
      return loads === 1
        ? { profile: firstServer, revision: 5 }
        : { profile: newerServer, revision: 8 };
    };

    await saveProfile(local, 2, base);
    expect(saver.conflictSnapshot()).toEqual({
      userId: "user-1",
      serverRevision: 5,
    });

    expect(
      saver.uploadLocal({
        userId: "user-1",
        serverRevision: 5,
      }),
    ).toBe(true);
    await saver.whenIdle();

    expect(profiles).toEqual([]);
    expect(revisions).toEqual([]);
    expect(saver.pendingProfile()).toEqual(local);
    expect(saver.conflictSnapshot()).toEqual({
      userId: "user-1",
      serverRevision: 8,
    });
    expect(notices.at(-1)).toMatchObject({
      tone: "conflict",
      message: CLOUD_CONFLICT_MESSAGE,
      serverRevision: 8,
    });
  });
});

describe("cloud preference saves", () => {
  let sessionUserId: string | null;
  let savedPreferences: UserPreferences[];
  let notices: Array<CloudPersistenceNotice | null>;
  let saver: ReturnType<typeof createPreferencesCloudSaver>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    sessionUserId = "user-1";
    savedPreferences = [];
    notices = [];
    saver = createPreferencesCloudSaver({
      enqueue: createImmediateQueue().enqueue,
      savePreferences: async (userId, preferences) => {
        if (userId !== "user-1") {
          throw new Error("Unexpected preference account.");
        }

        savedPreferences.push(preferences);
      },
      getSessionUserId: async () => sessionUserId,
      onChange(notice) {
        notices.push(notice);
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not save preferences for a mismatched session", async () => {
    sessionUserId = "user-2";
    const preferences: UserPreferences = {
      ...createDefaultPreferences(),
      accentTheme: "teal",
    };

    saver.requestSave({
      userId: "user-1",
      preferences,
    });
    await saver.whenIdle();

    expect(savedPreferences).toEqual([]);
    expect(saver.pendingPreferences()).toEqual(preferences);
    expect(notices.at(-1)?.message).toBe(CLOUD_SESSION_MESSAGE);
  });

  it("cancels a pending preference save when the account changes", async () => {
    const preferences = createDefaultPreferences();
    let release: () => void = () => undefined;
    const started = deferred();
    const writes: string[] = [];

    saver = createPreferencesCloudSaver({
      enqueue: createImmediateQueue().enqueue,
      savePreferences: async (userId) => {
        writes.push(userId);
        if (userId === "user-1") {
          started.resolve();
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        }
      },
      getSessionUserId: async () => sessionUserId,
      onChange(notice) {
        notices.push(notice);
      },
    });

    saver.requestSave({
      userId: "user-1",
      preferences,
    });
    await started.promise;
    saver.cancel();
    sessionUserId = "user-2";
    saver.requestSave({
      userId: "user-2",
      preferences: {
        ...preferences,
        pieceSet: "modern",
      },
    });
    release();
    await saver.whenIdle();

    expect(writes).toEqual(["user-1", "user-2"]);
    expect(notices.at(-1)).toBeNull();
  });
});
