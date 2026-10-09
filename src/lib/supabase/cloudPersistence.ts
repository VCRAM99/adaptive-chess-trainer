import type { PlayerProfile } from "../profile/types";
import type { UserPreferences } from "../preferences/types";
import { isAccountSessionError, isStaleRevisionError, isTransientCloudError } from "./cloudErrors";

/**
 * Failed cloud writes stay pending and retry with bounded backoff:
 * 500ms, 1s, 2s, then 4s. The fifth failure is reported and not
 * scheduled again, so a down network cannot loop forever.
 */
export const CLOUD_SAVE_RETRY_DELAYS_MS = [500, 1000, 2000, 4000] as const;

/**
 * A stale revision is reloaded and written again only when the server
 * profile is still the base this edit started from. Two of those
 * rebases are allowed. After that the conflict is left for the user.
 */
export const MAX_SAFE_REVISION_REBASES = 2;

export const CLOUD_SAVE_PENDING_MESSAGE = "Progress is not saved yet. Retrying...";

export const CLOUD_SAVE_ERROR_MESSAGE =
  "Progress could not be saved. Your latest changes are still on this device.";

export const CLOUD_CONFLICT_MESSAGE =
  "This account was updated somewhere else. Your unsaved progress is still on this device and was not uploaded.";

export const CLOUD_SESSION_MESSAGE =
  "Your account session changed. Unsaved progress was not uploaded.";

export const CLOUD_CONFLICT_CHECK_MESSAGE =
  "Cloud progress could not be checked, so the latest changes stayed on this device.";

export type CloudPersistenceNotice = {
  tone: "pending" | "error" | "conflict";
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  userId?: string;
  serverRevision?: number;
};

export type ConfirmedConflict = {
  userId: string;
  serverRevision: number;
};

export type CloudProfileSnapshot = {
  profile: PlayerProfile;
  revision: number;
};

export type SavedCloudProfile = {
  userId: string;
  revision: number;
  serializedProfile: string;
};

export type DiscardedCloudConflict = {
  userId: string;
  profile: PlayerProfile;
  revision: number;
};

type NoticeUpdate = {
  notice: CloudPersistenceNotice | null;
  saved?: SavedCloudProfile;
};

type Schedule = (delayMs: number, run: () => void) => () => void;

type Enqueue = <T>(operation: () => Promise<T>) => Promise<T>;

