// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConfirmActionDialog from "../../components/ConfirmActionDialog";
import {
  beginSignOut,
  CONFLICT_UPLOAD_CONFIRMATION,
  CONFLICT_USE_CLOUD_CONFIRMATION,
  mayWriteGuestProfile,
  resolveConflictConfirmation,
  resolveSignOutConfirmation,
  SIGN_OUT_CONFIRMATION,
} from "./persistenceSafety";

describe("conflict confirmation", () => {
  const openedFor = { userId: "user-1", serverRevision: 4 };
  const live = { userId: "user-1", serverRevision: 4 };

  it("cancels an upload without applying it", () => {
    expect(
      resolveConflictConfirmation({
        choice: "cancel",
        action: "upload-local",
        openedFor,
        live,
        sessionUserId: "user-1",
      }),
    ).toBe("cancel");
  });

  it("cancels using the cloud copy without applying it", () => {
    expect(
      resolveConflictConfirmation({
        choice: "cancel",
        action: "use-cloud",
        openedFor,
        live,
        sessionUserId: "user-1",
      }),
    ).toBe("cancel");
  });

  it("confirms replacing the cloud profile", () => {
    expect(CONFLICT_UPLOAD_CONFIRMATION.description).toMatch(/replace/i);
    expect(
      resolveConflictConfirmation({
        choice: "confirm",
        action: "upload-local",
        openedFor,
        live,
        sessionUserId: "user-1",
      }),
    ).toBe("upload-local");
  });

  it("confirms discarding unsaved local progress", () => {
    expect(CONFLICT_USE_CLOUD_CONFIRMATION.description).toMatch(/discarded/i);
    expect(
      resolveConflictConfirmation({
        choice: "confirm",
        action: "use-cloud",
        openedFor,
        live,
        sessionUserId: "user-1",
      }),
    ).toBe("use-cloud");
  });

  it("rejects a confirmation after the account changes", () => {
    expect(
      resolveConflictConfirmation({
        choice: "confirm",
        action: "upload-local",
        openedFor,
        live: { userId: "user-2", serverRevision: 4 },
        sessionUserId: "user-2",
      }),
    ).toBe("stale");

    expect(
      resolveConflictConfirmation({
        choice: "confirm",
        action: "use-cloud",
        openedFor,
        live,
        sessionUserId: "user-2",
      }),
    ).toBe("stale");
  });
});

describe("sign-out confirmation", () => {
  it("signs out immediately when nothing is pending", () => {
    expect(beginSignOut(false)).toBe("sign-out-now");
  });

  it("asks before signing out when account progress is pending", () => {
    expect(beginSignOut(true)).toBe("confirm");
    expect(SIGN_OUT_CONFIRMATION.description).toMatch(/not been uploaded/i);
    expect(SIGN_OUT_CONFIRMATION.description).toMatch(/were not saved/i);
    expect(SIGN_OUT_CONFIRMATION.warning).toMatch(/guest progress/i);
  });

  it("keeps the session when sign-out is cancelled", () => {
    expect(resolveSignOutConfirmation("cancel")).toEqual({
      signOut: false,
      sessionPreserved: true,
    });
  });

  it("signs out only after confirmation and does not copy account progress to guest storage", () => {
    expect(resolveSignOutConfirmation("confirm")).toEqual({
      signOut: true,
      sessionPreserved: false,
    });
    expect(
      mayWriteGuestProfile({
        currentUserId: null,
        loadedUserId: null,
        persistedUserId: "account-1",
      }),
    ).toBe(false);
    expect(
      mayWriteGuestProfile({
        currentUserId: null,
        loadedUserId: "account-1",
        persistedUserId: null,
      }),
    ).toBe(false);
    expect(
      mayWriteGuestProfile({
        currentUserId: null,
        loadedUserId: null,
        persistedUserId: null,
      }),
    ).toBe(true);
  });
});

describe("confirmation dialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("requires a click before replacing cloud progress", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmActionDialog
        {...CONFLICT_UPLOAD_CONFIRMATION}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(CONFLICT_UPLOAD_CONFIRMATION.description)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms discarding local progress only from the confirm button", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmActionDialog
        {...CONFLICT_USE_CLOUD_CONFIRMATION}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: CONFLICT_USE_CLOUD_CONFIRMATION.confirmLabel,
      }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
