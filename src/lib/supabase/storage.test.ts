// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultPreferences } from "../preferences/preferencesStorage";
import {
  createDefaultProfile,
  loadProfile,
  saveProfile,
} from "../profile/profileStorage";
import type { PlayerProfile } from "../profile/types";
import type { UserPreferences } from "../preferences/types";
import { InvalidCloudDataError } from "./cloudErrors";
import { supabase } from "./client";
import { loadPlayerStorage } from "./accountStorage";
import {
  loadCloudPreferences,
  loadCloudProfile,
  saveCloudPreferences,
  saveCloudProfile,
} from "./storage";

vi.mock("./client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const getUser = vi.mocked(supabase.auth.getUser);
const from = vi.mocked(supabase.from);
const rpc = vi.mocked(supabase.rpc);

function signedInAs(userId: string | null) {
  getUser.mockResolvedValue({
    data: {
      user: userId ? { id: userId } : null,
    },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
}

function mockTables(results: Record<string, { data: unknown; error: unknown }>) {
    from.mockImplementation(((table: string) => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      maybeSingle: () =>
        Promise.resolve(
          results[table] ?? { data: null, error: null }
        ),
      upsert: vi.fn(async () => ({ error: null })),
    };

    return builder;
  }) as unknown as typeof supabase.from);
}

describe("cloud storage validation", () => {
  beforeEach(() => {
    localStorage.clear();
    getUser.mockReset();
    from.mockReset();
    rpc.mockReset();
    signedInAs("user-1");
  });

  it("saves a profile with the expected revision", async () => {
    const profile = createDefaultProfile();
    rpc.mockResolvedValue({ data: 4, error: null } as never);

    await expect(saveCloudProfile("user-1", profile, 3)).resolves.toBe(4);

    expect(rpc).toHaveBeenCalledWith("save_player_profile", {
      incoming_profile: profile,
      expected_revision: 3,
    });
  });

  it("refuses a profile write when the session belongs to someone else", async () => {
    signedInAs("user-2");

    await expect(
      saveCloudProfile("user-1", createDefaultProfile(), 1)
    ).rejects.toThrow(/account session changed/);

    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a preference write when the session belongs to someone else", async () => {
    signedInAs("user-2");

    await expect(
      saveCloudPreferences("user-1", createDefaultPreferences())
    ).rejects.toThrow(/account session changed/);

    expect(from).not.toHaveBeenCalled();
  });

  it("writes preferences only after the session matches", async () => {
    const preferences: UserPreferences = {
      ...createDefaultPreferences(),
      accentTheme: "teal",
    };
    const upsert = vi.fn(async () => ({ error: null }));
    from.mockImplementation(((table: string) => {
      expect(table).toBe("user_preferences");

      return { upsert };
    }) as unknown as typeof supabase.from);

    await saveCloudPreferences("user-1", preferences);

    expect(getUser).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        preferences_data: preferences,
      },
      { onConflict: "user_id" }
    );
  });

  it("rejects an invalid cloud profile without saving a replacement", async () => {
    mockTables({
      player_profiles: {
        data: {
          user_id: "user-1",
          profile_data: { version: 1 },
          revision: 2,
          updated_at: "2026-10-08T00:00:00.000Z",
        },
        error: null,
      },
      user_preferences: { data: null, error: null },
    });

    await expect(loadCloudProfile("user-1")).rejects.toBeInstanceOf(
      InvalidCloudDataError
    );
    await expect(loadPlayerStorage("user-1")).rejects.toThrow(
      /left unchanged/
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects invalid cloud preferences without saving defaults", async () => {
    mockTables({
      player_profiles: { data: null, error: null },
      user_preferences: {
        data: {
          user_id: "user-1",
          preferences_data: {
            version: 1,
            accentTheme: "not-a-theme",
          },
          updated_at: "2026-10-08T00:00:00.000Z",
        },
        error: null,
      },
    });

    await expect(loadCloudPreferences("user-1")).rejects.toBeInstanceOf(
      InvalidCloudDataError
    );
    await expect(loadPlayerStorage("user-1")).rejects.toThrow(
      /left unchanged/
    );
    expect(rpc).not.toHaveBeenCalled();
    expect(from.mock.calls.some((call) => call[0] === "user_preferences")).toBe(
      true
    );
  });

  it("keeps guest progress separate from an account profile", async () => {
    const guest: PlayerProfile = {
      ...createDefaultProfile(),
      estimatedRating: 1200,
      bestRating: 1200,
    };
    saveProfile(guest);

    const account = {
      ...createDefaultProfile(),
      estimatedRating: 860,
      bestRating: 860,
    };
    mockTables({
      player_profiles: {
        data: {
          user_id: "user-1",
          profile_data: account,
          revision: 3,
          updated_at: "2026-10-08T00:00:00.000Z",
        },
        error: null,
      },
      user_preferences: {
        data: {
          user_id: "user-1",
          preferences_data: createDefaultPreferences(),
          updated_at: "2026-10-08T00:00:00.000Z",
        },
        error: null,
      },
    });

    const loaded = await loadPlayerStorage("user-1");

    expect(loaded.profile.estimatedRating).toBe(860);
    expect(loaded.profileRevision).toBe(3);
    expect(loadProfile().estimatedRating).toBe(1200);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not read or write the cloud for a guest", async () => {
    const guest = {
      ...createDefaultProfile(),
      estimatedRating: 740,
      bestRating: 740,
    };
    saveProfile(guest);

    const loaded = await loadPlayerStorage(null);

    expect(loaded.profile.estimatedRating).toBe(740);
    expect(loaded.profileRevision).toBeNull();
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("uses revision 0 when the account has no cloud profile yet", async () => {
    mockTables({
      player_profiles: { data: null, error: null },
      user_preferences: { data: null, error: null },
    });

    const loaded = await loadPlayerStorage("user-1");

    expect(loaded.profileRevision).toBe(0);
    expect(loaded.profile.games).toEqual([]);
    expect(loaded.preferences).toEqual(createDefaultPreferences());
    expect(rpc).not.toHaveBeenCalled();
  });
});