export function serializePlayerProfile(profile: PlayerProfile): string {
  return stableStringify(profile);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function defaultSchedule(delayMs: number, run: () => void): () => void {
  const timer = setTimeout(run, delayMs);

  return () => {
    clearTimeout(timer);
  };
}

const PENDING_NOTICE: CloudPersistenceNotice = {
  tone: "pending",
  message: CLOUD_SAVE_PENDING_MESSAGE,
};

const ERROR_NOTICE: CloudPersistenceNotice = {
  tone: "error",
  message: CLOUD_SAVE_ERROR_MESSAGE,
  primaryLabel: "Try again",
};

const SESSION_NOTICE: CloudPersistenceNotice = {
  tone: "error",
  message: CLOUD_SESSION_MESSAGE,
  primaryLabel: "Try again",
};

const CONFLICT_ACTIONS: Pick<
  CloudPersistenceNotice,
  "primaryLabel" | "secondaryLabel" | "message" | "tone"
> = {
  tone: "conflict",
  message: CLOUD_CONFLICT_MESSAGE,
  primaryLabel: "Upload my progress",
  secondaryLabel: "Use cloud progress",
};

function conflictNotice(snapshot: {
  userId: string;
  serverRevision: number;
}): CloudPersistenceNotice {
  return {
    ...CONFLICT_ACTIONS,
    userId: snapshot.userId,
    serverRevision: snapshot.serverRevision,
  };
}

type ProfileJob = {
  userId: string;
  profile: PlayerProfile;
  serialized: string;
  baseSerialized: string | null;
  expectedRevision: number;
  generation: number;
  attempts: number;
  rebases: number;
  explicitUpload: boolean;
};

export type ProfileCloudSaver = {
  requestSave(input: {
    userId: string;
    profile: PlayerProfile;
    expectedRevision: number;
    baseSerialized: string | null;
  }): void;
  cancel(): void;
  retry(): void;
  uploadLocal(expected: ConfirmedConflict): boolean;
  /**
   * Drops the pending local upload and returns the server snapshot
   * the user chose to keep. Does not write to the cloud.
   * A mismatched account or revision leaves the conflict in place.
   */
  useServerProfile(expected: ConfirmedConflict): DiscardedCloudConflict | null;
  whenIdle(): Promise<void>;
  pendingProfile(): PlayerProfile | null;
  hasPending(): boolean;
  conflictSnapshot(): ConfirmedConflict | null;
};

/**
 * Revision conflicts are resolved without merging games or Elo.
 *
 * 1. Reload the server profile and revision.
 * 2. If it is the same as the pending local profile, adopt that
 *    revision and do not write. This covers a save that succeeded
 *    but whose response was lost.
 * 3. If it is still the last profile we successfully based this
 *    edit on, send the local profile once with the new revision.
 *    The server content has not diverged, so this is the same
 *    write the RPC would have accepted.
 * 4. Otherwise keep the local profile pending, leave the server
 *    untouched, and ask the user to choose.
 * 5. An explicit "Upload my progress" writes once at the
 *    revision the user confirmed. If the server revision
 *    changes before that write lands, the local profile is
 *    not sent at the newer revision. The conflict notice
 *    stays up with the reloaded snapshot.
 */
export function createProfileCloudSaver(deps: {
  enqueue: Enqueue;
  saveProfile: (
    userId: string,
    profile: PlayerProfile,
    expectedRevision: number,
  ) => Promise<number>;
  loadProfile: (userId: string) => Promise<CloudProfileSnapshot | null>;
  getSessionUserId: () => Promise<string | null>;
  onChange: (update: NoticeUpdate) => void;
  schedule?: Schedule;
}): ProfileCloudSaver {
  const schedule = deps.schedule ?? defaultSchedule;
  let runChain: Promise<void> = Promise.resolve();
  let cancelTimer: (() => void) | null = null;
  let generation = 0;
  let job: ProfileJob | null = null;
  let conflict: {
    userId: string;
    serverProfile: PlayerProfile;
    serverRevision: number;
  } | null = null;

  function clearTimer() {
    cancelTimer?.();
    cancelTimer = null;
  }

  function publish(update: NoticeUpdate) {
    deps.onChange(update);
  }

  function scheduleAttempt(delayMs: number, generationAtSchedule: number) {
    clearTimer();
    cancelTimer = schedule(delayMs, () => {
      cancelTimer = null;

      if (job?.generation !== generationAtSchedule) return;

      enqueueAttempt(generationAtSchedule);
    });
  }

  function enqueueAttempt(generationAtStart: number) {
    runChain = runChain
      .then(() => execute(generationAtStart))
      .then(
        () => undefined,
        () => undefined,
      );
  }

  async function execute(generationAtStart: number): Promise<void> {
    await deps.enqueue(async () => {
      const current = job;

      if (!current || current.generation !== generationAtStart) return;

      try {
        const sessionUserId = await deps.getSessionUserId();

        if (job?.generation !== generationAtStart) return;

        if (sessionUserId !== current.userId) {
          if (current.explicitUpload) {
            keepExplicitConflict(current);
          } else {
            publish({ notice: SESSION_NOTICE });
          }
          return;
        }

        const revision = await deps.saveProfile(
          current.userId,
          current.profile,
          current.expectedRevision,
        );

        if (!job || job.generation !== generationAtStart) {
          if (job && job.userId === current.userId) {
            job = {
              ...job,
              expectedRevision: revision,
              baseSerialized: current.serialized,
            };
            enqueueAttempt(job.generation);
          }

          return;
        }

        job = null;
        conflict = null;
        publish({
          notice: null,
          saved: {
            userId: current.userId,
            revision,
            serializedProfile: current.serialized,
          },
        });
      } catch (error) {
        if (!job || job.generation !== generationAtStart) return;

        if (isStaleRevisionError(error)) {
          if (current.explicitUpload) {
            await restoreExplicitConflict(current);
          } else {
            await reconcile(current);
          }
          return;
        }

        if (current.explicitUpload) {
          keepExplicitConflict(current);
          return;
        }

        if (isAccountSessionError(error)) {
          publish({ notice: SESSION_NOTICE });
          return;
        }

        if (isTransientCloudError(error) && current.attempts < CLOUD_SAVE_RETRY_DELAYS_MS.length) {
          const delay = CLOUD_SAVE_RETRY_DELAYS_MS[current.attempts];
          job = {
            ...current,
            attempts: current.attempts + 1,
          };
          publish({ notice: PENDING_NOTICE });
          scheduleAttempt(delay, current.generation);
          return;
        }

        publish({ notice: ERROR_NOTICE });
      }
    });
  }

  async function reconcile(current: ProfileJob): Promise<void> {
    let server: CloudProfileSnapshot | null;

    try {
      server = await deps.loadProfile(current.userId);
    } catch {
      if (job?.generation !== current.generation) return;

      publish({
        notice: {
          tone: "error",
          message: CLOUD_CONFLICT_CHECK_MESSAGE,
          primaryLabel: "Try again",
        },
      });
      return;
    }

    if (!job || job.generation !== current.generation) return;

    if (!server) {
      conflict = null;
      publish({
        notice: {
          tone: "error",
          message: CLOUD_CONFLICT_CHECK_MESSAGE,
          primaryLabel: "Try again",
        },
      });
      return;
    }

    const serverSerialized = serializePlayerProfile(server.profile);

    if (serverSerialized === current.serialized) {
      job = null;
      conflict = null;
      publish({
        notice: null,
        saved: {
          userId: current.userId,
          revision: server.revision,
          serializedProfile: current.serialized,
        },
      });
      return;
    }

    const serverMatchesBase =
      current.baseSerialized !== null && serverSerialized === current.baseSerialized;

    if (serverMatchesBase && current.rebases < MAX_SAFE_REVISION_REBASES) {
      job = {
        ...current,
        expectedRevision: server.revision,
        rebases: current.rebases + 1,
      };
      enqueueAttempt(current.generation);
      return;
    }

    conflict = {
      userId: current.userId,
      serverProfile: server.profile,
      serverRevision: server.revision,
    };
    publish({ notice: conflictNotice(conflict) });
  }

  /**
   * An explicit upload was confirmed for one server revision.
   * If that revision is no longer current, reload the snapshot
   * and leave the conflict visible. Do not write the local
   * profile at the newer revision.
   */
  async function restoreExplicitConflict(current: ProfileJob) {
    let server: CloudProfileSnapshot | null = null;

    try {
      server = await deps.loadProfile(current.userId);
    } catch {
      // A failed reload leaves the conflict in place.
    }

    if (!job || job.generation !== current.generation) return;

    if (server && serializePlayerProfile(server.profile) === current.serialized) {
      job = null;
      conflict = null;
      publish({
        notice: null,
        saved: {
          userId: current.userId,
          revision: server.revision,
          serializedProfile: current.serialized,
        },
      });
      return;
    }

    if (server) {
      conflict = {
        userId: current.userId,
        serverProfile: server.profile,
        serverRevision: server.revision,
      };
    }

    keepExplicitConflict(current);
  }

  function keepExplicitConflict(current: ProfileJob) {
    if (!job || job.generation !== current.generation) return;

    job = {
      ...job,
      explicitUpload: false,
    };

    if (!conflict || conflict.userId !== current.userId) return;

    publish({ notice: conflictNotice(conflict) });
  }

  return {
    requestSave(input) {
      const serialized = serializePlayerProfile(input.profile);

      if (job && job.userId === input.userId && job.serialized === serialized) return;

      generation += 1;
      clearTimer();
      conflict = null;
      job = {
        userId: input.userId,
        profile: input.profile,
        serialized,
        baseSerialized: input.baseSerialized,
        expectedRevision: input.expectedRevision,
        generation,
        attempts: 0,
        rebases: 0,
        explicitUpload: false,
      };
      enqueueAttempt(generation);
    },

    cancel() {
      generation += 1;
      job = null;
      conflict = null;
      clearTimer();
      publish({ notice: null });
    },

    retry() {
      if (!job || conflict) return;

      job = {
        ...job,
        attempts: 0,
      };
      clearTimer();
      enqueueAttempt(job.generation);
    },

    uploadLocal(expected) {
      if (
        !job ||
        !conflict ||
        job.explicitUpload ||
        conflict.userId !== job.userId ||
        conflict.userId !== expected.userId ||
        conflict.serverRevision !== expected.serverRevision
      ) {
        return false;
      }

      job = {
        ...job,
        expectedRevision: conflict.serverRevision,
        attempts: 0,
        rebases: MAX_SAFE_REVISION_REBASES,
        explicitUpload: true,
      };
      clearTimer();
      enqueueAttempt(job.generation);
      return true;
    },

    useServerProfile(expected) {
      if (
        !conflict ||
        job?.explicitUpload ||
        conflict.userId !== expected.userId ||
        conflict.serverRevision !== expected.serverRevision
      ) {
        return null;
      }

      const chosen = conflict;
      job = null;
      conflict = null;
      clearTimer();
      generation += 1;
      publish({ notice: null });

      return {
        userId: chosen.userId,
        profile: chosen.serverProfile,
        revision: chosen.serverRevision,
      };
    },

    async whenIdle() {
      let seen = runChain;

      await seen;

      while (runChain !== seen) {
        seen = runChain;
        await seen;
      }
    },

    pendingProfile() {
      return job?.profile ?? null;
    },

    hasPending() {
      return job !== null;
    },

    conflictSnapshot() {
      if (!conflict) return null;

      return {
        userId: conflict.userId,
        serverRevision: conflict.serverRevision,
      };
    },
  };
}

type PreferenceJob = {
  userId: string;
  preferences: UserPreferences;
  serialized: string;
  generation: number;
  attempts: number;
};

export type PreferencesCloudSaver = {
  requestSave(input: { userId: string; preferences: UserPreferences }): void;
  cancel(): void;
  retry(): void;
  whenIdle(): Promise<void>;
  pendingPreferences(): UserPreferences | null;
  hasPending(): boolean;
};

export function createPreferencesCloudSaver(deps: {
  enqueue: Enqueue;
  savePreferences: (userId: string, preferences: UserPreferences) => Promise<void>;
  getSessionUserId: () => Promise<string | null>;
  onChange: (notice: CloudPersistenceNotice | null) => void;
  schedule?: Schedule;
}): PreferencesCloudSaver {
  const schedule = deps.schedule ?? defaultSchedule;
  let runChain: Promise<void> = Promise.resolve();
  let cancelTimer: (() => void) | null = null;
  let generation = 0;
  let job: PreferenceJob | null = null;

  function clearTimer() {
    cancelTimer?.();
    cancelTimer = null;
  }

  function scheduleAttempt(delayMs: number, generationAtSchedule: number) {
    clearTimer();
    cancelTimer = schedule(delayMs, () => {
      cancelTimer = null;

      if (job?.generation !== generationAtSchedule) return;

      enqueueAttempt(generationAtSchedule);
    });
  }

  function enqueueAttempt(generationAtStart: number) {
    runChain = runChain
      .then(() => execute(generationAtStart))
      .then(
        () => undefined,
        () => undefined,
      );
  }

  async function execute(generationAtStart: number): Promise<void> {
    await deps.enqueue(async () => {
      const current = job;

      if (!current || current.generation !== generationAtStart) return;

      try {
        const sessionUserId = await deps.getSessionUserId();

        if (job?.generation !== generationAtStart) return;

        if (sessionUserId !== current.userId) {
          deps.onChange(SESSION_NOTICE);
          return;
        }

        await deps.savePreferences(current.userId, current.preferences);

        if (!job || job.generation !== generationAtStart) {
          if (job && job.userId === current.userId) {
            enqueueAttempt(job.generation);
          }

          return;
        }

        job = null;
        deps.onChange(null);
      } catch (error) {
        if (!job || job.generation !== generationAtStart) return;

        if (isAccountSessionError(error)) {
          deps.onChange(SESSION_NOTICE);
          return;
        }

        if (isTransientCloudError(error) && current.attempts < CLOUD_SAVE_RETRY_DELAYS_MS.length) {
          const delay = CLOUD_SAVE_RETRY_DELAYS_MS[current.attempts];
          job = {
            ...current,
            attempts: current.attempts + 1,
          };
          deps.onChange(PENDING_NOTICE);
          scheduleAttempt(delay, current.generation);
          return;
        }

        deps.onChange(ERROR_NOTICE);
      }
    });
  }

  return {
    requestSave(input) {
      const serialized = JSON.stringify(input.preferences);

      if (job && job.userId === input.userId && job.serialized === serialized) return;

      generation += 1;
      clearTimer();
      job = {
        userId: input.userId,
        preferences: input.preferences,
        serialized,
        generation,
        attempts: 0,
      };
      enqueueAttempt(generation);
    },

    cancel() {
      generation += 1;
      job = null;
      clearTimer();
      deps.onChange(null);
    },

    retry() {
      if (!job) return;

      job = {
        ...job,
        attempts: 0,
      };
      clearTimer();
      enqueueAttempt(job.generation);
    },

    async whenIdle() {
      let seen = runChain;

      await seen;

      while (runChain !== seen) {
        seen = runChain;
        await seen;
      }
    },

    pendingPreferences() {
      return job?.preferences ?? null;
    },

    hasPending() {
      return job !== null;
    },
  };
}

export function createImmediateQueue(): {
  enqueue: Enqueue;
} {
  let pending: Promise<void> = Promise.resolve();

  return {
    enqueue(operation) {
      const result = pending.then(operation);

      pending = result.then(
        () => undefined,
        () => undefined,
      );

      return result;
    },
  };
}
