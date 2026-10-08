/**
 * Classifies failures from cloud profile and preference writes.
 *
 * `save_player_profile` updates the signed-in user's row only when
 * `expected_revision` matches `player_profiles.revision`, then returns
 * the new revision. A mismatch comes back as a PostgREST error. The
 * client treats that as a stale revision and does not write again
 * until a safe rebase or an explicit user choice.
 */

export class InvalidCloudDataError extends Error {
  readonly area: "profile" | "preferences";

  constructor(area: "profile" | "preferences") {
    super(
      area === "profile"
        ? "Saved cloud progress could not be read, so it was left unchanged."
        : "Saved cloud preferences could not be read, so they were left unchanged."
    );
    this.name = "InvalidCloudDataError";
    this.area = area;
  }
}

type ErrorRecord = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
  status?: unknown;
};

function asRecord(error: unknown): ErrorRecord | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as ErrorRecord;
}

function errorText(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  const record = asRecord(error);

  if (!record) {
    return "";
  }

  return [record.message, record.details, record.hint]
    .filter((part): part is string => typeof part === "string")
    .join(" ");
}

function errorCode(error: unknown): string {
  const code = asRecord(error)?.code;

  return typeof code === "string" ? code : "";
}

function errorStatus(error: unknown): number | null {
  const status = asRecord(error)?.status;

  return typeof status === "number" ? status : null;
}

export function isAccountSessionError(error: unknown): boolean {
  return /account session changed/i.test(errorText(error));
}

/**
 * True when the server rejected `expected_revision`.
 * The match is on the RPC error text so the client does not
 * depend on a particular SQLSTATE beyond what PostgREST forwards.
 */
export function isStaleRevisionError(error: unknown): boolean {
  const text = errorText(error);
  const mentionsRevision = /revision/i.test(text);
  const mentionsConflict =
    /(stale|conflict|mismatch|expected|outdated|does not match)/i.test(
      text
    );

  if (mentionsRevision && mentionsConflict) {
    return true;
  }

  const status = errorStatus(error);

  return (
    (status === 409 || errorCode(error) === "409") &&
    /revision|conflict/i.test(text)
  );
}

const TRANSIENT_CODES = new Set([
  "408",
  "429",
  "500",
  "502",
  "503",
  "504",
  "08000",
  "08003",
  "08006",
  "40001",
  "40P01",
  "53300",
  "57P01",
  "57014",
]);

const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export function isTransientCloudError(error: unknown): boolean {
  if (isStaleRevisionError(error) || isAccountSessionError(error)) {
    return false;
  }

  if (error instanceof InvalidCloudDataError) {
    return false;
  }

  if (error instanceof TypeError) {
    return true;
  }

  const status = errorStatus(error);

  if (status !== null && TRANSIENT_STATUSES.has(status)) {
    return true;
  }

  if (TRANSIENT_CODES.has(errorCode(error))) {
    return true;
  }

  return /failed to fetch|network|timeout|temporar|econnreset|unavailable/i.test(
    errorText(error)
  );
}
