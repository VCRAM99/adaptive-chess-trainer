# Supabase client contract

This document records what the browser client expects from Supabase. It was written by reading the application code. It is not an export of the live database, and it is not a migration.

The client uses the publishable key in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (`src/lib/supabase/client.ts`). It does not use a service-role key. Tests replace the Supabase client with mocks, so a passing test suite does not show that row-level security or the SQL functions behave as described here.

## Player profiles

The client reads one table, `player_profiles`, and selects these columns:

| Column | How the client uses it |
| --- | --- |
| `user_id` | Filter (`.eq("user_id", userId)`) and a check that the returned row belongs to that id |
| `profile_data` | JSON body parsed by `parseStoredProfile` |
| `revision` | Non-negative integer. A missing row is treated as revision `0` |
| `updated_at` | Selected so the query names the column. The client does not read the value |

`loadCloudProfile` calls:

```text
from("player_profiles")
  .select("user_id, profile_data, revision, updated_at")
  .eq("user_id", userId)
  .maybeSingle()
```

`maybeSingle` means the client expects at most one row per `user_id`. No row returns `null`. The caller then starts that account at revision `0` with a default profile and does not write that default back just because the row was missing.

A row is kept only when all of the following are true:

- `user_id` equals the requested account id.
- `revision` is a JSON number, an integer, and `>= 0`. A numeric string does not qualify.
- `profile_data` passes `parseStoredProfile` in `src/lib/profile/profileStorage.ts`.

That profile shape is `version: 1`, string timestamps, finite `estimatedRating` and `bestRating`, and an array of games. Invalid JSON throws `InvalidCloudDataError`. The caller must not replace it with a default and save that default.

The client never calls `insert`, `update`, `upsert`, or `delete` on `player_profiles`. The only write is the `save_player_profile` RPC below.

## User preferences

The client reads and writes `user_preferences` with these columns:

| Column | How the client uses it |
| --- | --- |
| `user_id` | Filter on load, and the conflict target on upsert |
| `preferences_data` | JSON body parsed by `parseStoredPreferences` |
| `updated_at` | Selected on load. The client does not read the value |

There is no `revision` column in any preferences query.

Load:

```text
from("user_preferences")
  .select("user_id, preferences_data, updated_at")
  .eq("user_id", userId)
  .maybeSingle()
```

No row becomes the default preferences (purple accent, purple board, classic pieces) and is not written back merely because it was missing. Invalid `preferences_data` throws `InvalidCloudDataError` and is left unchanged. The accepted shape is `version: 1` plus one of the accent, board, and piece-set values in `src/lib/preferences/types.ts`.

Save, after `auth.getUser()` still matches `userId`:

```text
from("user_preferences").upsert(
  { user_id, preferences_data },
  { onConflict: "user_id" }
)
```

The `onConflict: "user_id"` option requires a unique constraint on `user_preferences.user_id`. The client does not send `updated_at`.

Preference saves are last-write-wins. They do not send or check a revision. They use the same transient retry schedule as profile saves (500 ms, 1 s, 2 s, then 4 s) and then stop. A session mismatch is not retried as a network error.

## `save_player_profile`

Called from `saveCloudProfile`:

```text
rpc("save_player_profile", {
  incoming_profile,    -- the PlayerProfile object
  expected_revision    -- non-negative integer the client last loaded
})
```

The client does not pass `user_id`. Before the call it checks `auth.getUser()` and refuses to send the RPC if that id is not the `userId` it intends to save. That check is only in the browser.

The client requires:

- Success returns a JSON number. That number becomes the stored revision for the next save. Any other JSON type, including a numeric string, is an error (`"Supabase did not return a profile revision."`). The client does not require a particular increment. Tests that return `expected_revision + 1` are using a mock, not a captured production response.
- A revision mismatch is a PostgREST error, not a successful payload. `isStaleRevisionError` treats an error as a conflict when the message mentions a revision and a conflict (`stale`, `conflict`, `mismatch`, `expected`, `outdated`, or `does not match`), or when the status or code is `409` and the text mentions a revision or a conflict. The unit-test fixture uses code `P0001` and the message `Profile revision conflict: expected revision does not match`. The live function's SQLSTATE is not in this repository.
- The compare-and-set must be atomic on the server. Two tabs can both hold the same `expected_revision`. If both writes were applied, one player's games and rating would disappear. The function has to update the signed-in user's row only when the stored revision still equals `expected_revision`, then return the new revision. A lost race must fail the RPC.

When no cloud row exists, the next save uses `expected_revision` `0`. The function therefore has to define what revision `0` means for a missing row. This repository does not show that definition.

Client behavior after a response, in `createProfileCloudSaver`:

