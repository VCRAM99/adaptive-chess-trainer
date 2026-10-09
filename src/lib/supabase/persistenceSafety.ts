import type { ConfirmedConflict } from "./cloudPersistence";

export const CONFLICT_UPLOAD_CONFIRMATION = {
  title: "Replace cloud progress?",
  description:
    "This will replace the current cloud profile for this account with the progress on this device.",
  warning: "The profile stored in the cloud will be overwritten.",
  confirmLabel: "Replace cloud progress",
};

export const CONFLICT_USE_CLOUD_CONFIRMATION = {
  title: "Use cloud progress?",
  description:
    "Unsaved progress on this device will be discarded and replaced with the cloud profile.",
  warning: "Games and rating changes that have not been uploaded will be lost.",
  confirmLabel: "Discard unsaved progress",
};

export const SIGN_OUT_CONFIRMATION = {
  title: "Sign out with unsaved progress?",
  description:
    "Signing out may discard changes that have not been uploaded. Those changes were not saved.",
  warning: "They will not be copied into guest progress on this device.",
  confirmLabel: "Sign out anyway",
};

export type ConflictAction = "upload-local" | "use-cloud";

export type ConflictConfirmationResult = ConflictAction | "cancel" | "stale";

export function resolveConflictConfirmation(input: {
  choice: "cancel" | "confirm";
  action: ConflictAction;
  openedFor: ConfirmedConflict;
  live: ConfirmedConflict | null;
  sessionUserId: string | null;
}): ConflictConfirmationResult {
  if (input.choice === "cancel") return "cancel";

  if (
    input.sessionUserId !== input.openedFor.userId ||
    !input.live ||
    input.live.userId !== input.openedFor.userId ||
    input.live.serverRevision !== input.openedFor.serverRevision
  ) {
    return "stale";
  }

  return input.action;
}

export function beginSignOut(hasPendingAccountChanges: boolean): "confirm" | "sign-out-now" {
  return hasPendingAccountChanges ? "confirm" : "sign-out-now";
}

export function resolveSignOutConfirmation(choice: "cancel" | "confirm"): {
  signOut: boolean;
  sessionPreserved: boolean;
} {
  if (choice === "cancel") return { signOut: false, sessionPreserved: true };

  return { signOut: true, sessionPreserved: false };
}

/**
 * Guest storage may be written only for a guest session whose
 * last persisted profile also belongs to the guest.
 * An account profile still in memory must not be copied there.
 */
export function mayWriteGuestProfile(input: {
  currentUserId: string | null;
  loadedUserId: string | null | undefined;
  persistedUserId: string | null;
}): boolean {
  return (
    input.currentUserId === null && input.loadedUserId === null && input.persistedUserId === null
  );
}
