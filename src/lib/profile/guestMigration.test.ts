import { describe, expect, it } from "vitest";
import { createDefaultProfile } from "./profileStorage";
import { getGuestImportEligibility, hasMeaningfulProgress } from "./guestMigration";

describe("guest progress migration", () => {
  it("treats a default profile as empty", () => {
    const profile = createDefaultProfile();

    expect(hasMeaningfulProgress(profile)).toBe(false);
  });

  it("recognizes rating changes as progress", () => {
    const profile = {
      ...createDefaultProfile(),
      estimatedRating: 850,
      bestRating: 850,
    };

    expect(hasMeaningfulProgress(profile)).toBe(true);
  });

  it("allows importing progress into an empty account", () => {
    const guestProfile = {
      ...createDefaultProfile(),
      estimatedRating: 850,
      bestRating: 850,
    };

    const accountProfile = createDefaultProfile();

    expect(getGuestImportEligibility(guestProfile, accountProfile)).toEqual({ eligible: true });
  });

  it("rejects importing when guest has no progress", () => {
    const guestProfile = createDefaultProfile();
    const accountProfile = createDefaultProfile();

    expect(getGuestImportEligibility(guestProfile, accountProfile)).toEqual({
      eligible: false,
      reason: "no-guest-progress",
    });
  });

  it("rejects importing into an account with progress", () => {
    const guestProfile = {
      ...createDefaultProfile(),
      estimatedRating: 850,
      bestRating: 850,
    };

    const accountProfile = {
      ...createDefaultProfile(),
      estimatedRating: 900,
      bestRating: 900,
    };

    expect(getGuestImportEligibility(guestProfile, accountProfile)).toEqual({
      eligible: false,
      reason: "account-not-empty",
    });
  });

  it("recognizes best-rating-only progress", () => {
    const profile = {
      ...createDefaultProfile(),
      bestRating: 950,
    };

    expect(hasMeaningfulProgress(profile)).toBe(true);
  });
});