1. A transient failure (network failure, timeout, or the listed HTTP and Postgres codes in `cloudErrors.ts`) retries at 500 ms, 1 s, 2 s, and 4 s. The fifth failure is reported and not scheduled again.
2. A stale revision is not one of those retries. The client reloads `player_profiles`.
3. If the reloaded profile is the same JSON as the pending local profile, the client adopts the server revision and does not write again.
4. If the server row is still the base this edit started from, the client sends the same local profile once with the new revision. It will do that at most twice (`MAX_SAFE_REVISION_REBASES`).
5. Otherwise it leaves the server row untouched and asks the user to upload the local profile or keep the cloud profile. Those choices are also bound to the revision the user was shown. A newer server revision cancels the write.

The client does not merge games or ratings from the two copies.

## `import_guest_profile`

Called from `importGuestProgress`, and only after the user asks to import:

```text
rpc("import_guest_profile", {
  incoming_profile    -- the guest PlayerProfile from localStorage
})
```

The client does not pass `user_id` or a revision. It ignores the RPC's return data and only checks `error`. After a success response it loads `player_profiles` again and adopts that row's revision. The local guest profile is not deleted.

Before the RPC, the client requires:

- `auth.getUser()` still matches the signed-in id.
- The guest profile has progress: at least one stored game, or `estimatedRating` or `bestRating` different from the default `700`.
- The account profile has no such progress. A missing cloud row is treated as that default profile, so it counts as empty.

If either check fails, the RPC is not called. "This account already has progress." and "There is no guest progress to import." are client errors, not server errors.

Those checks can be skipped by calling the API directly. The function itself must refuse to replace an account that already has progress, using the signed-in user from the session rather than a caller-supplied id. This repository does not contain that SQL, so the server rule is not verified here. The client's definition of "empty" (no games and both ratings still `700`) is also not verified as the database's definition.

The import runs on the same profile save queue as `save_player_profile`, so a queued profile write cannot overlap the import inside this browser tab. That queue does not coordinate with another tab or another client.

## Authentication and row-level security

Ownership is the Supabase Auth user id. Email/password sign-up, password sign-in, password recovery, and Google sign-in all end in that id. Profile and preference calls pass the same id the session reported, and writes call `auth.getUser()` again immediately before the request.

The browser checks are not access control. A request made with a user's JWT outside this app can omit them. The database has to enforce the following. None of it has been confirmed against the deployed project:

- `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `player_profiles` and `user_preferences` apply only to rows whose `user_id` is `auth.uid()`.
- `player_profiles` writes that must preserve the revision check go through `save_player_profile`. A direct `UPDATE` or `UPSERT` from the signed-in role would skip the optimistic revision, so that path should be denied if the RPC is the only intended writer. The client never uses it.
- `user_preferences` writes are direct upserts, so the signed-in role needs `INSERT` and `UPDATE` on its own row only, with a unique `user_id`.
- Neither RPC receives a target user id. Each function has to take the account from `auth.uid()` and write only that account. If a function is `SECURITY DEFINER`, it bypasses row-level security and runs with the owner's privileges. In that case the function body itself must reject anonymous callers and must not trust a user id from the argument list. If a function is `SECURITY INVOKER`, row-level security still applies, and the function still must not write a row for a different `user_id`. This repository does not say which mode either function uses.

`import_guest_profile` has the same requirement: even when the browser's empty-account check is skipped, the function must not overwrite progress that is already stored for `auth.uid()`.

## What this repository does not verify

The live SQL function bodies have not been exported or verified in this batch. The deployed row-level security policies have not been exported or verified in this batch.

This file is not an executable migration. Do not use it to recreate production policies or functions without reviewing the actual database definitions.

A later audit or migration export should check:

- [ ] `save_player_profile(incoming_profile, expected_revision)` updates only `auth.uid()`'s `player_profiles` row, and only when `revision` still equals `expected_revision`.
- [ ] That comparison and the revision change commit together, so two callers with the same expected revision cannot both succeed.
- [ ] The success result is a JSON number, which the client stores as the next expected revision.
- [ ] A mismatch raises an error the client classifies as a revision conflict, and does not return a successful number.
- [ ] The function's behavior for `expected_revision` `0` when no row exists matches the client's first save.
- [ ] `import_guest_profile(incoming_profile)` writes only `auth.uid()`'s row and rejects an account that already has progress.
- [ ] Both functions, if `SECURITY DEFINER`, check `auth.uid()` inside the function and do not accept a caller-chosen user id.
- [ ] Exported policies for `player_profiles` and `user_preferences` limit every command to `user_id = auth.uid()`.
- [ ] Direct changes to `player_profiles` are denied for the signed-in role if profile writes are supposed to go through `save_player_profile`.
- [ ] `user_preferences.user_id` is unique, so the client's `onConflict: "user_id"` upsert has one target row.
- [ ] The export is reviewed as the source of truth before any recreation of the project. This document is only the client contract.
